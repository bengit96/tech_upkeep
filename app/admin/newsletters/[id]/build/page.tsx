"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  ExternalLink,
  ChevronLeft,
  Loader2,
  Trash2,
  X,
  Edit,
  Check,
  Sparkles,
  AlertCircle,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, Reorder, AnimatePresence } from "framer-motion";

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
}

interface NewsletterDraft {
  id: number;
  name: string | null;
  subject: string;
  preheaderText: string;
  status: string;
  articleCount?: number;
}

export default function BuildNewsletterPage() {
  const params = useParams();
  const router = useRouter();
  const newsletterId = parseInt(params.id as string);

  const [draft, setDraft] = useState<NewsletterDraft | null>(null);
  const [unassignedItems, setUnassignedItems] = useState<ContentItem[]>([]);
  const [taggedItems, setTaggedItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingSummary, setEditingSummary] = useState<string>("");
  const [editingSourceItemId, setEditingSourceItemId] = useState<number | null>(null);
  const [editingSourceName, setEditingSourceName] = useState<string>("");
  const [generatingItemIds, setGeneratingItemIds] = useState<Set<number>>(new Set());
  const [generationErrors, setGenerationErrors] = useState<Map<number, string>>(new Map());
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
    fetchDraft();
    fetchContent();
  }, [newsletterId]);

  const fetchDraft = async () => {
    try {
      const response = await fetch(`/api/admin/newsletters/${newsletterId}`);
      if (response.ok) {
        const data = await response.json();
        setDraft(data.draft);
      } else {
        alert("Newsletter not found");
        router.push("/admin/newsletters");
      }
    } catch (error) {
      console.error("Error fetching draft:", error);
    }
  };

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      // Fetch unassigned content (status=pending AND newsletterDraftId IS NULL)
      const unassignedRes = await fetch(
        "/api/admin/content?status=pending&unassigned=true&limit=200"
      );

      // Fetch content tagged to this newsletter
      const taggedRes = await fetch(
        `/api/admin/content?newsletterDraftId=${newsletterId}&limit=200`
      );

      const unassignedData = await unassignedRes.json();
      const taggedData = await taggedRes.json();

      setUnassignedItems(unassignedData.items || []);
      setTaggedItems(taggedData.items || []);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const tagToNewsletter = async (item: ContentItem) => {
    try {
      const response = await fetch("/api/admin/content/tag-to-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: item.id,
          newsletterDraftId: newsletterId,
        }),
      });

      if (response.ok) {
        setUnassignedItems((prev) => prev.filter((i) => i.id !== item.id));
        setTaggedItems((prev) => [...prev, { ...item, status: "accepted" }]);

        // Generate AI description in the background
        fetch("/api/admin/content/generate-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId: item.id }),
        })
          .then(async (descResponse) => {
            if (descResponse.ok) {
              const data = await descResponse.json();
              setTaggedItems((prev) =>
                prev.map((i) =>
                  i.id === item.id ? { ...i, summary: data.description } : i
                )
              );
            }
          })
          .catch((error) => {
            console.error("Error generating description:", error);
          });
      }
    } catch (error) {
      console.error("Error tagging content:", error);
    }
  };

  const untagFromNewsletter = async (item: ContentItem) => {
    try {
      const response = await fetch("/api/admin/content/untag-from-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id }),
      });

      if (response.ok) {
        setTaggedItems((prev) => prev.filter((i) => i.id !== item.id));
        setUnassignedItems((prev) => [...prev, { ...item, status: "pending" }]);
      }
    } catch (error) {
      console.error("Error untagging content:", error);
    }
  };

  const discardArticle = async (item: ContentItem) => {
    try {
      const response = await fetch("/api/admin/content/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id }),
      });

      if (response.ok) {
        setUnassignedItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    } catch (error) {
      console.error("Error discarding content:", error);
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
        setTaggedItems((prev) =>
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

  const toggleFeatured = async (item: ContentItem, order: number) => {
    try {
      const newOrder = item.featuredOrder === order ? undefined : order;

      const response = await fetch("/api/admin/content/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id, featuredOrder: newOrder }),
      });

      if (response.ok) {
        setTaggedItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, featuredOrder: newOrder } : i
          )
        );

        if (newOrder !== null) {
          setTaggedItems((prev) =>
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
        const updateSummary = (items: ContentItem[]) =>
          items.map((i) =>
            i.id === item.id ? { ...i, summary: editingSummary } : i
          );

        setUnassignedItems((prev) => updateSummary(prev));
        setTaggedItems((prev) => updateSummary(prev));

        setEditingItemId(null);
        setEditingSummary("");
      } else {
        alert("Failed to update summary");
      }
    } catch (error) {
      console.error("Error updating summary:", error);
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
        body: JSON.stringify({ contentId: item.id, sourceName: editingSourceName }),
      });

      if (response.ok) {
        const updateSourceName = (items: ContentItem[]) =>
          items.map((i) =>
            i.id === item.id ? { ...i, sourceName: editingSourceName } : i
          );

        setUnassignedItems((prev) => updateSourceName(prev));
        setTaggedItems((prev) => updateSourceName(prev));

        setEditingSourceItemId(null);
        setEditingSourceName("");
      } else {
        alert("Failed to update source name");
      }
    } catch (error) {
      console.error("Error updating source name:", error);
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
      const response = await fetch("/api/admin/content/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setTaggedItems((prev) =>
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
      setGeneratingItemIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const generateAllDescriptions = async () => {
    const itemsNeedingDescription = taggedItems.filter((item) => !item.description);

    if (itemsNeedingDescription.length === 0) {
      alert("All articles already have AI-generated descriptions!");
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
          const response = await fetch("/api/admin/content/generate-description", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentId: item.id }),
          });

          if (response.ok) {
            const data = await response.json();
            setTaggedItems((prev) =>
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
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          failCount++;
          console.error(`Error generating description for item ${item.id}:`, error);
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

  const handlePreview = async () => {
    try {
      const response = await fetch(
        `/api/admin/newsletter-draft-preview?draftId=${newsletterId}`
      );
      if (response.ok) {
        const html = await response.text();
        setPreviewHtml(html);
        setShowPreview(true);
      } else {
        alert("Failed to load preview");
      }
    } catch (error) {
      console.error("Error loading preview:", error);
      alert("Error loading preview");
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
      name: "Product/Culture 🚀",
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

  const ContentCard = ({
    item,
    isTagged,
  }: {
    item: ContentItem;
    isTagged: boolean;
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

              {isTagged && (
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

              {!isTagged && (
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    onClick={() => tagToNewsletter(item)}
                    className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                  >
                    Add to Newsletter
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => discardArticle(item)}
                    className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                  >
                    Discard
                  </Button>
                </div>
              )}

              {isTagged && (
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
                      variant="outline"
                      onClick={() => untagFromNewsletter(item)}
                      className="h-7 text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Remove
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
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (isLoading || !draft) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/admin/newsletters"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Newsletters
          </Link>
          <div className="flex justify-between items-start">
            <div>
              {draft.name && (
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  {draft.name}
                </p>
              )}
              <h1 className="text-3xl font-bold text-gray-100 mb-1">
                {draft.subject}
              </h1>
              <p className="text-sm text-gray-400">
                Build your newsletter by adding articles from the unassigned pool
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePreview}
                disabled={taggedItems.length === 0}
                variant="outline"
                size="lg"
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Link href="/admin/newsletters">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save & Close
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Unassigned Articles */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="bg-yellow-950/30 border-2 border-yellow-800 rounded-lg p-3 mb-3 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-yellow-200 flex items-center gap-2">
                <span>📋 Available Articles</span>
                <span className="text-sm bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-2 py-1 rounded">
                  {unassignedItems.length}
                </span>
              </h2>
              <p className="text-xs text-yellow-400 mt-1">
                Not assigned to any newsletter yet
              </p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
              <AnimatePresence>
                {unassignedItems.map((item) => (
                  <ContentCard key={item.id} item={item} isTagged={false} />
                ))}
              </AnimatePresence>
              {unassignedItems.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-400 text-sm py-8"
                >
                  No unassigned articles available
                </motion.p>
              )}
            </div>
          </motion.div>

          {/* Newsletter Articles */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="bg-green-950/30 border-2 border-green-800 rounded-lg p-3 mb-3 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-green-200 flex items-center gap-2">
                    <span>✅ Newsletter Articles</span>
                    <span className="text-sm bg-green-900/50 border border-green-700 text-green-200 px-2 py-1 rounded">
                      {taggedItems.length}
                    </span>
                  </h2>
                  <p className="text-xs text-green-400 mt-1">
                    Tagged to this newsletter
                  </p>
                </div>
                {taggedItems.length > 0 && (
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
              <Reorder.Group
                axis="y"
                values={taggedItems}
                onReorder={setTaggedItems}
              >
                <AnimatePresence>
                  {taggedItems.map((item) => (
                    <Reorder.Item key={item.id} value={item}>
                      <ContentCard item={item} isTagged={true} />
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
              {taggedItems.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-400 text-sm py-8"
                >
                  No articles added yet. Add articles from the left column.
                </motion.p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Preview Modal */}
        {showPreview && previewHtml && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowPreview(false);
              setPreviewHtml(null);
            }}
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
                  <div>
                    <h2 className="text-xl font-bold text-gray-100">
                      Newsletter Preview
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {draft.subject}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPreview(false);
                      setPreviewHtml(null);
                    }}
                    className="text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                  title="Newsletter Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
