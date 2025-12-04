"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  ChevronLeft,
  Loader2,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import ContentCard from "./components/ContentCard";
import { FullNewsletterPreviewModal } from "./components/FullNewsletterPreviewModal";

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
  featuredOrder?: number; // 1, 2, or 3 for featured articles
}

interface GroupedContent {
  [key: string]: ContentItem[];
}

interface Batch {
  id: number;
  name: string;
  status: string;
  createdAt: string; // ISO date string from Postgres
  counts: {
    pending: number;
    accepted: number;
    discarded: number;
  };
}

interface MergePreview {
  totalItems: number;
  finalUniqueItems: number;
  duplicatesWithinBatches: number;
  alreadyAccepted: number;
  alreadyRejected: number;
}

export default function CuratePage() {
  const [pendingItems, setPendingItems] = useState<ContentItem[]>([]);
  const [acceptedItems, setAcceptedItems] = useState<ContentItem[]>([]);
  const [rejectedItems, setRejectedItems] = useState<ContentItem[]>([]);
  const [savedForFutureItems, setSavedForFutureItems] = useState<ContentItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingSummary, setEditingSummary] = useState<string>("");
  const [editingSourceItemId, setEditingSourceItemId] = useState<number | null>(
    null
  );
  const [editingSourceName, setEditingSourceName] = useState<string>("");
  const [headerContent, setHeaderContent] = useState<string>("");
  const [footerContent, setFooterContent] = useState<string>("");
  const [showNewsletterConfig, setShowNewsletterConfig] = useState(false);
  const [generatingItemIds, setGeneratingItemIds] = useState<Set<number>>(
    new Set()
  );
  const [generationErrors, setGenerationErrors] = useState<Map<number, string>>(
    new Map()
  );

  // Batch management state
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [showBatchManager, setShowBatchManager] = useState(false);
  const [mergePreview, setMergePreview] = useState<MergePreview | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  // Manual article addition state
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [articleUrl, setArticleUrl] = useState("");
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [addArticleError, setAddArticleError] = useState<string | null>(null);

  // Grouping toggle state
  const [groupByAuthor, setGroupByAuthor] = useState(false);

  // Newsletter scheduling state (removed unused for lint cleanliness)

  // Newsletter subject line state
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [preheaderText, setPreheaderText] = useState("");
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");

  useEffect(() => {
    fetchContent();
    fetchNewsletterConfig();
    fetchBatches();
    fetchNewsletterSubject();
  }, []);

  // Refetch subject line when accepted items change
  useEffect(() => {
    if (acceptedItems.length > 0) {
      fetchNewsletterSubject();
    }
  }, [acceptedItems.length]);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const [pendingRes, acceptedRes, rejectedRes, savedRes] =
        await Promise.all([
          fetch("/api/admin/content?status=pending&limit=100"),
          fetch("/api/admin/content?status=accepted&limit=100"),
          fetch("/api/admin/content?status=discarded&limit=100"),
          fetch("/api/admin/content?status=saved-for-next&limit=100"),
        ]);

      const pendingData = await pendingRes.json();
      const acceptedData = await acceptedRes.json();
      const rejectedData = await rejectedRes.json();
      const savedData = await savedRes.json();

      setPendingItems(pendingData.items || []);
      setAcceptedItems(acceptedData.items || []);
      setRejectedItems(rejectedData.items || []);
      setSavedForFutureItems(savedData.items || []);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNewsletterConfig = async () => {
    try {
      const response = await fetch("/api/admin/newsletter-config");
      if (response.ok) {
        const data = await response.json();
        setHeaderContent(data.headerContent || "");
        setFooterContent(data.footerContent || "");
      }
    } catch (error) {
      console.error("Error fetching newsletter config:", error);
    }
  };

  const fetchNewsletterSubject = async () => {
    try {
      const response = await fetch("/api/admin/newsletter-subject");
      if (response.ok) {
        const data = await response.json();
        setNewsletterSubject(data.subject || "");
        setPreheaderText(data.preheaderText || "");
      }
    } catch (error) {
      console.error("Error fetching newsletter subject:", error);
    }
  };

  const startEditingSubject = () => {
    setEditedSubject(newsletterSubject);
    setIsEditingSubject(true);
  };

  const cancelEditingSubject = () => {
    setIsEditingSubject(false);
    setEditedSubject("");
  };

  const saveSubject = () => {
    // Only update if the subject actually changed
    if (editedSubject !== newsletterSubject) {
      setNewsletterSubject(editedSubject);
    }
    setIsEditingSubject(false);
    // Note: This only updates the local state for preview
    // The actual subject is generated dynamically when sending
  };

  const saveNewsletterConfig = async () => {
    try {
      const response = await fetch("/api/admin/newsletter-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headerContent, footerContent }),
      });

      if (response.ok) {
        alert("Newsletter config saved!");
      } else {
        alert("Failed to save newsletter config");
      }
    } catch (error) {
      console.error("Error saving newsletter config:", error);
      alert("Error saving newsletter config");
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch("/api/admin/batches");
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const toggleBatchSelection = (batchId: number) => {
    setSelectedBatchIds((prev) =>
      prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId]
    );
  };

  const previewMerge = async () => {
    if (selectedBatchIds.length < 2) {
      alert("Please select at least 2 batches to merge");
      return;
    }

    try {
      const response = await fetch("/api/admin/batches/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchIds: selectedBatchIds, previewOnly: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setMergePreview(data.stats);
      } else {
        alert("Failed to preview merge");
      }
    } catch (error) {
      console.error("Error previewing merge:", error);
      alert("Error previewing merge");
    }
  };

  const executeMerge = async () => {
    if (
      !confirm(
        `Merge ${selectedBatchIds.length} batches? This will create a new deduplicated batch.`
      )
    ) {
      return;
    }

    setIsMerging(true);
    try {
      const response = await fetch("/api/admin/batches/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchIds: selectedBatchIds,
          previewOnly: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `Merge successful! Created "${data.mergedBatch.name}" with ${data.stats.finalUniqueItems} items`
        );

        // Reset state
        setSelectedBatchIds([]);
        setMergePreview(null);

        // Refresh data
        fetchBatches();
        fetchContent();
      } else {
        const data = await response.json();
        alert(`Failed to merge: ${data.error}`);
      }
    } catch (error) {
      console.error("Error merging batches:", error);
      alert("Error merging batches");
    } finally {
      setIsMerging(false);
    }
  };

  const moveToAccepted = async (item: ContentItem) => {
    try {
      // First, accept the article
      const response = await fetch("/api/admin/content/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id }),
      });

      if (response.ok) {
        setPendingItems((prev) => prev.filter((i) => i.id !== item.id));
        setRejectedItems((prev) => prev.filter((i) => i.id !== item.id));
        setAcceptedItems((prev) => [...prev, item]);

        // Then, generate AI description in the background
        // Update the item's summary when description is ready
        fetch("/api/admin/content/generate-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId: item.id }),
        })
          .then(async (descResponse) => {
            if (descResponse.ok) {
              const data = await descResponse.json();
              // Update the item's summary in the accepted list with AI-generated description
              setAcceptedItems((prev) =>
                prev.map((i) =>
                  i.id === item.id ? { ...i, summary: data.description } : i
                )
              );
            }
          })
          .catch((error) => {
            console.error("Error generating description:", error);
            // Silently fail - user can still use the article without AI description
          });
      }
    } catch (error) {
      console.error("Error accepting content:", error);
    }
  };

  const moveToRejected = async (item: ContentItem) => {
    try {
      const response = await fetch("/api/admin/content/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id }),
      });

      if (response.ok) {
        setPendingItems((prev) => prev.filter((i) => i.id !== item.id));
        setAcceptedItems((prev) => prev.filter((i) => i.id !== item.id));
        setRejectedItems((prev) => [...prev, item]);
      }
    } catch (error) {
      console.error("Error discarding content:", error);
    }
  };

  const moveToPending = async (item: ContentItem, fromStatus: string) => {
    try {
      const response = await fetch("/api/admin/content/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id }),
      });

      if (response.ok) {
        if (fromStatus === "accepted") {
          setAcceptedItems((prev) => prev.filter((i) => i.id !== item.id));
        } else {
          setRejectedItems((prev) => prev.filter((i) => i.id !== item.id));
        }
        setPendingItems((prev) => [...prev, item]);
      }
    } catch (error) {
      console.error("Error moving to pending:", error);
    }
  };

  const changeCategory = async (item: ContentItem, newCategorySlug: string) => {
    try {
      const response = await fetch("/api/admin/content/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: item.id,
          categorySlug: newCategorySlug,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the item's category in state
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
      }
    } catch (error) {
      console.error("Error changing category:", error);
    }
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
      const response = await fetch("/api/admin/content/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id, summary: editingSummary }),
      });

      if (response.ok) {
        // Update the item's summary in all states
        const updateSummary = (items: ContentItem[]) =>
          items.map((i) =>
            i.id === item.id ? { ...i, summary: editingSummary } : i
          );

        setPendingItems((prev) => updateSummary(prev));
        setAcceptedItems((prev) => updateSummary(prev));
        setRejectedItems((prev) => updateSummary(prev));

        setEditingItemId(null);
        setEditingSummary("");
      } else {
        alert("Failed to update summary");
      }
    } catch (error) {
      console.error("Error updating summary:", error);
      alert("Error updating summary");
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
      const response = await fetch("/api/admin/content/update-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: item.id,
          sourceName: editingSourceName,
        }),
      });

      if (response.ok) {
        // Update the item's sourceName in all states
        const updateSourceName = (items: ContentItem[]) =>
          items.map((i) =>
            i.id === item.id ? { ...i, sourceName: editingSourceName } : i
          );

        setPendingItems((prev) => updateSourceName(prev));
        setAcceptedItems((prev) => updateSourceName(prev));
        setRejectedItems((prev) => updateSourceName(prev));
        setSavedForFutureItems((prev) => updateSourceName(prev));

        setEditingSourceItemId(null);
        setEditingSourceName("");
      } else {
        alert("Failed to update source name");
      }
    } catch (error) {
      console.error("Error updating source name:", error);
      alert("Error updating source name");
    }
  };

  const saveForFuture = async (item: ContentItem) => {
    try {
      const response = await fetch("/api/admin/content/save-for-next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id }),
      });

      if (response.ok) {
        // Remove from current lists and add to saved for future
        setPendingItems((prev) => prev.filter((i) => i.id !== item.id));
        setAcceptedItems((prev) => prev.filter((i) => i.id !== item.id));
        setRejectedItems((prev) => prev.filter((i) => i.id !== item.id));
        setSavedForFutureItems((prev) => [...prev, item]);
      }
    } catch (error) {
      console.error("Error saving for future:", error);
      alert("Error saving for future");
    }
  };

  const toggleFeatured = async (item: ContentItem, order: number) => {
    try {
      // If clicking the same star, unfeature it
      const newOrder = item.featuredOrder === order ? undefined : order;

      const response = await fetch("/api/admin/content/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id, featuredOrder: newOrder }),
      });

      if (response.ok) {
        // Update the item in acceptedItems list
        setAcceptedItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, featuredOrder: newOrder } : i
          )
        );

        // If setting a featured order, clear it from any other item
        if (newOrder !== null) {
          setAcceptedItems((prev) =>
            prev.map((i) =>
              i.id !== item.id && i.featuredOrder === newOrder
                ? { ...i, featuredOrder: undefined }
                : i
            )
          );
        }
      }
    } catch (error) {
      console.error("Error toggling featured:", error);
      alert("Error updating featured status");
    }
  };

  const rejectAllPending = async () => {
    if (pendingItems.length === 0) {
      alert("No pending items to reject!");
      return;
    }

    if (
      !confirm(
        `Reject all ${pendingItems.length} pending articles? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/content/reject-all-pending", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        // Move all pending items to rejected
        setRejectedItems((prev) => [...prev, ...pendingItems]);
        setPendingItems([]);
        alert(data.message);
      } else {
        alert("Failed to reject pending articles");
      }
    } catch (error) {
      console.error("Error rejecting all pending:", error);
      alert("Error rejecting all pending articles");
    }
  };

  const generateDescription = async (item: ContentItem) => {
    // Clear any previous errors for this item
    setGenerationErrors((prev) => {
      const newErrors = new Map(prev);
      newErrors.delete(item.id);
      return newErrors;
    });

    // Add to generating set
    setGeneratingItemIds((prev) => new Set(prev).add(item.id));

    try {
      const response = await fetch("/api/admin/content/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the item's summary and description in state
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
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to generate description" }));
        setGenerationErrors((prev) =>
          new Map(prev).set(
            item.id,
            errorData.error || "Failed to generate description"
          )
        );
      }
    } catch (error) {
      console.error("Error generating description:", error);
      setGenerationErrors((prev) =>
        new Map(prev).set(item.id, "Network error. Please try again.")
      );
    } finally {
      // Remove from generating set
      setGeneratingItemIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const generateAllDescriptions = async () => {
    // Only generate for items that don't have a description yet
    const itemsNeedingDescription = acceptedItems.filter(
      (item) => !item.description
    );

    if (itemsNeedingDescription.length === 0) {
      alert("All accepted items already have AI-generated descriptions!");
      return;
    }

    if (
      !confirm(
        `Generate AI descriptions for ${itemsNeedingDescription.length} articles without descriptions? This may take a few minutes.`
      )
    ) {
      return;
    }

    setIsGeneratingAll(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Process items sequentially to avoid rate limits
      for (const item of itemsNeedingDescription) {
        try {
          const response = await fetch(
            "/api/admin/content/generate-description",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contentId: item.id }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Update the item's summary and description in state
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
          } else {
            failCount++;
            console.error(`Failed to generate description for item ${item.id}`);
          }

          // Add small delay to avoid rate limiting
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

  const addArticleByUrl = async () => {
    if (!articleUrl.trim()) {
      setAddArticleError("Please enter a valid URL");
      return;
    }

    setIsAddingArticle(true);
    setAddArticleError(null);

    try {
      const response = await fetch("/api/admin/content/add-by-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: articleUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add the new content to pending items
        const newItem: ContentItem = {
          id: data.content.id,
          title: data.content.title,
          summary: data.content.summary,
          link: data.content.link,
          sourceType: data.content.sourceType,
          sourceName: data.content.sourceName,
          publishedAt: new Date(data.content.publishedAt),
          category: data.content.category,
          tags: [],
          qualityScore: data.content.qualityScore,
          engagementScore: data.content.engagementScore,
        };

        setPendingItems((prev) => [newItem, ...prev]);

        // Reset form
        setArticleUrl("");
        setShowAddArticle(false);
        alert(data.message);
      } else {
        setAddArticleError(data.error || "Failed to add article");
      }
    } catch (error) {
      console.error("Error adding article:", error);
      setAddArticleError("Network error. Please try again.");
    } finally {
      setIsAddingArticle(false);
    }
  };

  // Group pending items by source type
  const groupBySourceType = (items: ContentItem[]): GroupedContent => {
    const grouped: GroupedContent = {};
    items.forEach((item) => {
      const sourceType = item.sourceType || "other";
      if (!grouped[sourceType]) {
        grouped[sourceType] = [];
      }
      grouped[sourceType].push(item);
    });
    return grouped;
  };

  // Group accepted items by category (for email preview)
  const groupByCategory = (items: ContentItem[]): GroupedContent => {
    const grouped: GroupedContent = {};
    items.forEach((item) => {
      const categoryName = item.category?.name || "Uncategorized";
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(item);
    });
    return grouped;
  };

  // Group accepted items by author/source
  const groupByAuthorName = (items: ContentItem[]): GroupedContent => {
    const grouped: GroupedContent = {};
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

  // Check for duplicate sources in accepted items
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

  const handleSendNewsletter = async () => {
    if (acceptedItems.length === 0) {
      alert("No accepted articles to create newsletter!");
      return;
    }

    if (
      !confirm(
        `Create newsletter draft with ${acceptedItems.length} articles?\n\nThis will clear all items from the curation page to prepare for the next newsletter.`
      )
    ) {
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/admin/create-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newsletterSubject,
          preheaderText,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Clear all items from the curation page
        setPendingItems([]);
        setAcceptedItems([]);
        setRejectedItems([]);
        setSavedForFutureItems([]);

        alert(
          data.message +
            "\n\nAll items have been cleared. You can now start curating for the next newsletter."
        );

        // Optionally redirect to newsletters page
        if (
          confirm(
            "Newsletter draft created! Would you like to go to the Newsletters page to send it?"
          )
        ) {
          window.location.href = "/admin/newsletters";
        }
      } else {
        const data = await response.json();
        alert(`Failed to create newsletter: ${data.error}`);
      }
    } catch (error) {
      console.error("Error creating newsletter:", error);
      alert("Error creating newsletter");
    } finally {
      setIsSending(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

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
          className="mb-6 flex justify-between items-start"
        >
          <div>
            <Link
              href="/admin"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-100 mb-1">
              Content Curation
            </h1>
            <p className="text-sm text-gray-400">
              Drag and drop articles between columns to organize your newsletter
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowFullPreview(true)}
              disabled={acceptedItems.length === 0}
              variant="outline"
              size="lg"
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview Newsletter
            </Button>
            <Button
              onClick={handleSendNewsletter}
              disabled={isSending || acceptedItems.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Create Newsletter ({acceptedItems.length})
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Warning Banner - Too Many Articles */}
        {acceptedItems.length > 25 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Card className="border-amber-800 bg-amber-950/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-amber-200 mb-1">
                      ⚠️ Newsletter Length Warning
                    </h3>
                    <p className="text-sm text-amber-300 mb-2">
                      You have <strong>{acceptedItems.length} articles</strong>{" "}
                      accepted. For optimal engagement, we recommend{" "}
                      <strong>25-35 articles</strong> per newsletter.
                    </p>
                    <div className="text-xs text-amber-400/80 space-y-1">
                      <p>
                        • Too many articles can overwhelm readers and reduce
                        open rates
                      </p>
                      <p>
                        • Consider saving some articles for the next issue using
                        "Save for Future"
                      </p>
                      <p>
                        • Focus on the highest quality content for better
                        engagement
                      </p>
                    </div>
                    {acceptedItems.length > 40 && (
                      <div className="mt-3 p-2 bg-red-950/30 border border-red-800 rounded">
                        <p className="text-xs text-red-300 font-medium">
                          🚨 <strong>Critical:</strong> {acceptedItems.length}{" "}
                          articles is significantly above the recommended limit.
                          This may cause email client issues and poor user
                          experience.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Warning Banner - Duplicate Sources */}
        {(() => {
          const duplicateSources = getDuplicateSources(acceptedItems);
          return (
            duplicateSources.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <Card className="border-orange-800 bg-orange-950/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-orange-200 mb-1">
                          ⚠️ Duplicate Sources Detected
                        </h3>
                        <p className="text-sm text-orange-300 mb-2">
                          You have multiple articles from the same source in
                          your newsletter. For better content diversity,
                          consider limiting to{" "}
                          <strong>one article per source</strong>.
                        </p>
                        <div className="space-y-1">
                          {duplicateSources.map(({ source, count }) => (
                            <div
                              key={source}
                              className="text-xs text-orange-200 bg-orange-900/30 border border-orange-800 rounded px-2 py-1.5"
                            >
                              <strong>{source}</strong>: {count} articles
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-orange-400/80 space-y-1 mt-2">
                          <p>
                            • Multiple articles from the same source can reduce
                            newsletter variety
                          </p>
                          <p>
                            • Consider saving extra articles for future
                            newsletters
                          </p>
                          <p>
                            • Readers prefer diverse perspectives and sources
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          );
        })()}

        {/* Batch Management */}
        {batches.filter((b) => b.status === "pending").length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <Card className="border-purple-800 bg-purple-950/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-purple-200">
                    📦 Scrape Batches (
                    {batches.filter((b) => b.status === "pending").length}{" "}
                    pending)
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowBatchManager(!showBatchManager)}
                    className="text-purple-300 hover:text-purple-100 hover:bg-purple-900/50"
                  >
                    {showBatchManager ? "Hide" : "Manage"}
                  </Button>
                </div>

                {showBatchManager && (
                  <div className="space-y-3">
                    {/* Batch List */}
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {batches
                        .filter((b) => b.status === "pending")
                        .map((batch) => (
                          <div
                            key={batch.id}
                            className={`p-3 rounded border-2 transition-all cursor-pointer ${
                              selectedBatchIds.includes(batch.id)
                                ? "bg-purple-900/50 border-purple-600"
                                : "bg-gray-800/50 border-purple-800 hover:border-purple-700"
                            }`}
                            onClick={() => toggleBatchSelection(batch.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedBatchIds.includes(
                                      batch.id
                                    )}
                                    onChange={() =>
                                      toggleBatchSelection(batch.id)
                                    }
                                    className="h-4 w-4"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <h4 className="font-semibold text-sm text-gray-100">
                                    {batch.name}
                                  </h4>
                                </div>
                                <div className="flex gap-3 mt-2 text-xs text-gray-400 ml-6">
                                  <span className="bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded border border-yellow-800">
                                    {batch.counts.pending} pending
                                  </span>
                                  <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded border border-green-800">
                                    {batch.counts.accepted} accepted
                                  </span>
                                  <span className="bg-red-900/30 text-red-300 px-2 py-1 rounded border border-red-800">
                                    {batch.counts.discarded} discarded
                                  </span>
                                  <span className="text-gray-500">
                                    •{" "}
                                    {new Date(
                                      batch.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Merge Controls */}
                    {selectedBatchIds.length >= 2 && (
                      <div className="border-t border-purple-800 pt-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={previewMerge}
                            disabled={isMerging}
                            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                          >
                            Preview Merge ({selectedBatchIds.length} batches)
                          </Button>
                          {mergePreview && (
                            <Button
                              size="sm"
                              onClick={executeMerge}
                              disabled={isMerging}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              {isMerging ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Merging...
                                </>
                              ) : (
                                <>Execute Merge</>
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Merge Preview Stats */}
                        {mergePreview && (
                          <div className="mt-3 p-3 bg-gray-900/50 rounded border border-gray-700">
                            <h5 className="font-bold text-xs text-gray-200 mb-2">
                              Merge Preview:
                            </h5>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-blue-950/30 p-2 rounded border border-blue-800">
                                <div className="text-gray-400">Total Items</div>
                                <div className="font-bold text-blue-300">
                                  {mergePreview.totalItems}
                                </div>
                              </div>
                              <div className="bg-green-950/30 p-2 rounded border border-green-800">
                                <div className="text-gray-400">
                                  Final Unique
                                </div>
                                <div className="font-bold text-green-300">
                                  {mergePreview.finalUniqueItems}
                                </div>
                              </div>
                              <div className="bg-orange-950/30 p-2 rounded border border-orange-800">
                                <div className="text-gray-400">
                                  Duplicates Within
                                </div>
                                <div className="font-bold text-orange-300">
                                  {mergePreview.duplicatesWithinBatches}
                                </div>
                              </div>
                              <div className="bg-gray-800 p-2 rounded border border-gray-700">
                                <div className="text-gray-400">
                                  Already Reviewed
                                </div>
                                <div className="font-bold text-gray-200">
                                  {mergePreview.alreadyAccepted +
                                    mergePreview.alreadyRejected}
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              ✨ Deduplication will remove{" "}
                              {mergePreview.totalItems -
                                mergePreview.finalUniqueItems}{" "}
                              items
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedBatchIds.length === 1 && (
                      <p className="text-xs text-purple-300 bg-purple-900/30 p-2 rounded border border-purple-800">
                        ℹ️ Select at least 2 batches to merge and deduplicate
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Newsletter Header/Footer Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="border-blue-800 bg-blue-950/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-blue-200">
                  Newsletter Header & Footer
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNewsletterConfig(!showNewsletterConfig)}
                  className="text-blue-300 hover:text-blue-100 hover:bg-blue-900/50"
                >
                  {showNewsletterConfig ? "Hide" : "Edit"}
                </Button>
              </div>

              {showNewsletterConfig && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Header Content (optional)
                    </label>
                    <textarea
                      value={headerContent}
                      onChange={(e) => setHeaderContent(e.target.value)}
                      placeholder="Add a custom header message for your newsletter..."
                      className="w-full text-sm bg-gray-900/50 border border-gray-700 text-gray-200 rounded p-2 min-h-[80px] focus:border-blue-500 focus:outline-none placeholder:text-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      This will appear at the top of your newsletter, below the
                      main header.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Footer Content (optional)
                    </label>
                    <textarea
                      value={footerContent}
                      onChange={(e) => setFooterContent(e.target.value)}
                      placeholder="Add a custom footer message for your newsletter..."
                      className="w-full text-sm bg-gray-900/50 border border-gray-700 text-gray-200 rounded p-2 min-h-[80px] focus:border-blue-500 focus:outline-none placeholder:text-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      This will appear at the bottom of your newsletter, above
                      the unsubscribe links.
                    </p>
                  </div>

                  <Button
                    onClick={saveNewsletterConfig}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save Newsletter Config
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Article Manually */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <Card className="border-teal-800 bg-teal-950/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-teal-200 flex items-center gap-2">
                    <span>➕ Add Article Manually</span>
                  </h3>
                  <p className="text-xs text-teal-400 mt-1">
                    Paste a link to add an article to your content list
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddArticle(!showAddArticle)}
                  className="text-teal-300 hover:text-teal-100 hover:bg-teal-900/50"
                >
                  {showAddArticle ? "Hide" : "Add"}
                </Button>
              </div>

              {showAddArticle && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Article URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={articleUrl}
                        onChange={(e) => {
                          setArticleUrl(e.target.value);
                          setAddArticleError(null);
                        }}
                        placeholder="https://example.com/article"
                        className="flex-1 text-sm bg-gray-900/50 border border-gray-700 text-gray-200 rounded p-2 focus:border-teal-500 focus:outline-none placeholder:text-gray-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isAddingArticle) {
                            addArticleByUrl();
                          }
                        }}
                      />
                      <Button
                        onClick={addArticleByUrl}
                        disabled={isAddingArticle || !articleUrl.trim()}
                        className="bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
                      >
                        {isAddingArticle ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Add Article
                          </>
                        )}
                      </Button>
                    </div>
                    {addArticleError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-xs text-red-300 bg-red-900/30 border border-red-800 rounded p-2 flex items-start gap-2"
                      >
                        <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <span>{addArticleError}</span>
                      </motion.div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      The article will be automatically categorized and added to
                      your Pending list. A new source will be created if needed.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Four Column Layout */}
        <div className="grid grid-cols-4 gap-4">
          {/* Pending Column - Grouped by Source Type */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col"
          >
            <div className="bg-yellow-950/30 border-2 border-yellow-800 rounded-lg p-3 mb-3 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-yellow-200 flex items-center gap-2">
                    <span>📋 Pending</span>
                    <span className="text-sm bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-2 py-1 rounded">
                      {pendingItems.length}
                    </span>
                  </h2>
                  <p className="text-xs text-yellow-400 mt-1">
                    Grouped by sources
                  </p>
                </div>
                {pendingItems.length > 0 && (
                  <Button
                    size="sm"
                    onClick={rejectAllPending}
                    className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Reject All
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
              {pendingItems.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-400 text-sm py-8"
                >
                  No pending items
                </motion.p>
              ) : (
                Object.entries(groupBySourceType(pendingItems)).map(
                  ([sourceType, items]) => (
                    <div key={sourceType} className="mb-4">
                      <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wide px-2 py-1 bg-gray-800/50 border border-gray-700 rounded mb-2 flex items-center justify-between">
                        <span>{sourceType}</span>
                        <span className="bg-gray-700 px-1.5 rounded text-xs">
                          {items.length}
                        </span>
                      </h3>
                      <AnimatePresence>
                        {items.map((item) => (
                          <ContentCard
                            key={item.id}
                            item={item}
                            status="pending"
                            editingItemId={editingItemId}
                            editingSummary={editingSummary}
                            editingSourceItemId={editingSourceItemId}
                            editingSourceName={editingSourceName}
                            generatingItemIds={generatingItemIds}
                            generationErrors={generationErrors}
                            onMoveToAccepted={moveToAccepted}
                            onMoveToRejected={moveToRejected}
                            onMoveToPending={moveToPending}
                            onSaveForFuture={saveForFuture}
                            onChangeCategory={changeCategory}
                            onStartEditingSummary={startEditingSummary}
                            onCancelEditingSummary={cancelEditingSummary}
                            onSaveSummary={saveSummary}
                            onEditingSummaryChange={setEditingSummary}
                            onStartEditingSourceName={startEditingSourceName}
                            onCancelEditingSourceName={cancelEditingSourceName}
                            onSaveSourceName={saveSourceName}
                            onEditingSourceNameChange={setEditingSourceName}
                            onToggleFeatured={toggleFeatured}
                            onGenerateDescription={generateDescription}
                            onClearGenerationError={(id) => {
                              setGenerationErrors((prev) => {
                                const newErrors = new Map(prev);
                                newErrors.delete(id);
                                return newErrors;
                              });
                            }}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )
                )
              )}
            </div>
          </motion.div>

          {/* Accepted Column - Grouped by Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="bg-green-950/30 border-2 border-green-800 rounded-lg p-3 mb-3 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-green-200 flex items-center gap-2">
                    <span>✅ Accepted</span>
                    <span className="text-sm bg-green-900/50 border border-green-700 text-green-200 px-2 py-1 rounded">
                      {acceptedItems.length}
                    </span>
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-green-400">
                      {groupByAuthor
                        ? "Grouped by authors"
                        : "Grouped by email sections"}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setGroupByAuthor(!groupByAuthor)}
                      className="h-6 text-xs text-green-300 hover:text-green-100 hover:bg-green-900/50 px-2"
                    >
                      {groupByAuthor ? "📚 Categories" : "👤 Authors"}
                    </Button>
                  </div>
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

            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
              {acceptedItems.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-400 text-sm py-8"
                >
                  No accepted items
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
                            <ContentCard
                              item={item}
                              status="accepted"
                              editingItemId={editingItemId}
                              editingSummary={editingSummary}
                              editingSourceItemId={editingSourceItemId}
                              editingSourceName={editingSourceName}
                              generatingItemIds={generatingItemIds}
                              generationErrors={generationErrors}
                              onMoveToAccepted={moveToAccepted}
                              onMoveToRejected={moveToRejected}
                              onMoveToPending={moveToPending}
                              onSaveForFuture={saveForFuture}
                              onChangeCategory={changeCategory}
                              onStartEditingSummary={startEditingSummary}
                              onCancelEditingSummary={cancelEditingSummary}
                              onSaveSummary={saveSummary}
                              onEditingSummaryChange={setEditingSummary}
                              onStartEditingSourceName={startEditingSourceName}
                              onCancelEditingSourceName={cancelEditingSourceName}
                              onSaveSourceName={saveSourceName}
                              onEditingSourceNameChange={setEditingSourceName}
                              onToggleFeatured={toggleFeatured}
                              onGenerateDescription={generateDescription}
                              onClearGenerationError={(id) => {
                                setGenerationErrors((prev) => {
                                  const newErrors = new Map(prev);
                                  newErrors.delete(id);
                                  return newErrors;
                                });
                              }}
                            />
                          </Reorder.Item>
                        ))}
                      </AnimatePresence>
                    </Reorder.Group>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Save for Future Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col"
          >
            <div className="bg-blue-950/30 border-2 border-blue-800 rounded-lg p-3 mb-3 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-blue-200 flex items-center justify-between">
                <span>💾 Save for Future</span>
                <span className="text-sm bg-blue-900/50 border border-blue-700 text-blue-200 px-2 py-1 rounded">
                  {savedForFutureItems.length}
                </span>
              </h2>
              <p className="text-xs text-blue-400 mt-1">
                Saved for next newsletter
              </p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
              <AnimatePresence>
                {savedForFutureItems.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    status="pending"
                    editingItemId={editingItemId}
                    editingSummary={editingSummary}
                    editingSourceItemId={editingSourceItemId}
                    editingSourceName={editingSourceName}
                    generatingItemIds={generatingItemIds}
                    generationErrors={generationErrors}
                    onMoveToAccepted={moveToAccepted}
                    onMoveToRejected={moveToRejected}
                    onMoveToPending={moveToPending}
                    onSaveForFuture={saveForFuture}
                    onChangeCategory={changeCategory}
                    onStartEditingSummary={startEditingSummary}
                    onCancelEditingSummary={cancelEditingSummary}
                    onSaveSummary={saveSummary}
                    onEditingSummaryChange={setEditingSummary}
                    onStartEditingSourceName={startEditingSourceName}
                    onCancelEditingSourceName={cancelEditingSourceName}
                    onSaveSourceName={saveSourceName}
                    onEditingSourceNameChange={setEditingSourceName}
                    onToggleFeatured={toggleFeatured}
                    onGenerateDescription={generateDescription}
                    onClearGenerationError={(id) => {
                      setGenerationErrors((prev) => {
                        const newErrors = new Map(prev);
                        newErrors.delete(id);
                        return newErrors;
                      });
                    }}
                  />
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
              <h2 className="text-lg font-bold text-red-200 flex items-center justify-between">
                <span>❌ Rejected</span>
                <span className="text-sm bg-red-900/50 border border-red-700 text-red-200 px-2 py-1 rounded">
                  {rejectedItems.length}
                </span>
              </h2>
              <p className="text-xs text-red-400 mt-1">Discarded articles</p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
              <AnimatePresence>
                {rejectedItems.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    status="rejected"
                    editingItemId={editingItemId}
                    editingSummary={editingSummary}
                    editingSourceItemId={editingSourceItemId}
                    editingSourceName={editingSourceName}
                    generatingItemIds={generatingItemIds}
                    generationErrors={generationErrors}
                    onMoveToAccepted={moveToAccepted}
                    onMoveToRejected={moveToRejected}
                    onMoveToPending={moveToPending}
                    onSaveForFuture={saveForFuture}
                    onChangeCategory={changeCategory}
                    onStartEditingSummary={startEditingSummary}
                    onCancelEditingSummary={cancelEditingSummary}
                    onSaveSummary={saveSummary}
                    onEditingSummaryChange={setEditingSummary}
                    onStartEditingSourceName={startEditingSourceName}
                    onCancelEditingSourceName={cancelEditingSourceName}
                    onSaveSourceName={saveSourceName}
                    onEditingSourceNameChange={setEditingSourceName}
                    onToggleFeatured={toggleFeatured}
                    onGenerateDescription={generateDescription}
                    onClearGenerationError={(id) => {
                      setGenerationErrors((prev) => {
                        const newErrors = new Map(prev);
                        newErrors.delete(id);
                        return newErrors;
                      });
                    }}
                  />
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

        {/* Full Newsletter Preview Modal */}
        <AnimatePresence>
          <FullNewsletterPreviewModal
            showFullPreview={showFullPreview}
            onClose={() => setShowFullPreview(false)}
            newsletterSubject={newsletterSubject}
            preheaderText={preheaderText}
            isEditingSubject={isEditingSubject}
            editedSubject={editedSubject}
            onStartEditingSubject={startEditingSubject}
            onCancelEditingSubject={cancelEditingSubject}
            onSaveSubject={saveSubject}
            onEditedSubjectChange={setEditedSubject}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}
