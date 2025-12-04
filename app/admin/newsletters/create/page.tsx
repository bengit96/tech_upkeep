"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  ExternalLink,
  ChevronLeft,
  Loader2,
  X,
  Edit,
  Check,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Save,
  Plus,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import {
  useUnassignedContent,
  useAcceptContent,
  useRejectContent,
  useMoveToPending,
  useSaveForFuture,
  useChangeCategory,
  useUpdateSummary,
  useUpdateSourceName,
  useGenerateDescription,
  useScrapeContent,
  useCreateNewsletter,
  useBulkTagContent,
} from "@/lib/api/hooks";

interface ContentItem {
  id: number;
  title: string;
  summary: string;
  description?: string;
  link: string;
  sourceType: string;
  sourceName: string;
  thumbnailUrl?: string;
  publishedAt: Date;
  category?: { name: string; slug: string };
  tags?: { name: string }[];
  qualityScore?: number;
  engagementScore?: number;
  featuredOrder?: number;
  status?: string;
}

export default function CreateNewsletterPage() {
  const router = useRouter();

  // SWR Hooks
  const {
    items: allItems,
    isLoading,
    mutate: mutateContent,
  } = useUnassignedContent();
  const { trigger: triggerAccept } = useAcceptContent();
  const { trigger: triggerReject } = useRejectContent();
  const { trigger: triggerMovePending } = useMoveToPending();
  const { trigger: triggerSaveForFuture } = useSaveForFuture();
  const { trigger: triggerChangeCategory } = useChangeCategory();
  const { trigger: triggerUpdateSummary } = useUpdateSummary();
  const { trigger: triggerUpdateSource } = useUpdateSourceName();
  const { trigger: triggerGenerateDescription } = useGenerateDescription();
  const { trigger: triggerScrape, isMutating: isScraping } = useScrapeContent();
  const { trigger: triggerCreateNewsletter } = useCreateNewsletter();
  const { trigger: triggerBulkTag } = useBulkTagContent();

  // Newsletter details
  const [newsletterName, setNewsletterName] = useState("");
  const [newsletterSubject, setNewsletterSubject] = useState("");

  // Local state for accepted items (with ordering and featured status)
  const [acceptedItems, setAcceptedItems] = useState<ContentItem[]>([]);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // Manual URL addition
  const [manualUrl, setManualUrl] = useState("");
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualUrlError, setManualUrlError] = useState<string | null>(null);

  // Edit states
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingSummary, setEditingSummary] = useState<string>("");
  const [editingSourceItemId, setEditingSourceItemId] = useState<number | null>(
    null
  );
  const [editingSourceName, setEditingSourceName] = useState<string>("");
  const [generatingItemIds, setGeneratingItemIds] = useState<Set<number>>(
    new Set()
  );
  const [generationErrors, setGenerationErrors] = useState<Map<number, string>>(
    new Map()
  );

  // Preview state
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Grouping toggle state
  const [groupByAuthor, setGroupByAuthor] = useState(false);

  // Organize items by status using useMemo
  const {
    acceptedItems: dbAccepted,
    pendingItems,
    rejectedItems,
    savedForFutureItems,
  } = useMemo(() => {
    const pending: ContentItem[] = [];
    const rejected: ContentItem[] = [];
    const saved: ContentItem[] = [];
    const accepted: ContentItem[] = [];

    allItems.forEach((item: ContentItem) => {
      if (item.status === "pending") {
        pending.push(item);
      } else if (item.status === "discarded") {
        rejected.push(item);
      } else if (item.status === "saved-for-next") {
        saved.push(item);
      } else if (item.status === "accepted") {
        accepted.push(item);
      }
    });

    return {
      pendingItems: pending,
      rejectedItems: rejected,
      savedForFutureItems: saved,
      acceptedItems: accepted,
    };
  }, [allItems]);

  // Sync dbAccepted with local acceptedItems state
  // This ensures the local state stays in sync with database changes while preserving local ordering/featured status
  useEffect(() => {
    if (!dbAccepted || dbAccepted.length === 0) {
      // If there are no accepted items in DB but we have local items, keep them
      // (they might be items we just accepted optimistically)
      return;
    }

    setAcceptedItems((prev) => {
      // Create maps for quick lookup
      const prevMap = new Map(prev.map((item) => [item.id, item]));
      const dbMap = new Map(dbAccepted.map((item) => [item.id, item]));

      // Items that exist in both: merge DB data with local state
      const synced = prev
        .filter((item) => dbMap.has(item.id))
        .map((item) => {
          const dbItem = dbMap.get(item.id)!;
          return {
            ...dbItem, // Get updated data from DB (includes summary, category, etc.)
            // ALWAYS preserve local featuredOrder for existing items (user might have just changed it)
            // Local state takes precedence until newsletter is saved to DB
            featuredOrder: item.featuredOrder,
          };
        });

      // New items from DB that aren't in local state yet (includes their featuredOrder from DB)
      const newItems = dbAccepted
        .filter((item) => !prevMap.has(item.id))
        .map((item) => ({ ...item }));

      // Check if there are actual changes to prevent unnecessary re-renders
      const hasChanges =
        synced.length !== prev.length ||
        newItems.length > 0 ||
        synced.some((syncedItem, idx) => {
          const prevItem = prev[idx];
          return (
            !prevItem ||
            syncedItem.id !== prevItem.id ||
            syncedItem.summary !== prevItem.summary ||
            syncedItem.category?.slug !== prevItem.category?.slug ||
            syncedItem.featuredOrder !== prevItem.featuredOrder
          );
        });

      if (!hasChanges) {
        return prev; // No changes, keep reference stable
      }

      return [...synced, ...newItems];
    });
  }, [dbAccepted]);

  // Auto-generate default name and subject on mount (no auto-scrape)
  useEffect(() => {
    const now = new Date();
    const defaultName = `Newsletter ${now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
    const defaultSubject = `Tech Upkeep - ${now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;

    setNewsletterName(defaultName);
    setNewsletterSubject(defaultSubject);
  }, []);

  // Grouping functions
  const groupByCategory = (items: ContentItem[]) => {
    const grouped: Record<string, ContentItem[]> = {};
    items.forEach((item) => {
      const categoryName = item.category?.name || "Uncategorized";
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(item);
    });
    return grouped;
  };

  const groupByAuthorName = (items: ContentItem[]) => {
    const grouped: Record<string, ContentItem[]> = {};
    items.forEach((item) => {
      const authorName = item.sourceName || "Unknown Source";
      if (!grouped[authorName]) {
        grouped[authorName] = [];
      }
      grouped[authorName].push(item);
    });
    // Sort by count (descending) so sources with most articles appear first
    return Object.fromEntries(
      Object.entries(grouped).sort(([, a], [, b]) => b.length - a.length)
    );
  };

  // Warning system: Check for duplicate sources and article count
  const getDuplicateSources = (items: ContentItem[]) => {
    const sourceCounts: Record<string, number> = {};
    items.forEach((item) => {
      const sourceName = item.sourceName || "Unknown";
      sourceCounts[sourceName] = (sourceCounts[sourceName] || 0) + 1;
    });

    return Object.entries(sourceCounts)
      .filter(([, count]) => count > 1)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getNewsletterWarnings = () => {
    const warnings: string[] = [];
    const count = acceptedItems.length;
    const duplicates = getDuplicateSources(acceptedItems);

    // Article count warnings
    if (count < 20) {
      warnings.push(`⚠️ Only ${count} articles (recommended: 20-35)`);
    } else if (count > 35) {
      warnings.push(`⚠️ ${count} articles is too many (recommended: 20-35)`);
    }

    // Duplicate source warnings
    if (duplicates.length > 0) {
      const totalDupes = duplicates.reduce((sum, d) => sum + (d.count - 1), 0);
      warnings.push(
        `⚠️ ${duplicates.length} sources with duplicates (${totalDupes} extra articles)`
      );
    }

    return warnings;
  };

  // Auto-update subject line with top 3 featured article titles
  useEffect(() => {
    const featuredArticles = acceptedItems
      .filter(
        (item) => item.featuredOrder && [1, 2, 3].includes(item.featuredOrder)
      )
      .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));

    if (featuredArticles.length > 0) {
      const now = new Date();
      const baseSubject = `Tech Upkeep - ${now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;

      const featuredTitles = featuredArticles
        .slice(0, 3)
        .map((item) => item.title)
        .join(" | ");

      setNewsletterSubject(`${baseSubject} - ${featuredTitles}`);
    }
  }, [acceptedItems]);

  const handleRescrape = async () => {
    try {
      const result = await triggerScrape();
      await mutateContent();
      alert(`✅ ${result.message || "Content scraped successfully"}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Scraping failed: ${message}`);
    }
  };

  const handleAddManualArticle = async () => {
    if (!manualUrl.trim()) {
      setManualUrlError("Please enter a valid URL");
      return;
    }

    setIsAddingManual(true);
    setManualUrlError(null);

    try {
      const response = await fetch("/api/admin/content/add-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: manualUrl.trim() }),
      });

      const data = await response.json();

      if (response.status === 409) {
        // Article already exists
        setManualUrlError(
          "This article already exists in the database. It may already be in your newsletter."
        );
        return;
      }

      if (!response.ok) {
        setManualUrlError(data.error || "Failed to add article");
        return;
      }

      // Successfully added - add to accepted items
      const newItem: ContentItem = {
        ...data.content,
        category: data.content.category || { name: "Uncategorized", slug: "" },
        tags: [],
      };

      setAcceptedItems((prev) => [newItem, ...prev]);
      setManualUrl("");

      // Show detailed success message
      let successMessage = `✅ Article added: ${newItem.title}`;
      if (data.sourceAdded && data.sourceFeedUrl) {
        successMessage += `\n\n🎉 Bonus: Found and added RSS feed for future scraping!\nSource: ${data.sourceName}\nFeed: ${data.sourceFeedUrl}`;
      } else if (data.sourceAdded) {
        successMessage += `\n\nℹ️ Source "${data.sourceName}" added but no RSS feed found.`;
      }
      alert(successMessage);

      // Refresh content to keep everything in sync
      await mutateContent();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setManualUrlError(`Failed to add article: ${message}`);
    } finally {
      setIsAddingManual(false);
    }
  };

  const moveToAccepted = async (item: ContentItem) => {
    try {
      // Optimistically update UI: add to accepted, remove from unassigned list
      setAcceptedItems((prev) => [...prev, item]);
      const previousItemsSnapshot = (allItems as ContentItem[]) || [];
      await mutateContent(
        {
          items: previousItemsSnapshot.filter((i) => i.id !== item.id),
        },
        { revalidate: false }
      );

      await triggerAccept({ contentId: item.id });
    } catch (error) {
      console.error("Error accepting content:", error);
      // Rollback optimistic removal
      await mutateContent(
        { items: allItems as ContentItem[] },
        { revalidate: true }
      );
    }
  };

  const moveToRejected = async (item: ContentItem) => {
    try {
      // Optimistically update UI: remove from accepted, mark as discarded in unassigned list
      setAcceptedItems((prev) => prev.filter((i) => i.id !== item.id));
      const previousItems = allItems as ContentItem[];
      const existsInUnassigned = previousItems.some((i) => i.id === item.id);
      const updatedItems = existsInUnassigned
        ? previousItems.map((i) =>
            i.id === item.id ? { ...i, status: "discarded" } : i
          )
        : [{ ...item, status: "discarded" }, ...previousItems];
      await mutateContent({ items: updatedItems }, { revalidate: false });

      await triggerReject({ contentId: item.id });
    } catch (error) {
      console.error("Error discarding content:", error);
      // Best-effort revalidate to correct UI
      await mutateContent(undefined, { revalidate: true });
    }
  };

  const moveToPending = async (item: ContentItem, fromStatus: string) => {
    try {
      // Optimistic update
      if (fromStatus === "accepted") {
        setAcceptedItems((prev) => prev.filter((i) => i.id !== item.id));
        // Add back to unassigned as pending
        await mutateContent(
          {
            items: [
              { ...item, status: "pending" },
              ...(allItems as ContentItem[]),
            ],
          },
          { revalidate: false }
        );
      } else {
        // Update status inside unassigned list
        const updated = (allItems as ContentItem[]).map((i) =>
          i.id === item.id ? { ...i, status: "pending" } : i
        );
        await mutateContent({ items: updated }, { revalidate: false });
      }

      await triggerMovePending({ contentId: item.id });
    } catch (error) {
      console.error("Error moving to pending:", error);
      await mutateContent(undefined, { revalidate: true });
    }
  };

  const saveForFuture = async (item: ContentItem) => {
    try {
      // Optimistic update: ensure item shows under Saved column in unassigned list
      setAcceptedItems((prev) => prev.filter((i) => i.id !== item.id));
      const previousItems = allItems as ContentItem[];
      const existsInUnassigned = previousItems.some((i) => i.id === item.id);
      const updatedItems = existsInUnassigned
        ? previousItems.map((i) =>
            i.id === item.id ? { ...i, status: "saved-for-next" } : i
          )
        : [{ ...item, status: "saved-for-next" }, ...previousItems];
      await mutateContent({ items: updatedItems }, { revalidate: false });

      await triggerSaveForFuture({ contentId: item.id });
    } catch (error) {
      console.error("Error saving for future:", error);
      await mutateContent(undefined, { revalidate: true });
    }
  };

  const changeCategory = async (item: ContentItem, newCategorySlug: string) => {
    try {
      const data = await triggerChangeCategory({
        contentId: item.id,
        categorySlug: newCategorySlug,
      });

      setAcceptedItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                category: {
                  name: data.category.name,
                  slug: data.category.slug,
                },
              }
            : i
        )
      );
    } catch (error) {
      console.error("Error changing category:", error);
    }
  };

  const toggleFeatured = (item: ContentItem, order: number) => {
    const newOrder = item.featuredOrder === order ? undefined : order;

    setAcceptedItems((prev) => {
      // First, clear the order from any other item
      const cleared = prev.map((i) =>
        i.id !== item.id && i.featuredOrder === order
          ? { ...i, featuredOrder: undefined }
          : i
      );

      // Then update the current item
      return cleared.map((i) =>
        i.id === item.id ? { ...i, featuredOrder: newOrder } : i
      );
    });
  };

  const startEditingSummary = (item: ContentItem) => {
    setEditingItemId(item.id);
    setEditingSummary(item.summary);
  };

  const cancelEditingSummary = () => {
    setEditingItemId(null);
    setEditingSummary("");
  };

  const saveSummary = async (item: ContentItem) => {
    try {
      await triggerUpdateSummary({
        contentId: item.id,
        summary: editingSummary,
      });

      setAcceptedItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, summary: editingSummary } : i
        )
      );

      await mutateContent();

      setEditingItemId(null);
      setEditingSummary("");
    } catch (error) {
      console.error("Error updating summary:", error);
      alert("Failed to update summary");
    }
  };

  const startEditingSourceName = (item: ContentItem) => {
    setEditingSourceItemId(item.id);
    setEditingSourceName(item.sourceName);
  };

  const cancelEditingSourceName = () => {
    setEditingSourceItemId(null);
    setEditingSourceName("");
  };

  const saveSourceName = async (item: ContentItem) => {
    try {
      await triggerUpdateSource({
        contentId: item.id,
        sourceName: editingSourceName,
      });

      setAcceptedItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, sourceName: editingSourceName } : i
        )
      );

      await mutateContent();

      setEditingSourceItemId(null);
      setEditingSourceName("");
    } catch (error) {
      console.error("Error updating source name:", error);
      alert("Failed to update source name");
    }
  };

  const generateDescription = async (item: ContentItem) => {
    setGenerationErrors((prev) => {
      const newErrors = new Map(prev);
      newErrors.delete(item.id);
      return newErrors;
    });

    setGeneratingItemIds((prev) => new Set(prev).add(item.id));

    try {
      const data = await triggerGenerateDescription({ contentId: item.id });

      setAcceptedItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                summary: data.description,
                description: data.description,
              }
            : i
        )
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate description";
      setGenerationErrors((prev) => new Map(prev).set(item.id, message));
    } finally {
      setGeneratingItemIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const generateAllDescriptions = async () => {
    const itemsNeedingDescription = acceptedItems.filter(
      (item) => !item.description
    );

    if (itemsNeedingDescription.length === 0) {
      alert("All accepted items already have AI-generated descriptions!");
      return;
    }

    if (
      !confirm(
        `Generate AI descriptions for ${itemsNeedingDescription.length} articles? This may take a few minutes.`
      )
    ) {
      return;
    }

    setIsGeneratingAll(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const item of itemsNeedingDescription) {
        try {
          const data = await triggerGenerateDescription({ contentId: item.id });

          setAcceptedItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    summary: data.description,
                    description: data.description,
                  }
                : i
            )
          );
          successCount++;

          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          failCount++;
          console.error(
            `Error generating description for item ${item.id}:`,
            error
          );
        }
      }

      alert(
        `Generated descriptions for ${successCount} articles. ${failCount > 0 ? `Failed: ${failCount}` : ""}`
      );
    } catch (error) {
      console.error("Error generating all descriptions:", error);
      alert("Error generating descriptions");
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleSaveNewsletter = async () => {
    if (!newsletterName.trim() || !newsletterSubject.trim()) {
      alert("Please fill in the newsletter name and subject");
      return;
    }

    if (acceptedItems.length === 0) {
      alert("Please accept at least one article for the newsletter");
      return;
    }

    if (!confirm(`Create newsletter with ${acceptedItems.length} articles?`)) {
      return;
    }

    setIsSaving(true);
    try {
      // 1. Create the newsletter draft
      const { draft } = await triggerCreateNewsletter({
        name: newsletterName,
        subject: newsletterSubject,
      });

      // 2. Bulk tag accepted articles to the newsletter
      await triggerBulkTag({
        newsletterDraftId: draft.id,
        contentIds: acceptedItems.map((item) => item.id),
        featuredOrders: acceptedItems.reduce(
          (acc, item) => {
            if (item.featuredOrder) {
              acc[item.id] = item.featuredOrder;
            }
            return acc;
          },
          {} as Record<number, number>
        ),
      });

      alert(
        `Newsletter created with ${acceptedItems.length} articles! Pending and saved-for-future items remain available.`
      );
      router.push(`/admin/newsletters/${draft.id}/build`);
    } catch (error) {
      console.error("Error saving newsletter:", error);
      const message = error instanceof Error ? error.message : String(error);
      alert(`Error saving newsletter: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getSourceBadgeColor = (sourceType: string) => {
    const colors: Record<string, string> = {
      youtube: "bg-red-900/30 text-red-300 border-red-800",
      twitter: "bg-blue-900/30 text-blue-300 border-blue-800",
      article: "bg-green-900/30 text-green-300 border-green-800",
      reddit: "bg-orange-900/30 text-orange-300 border-orange-800",
      substack: "bg-purple-900/30 text-purple-300 border-purple-800",
      podcast: "bg-indigo-900/30 text-indigo-300 border-indigo-800",
      github: "bg-gray-900/50 text-gray-200 border-gray-700",
      medium: "bg-emerald-900/30 text-emerald-300 border-emerald-800",
    };
    return colors[sourceType] || "bg-gray-800/50 text-gray-300 border-gray-700";
  };

  const categories = [
    {
      name: "Frontend ⚛️",
      slug: "frontend-engineering",
      color:
        "bg-purple-900/30 text-purple-300 hover:bg-purple-900/50 border border-purple-800",
    },
    {
      name: "Backend ⚙️",
      slug: "backend-apis",
      color:
        "bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-800",
    },
    {
      name: "Cloud & DevOps ☁️",
      slug: "cloud-devops",
      color:
        "bg-cyan-900/30 text-cyan-300 hover:bg-cyan-900/50 border border-cyan-800",
    },
    {
      name: "AI 🤖",
      slug: "ai-machine-learning",
      color:
        "bg-pink-900/30 text-pink-300 hover:bg-pink-900/50 border border-pink-800",
    },
    {
      name: "System Design 📦",
      slug: "system-design-architecture",
      color:
        "bg-blue-900/30 text-blue-300 hover:bg-blue-900/50 border border-blue-800",
    },
    {
      name: "Security 🔒",
      slug: "security",
      color:
        "bg-red-900/30 text-red-300 hover:bg-red-900/50 border border-red-800",
    },
    {
      name: "Dev Tools 🛠️",
      slug: "developer-tools",
      color:
        "bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50 border border-yellow-800",
    },
    {
      name: "Career 📈",
      slug: "career-leadership",
      color:
        "bg-green-900/30 text-green-300 hover:bg-green-900/50 border border-green-800",
    },
    {
      name: "Product & Culture 🚀",
      slug: "product",
      color:
        "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50 border border-indigo-800",
    },
    {
      name: "Opinions 💭",
      slug: "opinions-general",
      color:
        "bg-orange-900/30 text-orange-300 hover:bg-orange-900/50 border border-orange-800",
    },
  ];

  // Newsletter Preview Modal
  const FullNewsletterPreviewModal = () => {
    if (!showFullPreview) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
        onClick={() => setShowFullPreview(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 border border-gray-800 rounded-lg max-w-7xl w-full h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-bold text-gray-100">
                Full Newsletter Preview
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullPreview(false)}
                className="text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Subject Line Display */}
            {newsletterSubject && (
              <div className="space-y-2 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Subject Line
                  </label>
                  <p className="text-sm text-gray-100 font-medium mt-1">
                    {newsletterSubject}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {/* Load actual email HTML in iframe */}
            <iframe
              src="/api/admin/newsletter-preview"
              className="w-full h-full border-0"
              title="Newsletter Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const ContentCard = ({
    item,
    status,
  }: {
    item: ContentItem;
    status: "pending" | "accepted" | "rejected" | "saved";
  }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="mb-3 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 hover:border-gray-600 transition-all cursor-move backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-grow min-w-0">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-gray-100 hover:text-blue-400 inline-flex items-center gap-1 mb-1 line-clamp-2"
              >
                {item.title}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>

              <div className="flex flex-wrap items-center gap-1 mb-2 text-xs">
                <span
                  className={`px-1.5 py-0.5 rounded border ${getSourceBadgeColor(item.sourceType)}`}
                >
                  {item.sourceType.toUpperCase()}
                </span>
                {editingSourceItemId === item.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={editingSourceName}
                      onChange={(e) => setEditingSourceName(e.target.value)}
                      className="flex-1 min-w-0 text-xs text-gray-200 bg-gray-900/50 border border-gray-700 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          saveSourceName(item);
                        } else if (e.key === "Escape") {
                          cancelEditingSourceName();
                        }
                      }}
                    />
                    <button
                      onClick={() => saveSourceName(item)}
                      className="p-1 bg-green-600 hover:bg-green-700 rounded text-white"
                      title="Save"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      onClick={cancelEditingSourceName}
                      className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                      title="Cancel"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 group">
                    <span className="text-gray-400 truncate">
                      {item.sourceName}
                    </span>
                    <button
                      onClick={() => startEditingSourceName(item)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded"
                      title="Edit author/source"
                    >
                      <Edit className="h-3 w-3 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>

              {editingItemId === item.id ? (
                <div className="mb-2">
                  <textarea
                    value={editingSummary}
                    onChange={(e) => setEditingSummary(e.target.value)}
                    className="w-full text-xs text-gray-200 bg-gray-900/50 border border-gray-700 rounded p-2 min-h-[60px] focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <div className="flex gap-1 mt-1">
                    <Button
                      size="sm"
                      onClick={() => saveSummary(item)}
                      className="h-6 text-xs bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditingSummary}
                      className="h-6 text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-2 group relative">
                  <p className="text-xs text-gray-300 line-clamp-2">
                    {item.summary}
                  </p>
                  <button
                    onClick={() => startEditingSummary(item)}
                    className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-800 rounded border border-gray-700 shadow-sm hover:bg-gray-700"
                    title="Edit description"
                  >
                    <Edit className="h-3 w-3 text-gray-300" />
                  </button>
                </div>
              )}

              {status === "accepted" && (
                <div className="mb-2">
                  <p className="text-xs text-gray-400 mb-1">Change category:</p>
                  <div className="flex flex-wrap gap-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => changeCategory(item, cat.slug)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          item.category?.slug === cat.slug
                            ? cat.color + " ring-2 ring-offset-0 ring-blue-500"
                            : cat.color + " opacity-50 hover:opacity-75"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {status === "pending" && (
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    onClick={() => moveToAccepted(item)}
                    className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveForFuture(item)}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save for Future
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => moveToRejected(item)}
                    className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                  >
                    Reject
                  </Button>
                </div>
              )}

              {status === "accepted" && (
                <div className="space-y-2">
                  <div className="flex gap-1 items-center mb-2 pb-2 border-b border-gray-700">
                    <span className="text-xs text-gray-400 mr-1">
                      Featured:
                    </span>
                    {[1, 2, 3].map((order) => (
                      <button
                        key={order}
                        onClick={() => toggleFeatured(item, order)}
                        className={`text-lg transition-all ${
                          item.featuredOrder === order
                            ? "text-yellow-400 hover:text-yellow-500 scale-110"
                            : "text-gray-600 hover:text-gray-400"
                        }`}
                        title={
                          item.featuredOrder === order
                            ? `Unfeature #${order}`
                            : `Mark as featured #${order}`
                        }
                      >
                        ⭐
                      </button>
                    ))}
                    {item.featuredOrder && (
                      <span className="text-xs text-yellow-400 ml-1">
                        #{item.featuredOrder}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => generateDescription(item)}
                      disabled={generatingItemIds.has(item.id)}
                      className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        item.description
                          ? "Regenerate AI description"
                          : "Generate AI description"
                      }
                    >
                      {generatingItemIds.has(item.id) ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          {item.description ? "Regenerate" : "Generate"}
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveForFuture(item)}
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save for Future
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveToPending(item, "accepted")}
                      className="h-7 text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Move to Pending
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => moveToRejected(item)}
                      className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                    >
                      Reject
                    </Button>
                  </div>
                  {generationErrors.has(item.id) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 p-2 bg-red-900/30 border border-red-800 rounded text-xs text-red-300"
                    >
                      <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Generation failed</p>
                        <p className="text-red-400">
                          {generationErrors.get(item.id)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setGenerationErrors((prev) => {
                            const newErrors = new Map(prev);
                            newErrors.delete(item.id);
                            return newErrors;
                          });
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {status === "rejected" && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveToPending(item, "rejected")}
                    className="h-7 text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Move to Pending
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => moveToAccepted(item)}
                    className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                  >
                    Accept
                  </Button>
                </div>
              )}

              {status === "saved" && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveToPending(item, "saved")}
                    className="h-7 text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Move to Pending
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => moveToAccepted(item)}
                    className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                  >
                    Accept
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-950 p-6 relative overflow-hidden">
      {/* Animated Tech Grid Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/10 via-gray-900 to-purple-950/10"></div>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      ></div>

      <div className="max-w-[1800px] mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/admin"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-100 mb-1">
            Create New Newsletter
          </h1>
          <p className="text-sm text-gray-400">
            Fill in newsletter details and curate articles in one place
          </p>
        </motion.div>

        {/* Newsletter Details Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-200">
                    Newsletter Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={newsletterName}
                    onChange={(e) => setNewsletterName(e.target.value)}
                    placeholder="Newsletter Jan 15, 2025"
                    className="bg-gray-900/50 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Internal tracking name
                  </p>
                </div>

                <div>
                  <Label htmlFor="subject" className="text-gray-200">
                    Subject Line *
                  </Label>
                  <Input
                    id="subject"
                    type="text"
                    value={newsletterSubject}
                    onChange={(e) => setNewsletterSubject(e.target.value)}
                    placeholder="Tech Upkeep - Jan 15, 2025"
                    className="bg-gray-900/50 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email subject line
                  </p>
                </div>

                <div>
                  <Label htmlFor="manualUrl" className="text-gray-200">
                    Add Article by URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="manualUrl"
                      type="url"
                      value={manualUrl}
                      onChange={(e) => {
                        setManualUrl(e.target.value);
                        setManualUrlError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddManualArticle();
                        }
                      }}
                      placeholder="https://example.com/article"
                      className="bg-gray-900/50 border-gray-700 text-gray-100 placeholder:text-gray-500"
                      disabled={isAddingManual}
                    />
                    <Button
                      onClick={handleAddManualArticle}
                      disabled={isAddingManual || !manualUrl.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    >
                      {isAddingManual ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {manualUrlError ? (
                    <p className="text-xs text-red-400 mt-1">{manualUrlError}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Manually add external article
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleRescrape}
                  disabled={isScraping}
                  variant="outline"
                  className="bg-blue-700/50 border-blue-600 text-blue-200 hover:bg-blue-700 hover:text-white"
                >
                  {isScraping ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Scrape Again
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setShowFullPreview(true)}
                  disabled={acceptedItems.length === 0}
                  variant="outline"
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Newsletter
                </Button>

                <Button
                  onClick={handleSaveNewsletter}
                  disabled={isSaving || acceptedItems.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Newsletter ({acceptedItems.length})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading State */}
        {(isLoading || isScraping) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-300 text-lg font-medium">
              Scraping fresh content...
            </p>
            <p className="text-gray-500 text-sm">
              This will take a moment as we fetch the latest articles
            </p>
          </motion.div>
        )}

        {/* Four Column Layout */}
        {!isLoading && !isScraping && (
          <div className="grid grid-cols-4 gap-4">
            {/* Pending Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col"
            >
              <div className="bg-yellow-950/30 border-2 border-yellow-800 rounded-lg p-3 mb-3 backdrop-blur-sm">
                <h2 className="text-lg font-bold text-yellow-200 flex items-center gap-2">
                  <span>📋 Pending</span>
                  <span className="text-sm bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-2 py-1 rounded">
                    {pendingItems.length}
                  </span>
                </h2>
                <p className="text-xs text-yellow-400 mt-1">
                  Unassigned articles (not in other newsletters)
                </p>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-400px)]">
                <AnimatePresence>
                  {pendingItems.map((item) => (
                    <ContentCard key={item.id} item={item} status="pending" />
                  ))}
                </AnimatePresence>
                {pendingItems.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-gray-400 text-sm py-8"
                  >
                    No pending items. Click "Scrape Again" to get more content.
                  </motion.p>
                )}
              </div>
            </motion.div>

            {/* Accepted Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col"
            >
              <div className="bg-green-950/30 border-2 border-green-800 rounded-lg p-3 mb-3 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-green-200 flex items-center gap-2">
                        <span>✅ Accepted</span>
                        <span className="text-sm bg-green-900/50 border border-green-700 text-green-200 px-2 py-1 rounded">
                          {acceptedItems.length}
                        </span>
                      </h2>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setGroupByAuthor(!groupByAuthor)}
                        className="h-6 text-xs text-green-300 hover:text-green-100 hover:bg-green-900/50 px-2"
                      >
                        {groupByAuthor ? "📚 Categories" : "👤 Authors"}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-green-400">
                        {groupByAuthor
                          ? "Grouped by authors"
                          : "Grouped by categories"}
                      </p>
                    </div>
                    {/* Warnings */}
                    {getNewsletterWarnings().map((warning, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mt-1 text-xs font-medium text-orange-300 bg-orange-900/30 border border-orange-800 rounded px-2 py-1"
                      >
                        {warning}
                      </motion.div>
                    ))}
                  </div>
                  {acceptedItems.length > 0 && (
                    <Button
                      size="sm"
                      onClick={generateAllDescriptions}
                      disabled={isGeneratingAll}
                      className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                    >
                      {isGeneratingAll ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Generate All
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-400px)]">
                {acceptedItems.length === 0 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-gray-400 text-sm py-8"
                  >
                    No accepted items yet. Accept articles from the left column.
                  </motion.p>
                ) : (
                  Object.entries(
                    groupByAuthor
                      ? groupByAuthorName(acceptedItems)
                      : groupByCategory(acceptedItems)
                  ).map(([groupName, items]) => (
                    <div key={groupName} className="mb-4">
                      <h3
                        className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded mb-2 flex items-center justify-between ${
                          groupByAuthor
                            ? "text-blue-200 bg-blue-900/30 border border-blue-800"
                            : "text-green-200 bg-green-900/30 border border-green-800"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {groupByAuthor && "👤"} {groupName}
                          {groupByAuthor && items.length > 1 && (
                            <span
                              className="ml-1 text-orange-300 font-bold"
                              title="Duplicate source - multiple articles from same author"
                            >
                              ⚠️
                            </span>
                          )}
                        </span>
                        <span
                          className={`px-1.5 rounded text-xs ${
                            groupByAuthor && items.length > 1
                              ? "bg-orange-800/50 text-orange-200 font-bold"
                              : groupByAuthor
                                ? "bg-blue-800/50"
                                : "bg-green-800/50"
                          }`}
                        >
                          {items.length}
                        </span>
                      </h3>
                      <Reorder.Group
                        axis="y"
                        values={items}
                        onReorder={(reorderedItems) => {
                          // Update acceptedItems while preserving order within this group
                          const otherGroups = acceptedItems.filter((item) =>
                            groupByAuthor
                              ? (item.sourceName || "Unknown Source") !==
                                groupName
                              : (item.category?.name || "Uncategorized") !==
                                groupName
                          );
                          setAcceptedItems([...otherGroups, ...reorderedItems]);
                        }}
                      >
                        <AnimatePresence>
                          {items.map((item) => (
                            <Reorder.Item key={item.id} value={item}>
                              <ContentCard item={item} status="accepted" />
                            </Reorder.Item>
                          ))}
                        </AnimatePresence>
                      </Reorder.Group>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Saved for Future Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col"
            >
              <div className="bg-blue-950/30 border-2 border-blue-800 rounded-lg p-3 mb-3 backdrop-blur-sm">
                <h2 className="text-lg font-bold text-blue-200 flex items-center gap-2">
                  <span>💾 Saved for Future</span>
                  <span className="text-sm bg-blue-900/50 border border-blue-700 text-blue-200 px-2 py-1 rounded">
                    {savedForFutureItems.length}
                  </span>
                </h2>
                <p className="text-xs text-blue-400 mt-1">
                  Will not be included in this newsletter
                </p>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-400px)]">
                <AnimatePresence>
                  {savedForFutureItems.map((item) => (
                    <ContentCard key={item.id} item={item} status="saved" />
                  ))}
                </AnimatePresence>
                {savedForFutureItems.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-gray-400 text-sm py-8"
                  >
                    No saved items
                  </motion.p>
                )}
              </div>
            </motion.div>

            {/* Rejected Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col"
            >
              <div className="bg-red-950/30 border-2 border-red-800 rounded-lg p-3 mb-3 backdrop-blur-sm">
                <h2 className="text-lg font-bold text-red-200 flex items-center gap-2">
                  <span>❌ Rejected</span>
                  <span className="text-sm bg-red-900/50 border border-red-700 text-red-200 px-2 py-1 rounded">
                    {rejectedItems.length}
                  </span>
                </h2>
                <p className="text-xs text-red-400 mt-1">
                  Will be marked as discarded
                </p>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-400px)]">
                <AnimatePresence>
                  {rejectedItems.map((item) => (
                    <ContentCard key={item.id} item={item} status="rejected" />
                  ))}
                </AnimatePresence>
                {rejectedItems.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-gray-400 text-sm py-8"
                  >
                    No rejected items
                  </motion.p>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Full Newsletter Preview Modal */}
        <AnimatePresence>
          {showFullPreview && <FullNewsletterPreviewModal />}
        </AnimatePresence>
      </div>
    </div>
  );
}
