"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  Loader2,
  X,
  Edit,
  Check,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { CATEGORIES } from "@/lib/constants/categories";
import { getSourceBadgeClasses } from "@/lib/constants/sources";

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

interface ContentCardProps {
  item: ContentItem;
  status: "pending" | "accepted" | "rejected";
  editingItemId: number | null;
  editingSummary: string;
  editingSourceItemId: number | null;
  editingSourceName: string;
  generatingItemIds: Set<number>;
  generationErrors: Map<number, string>;
  // Action callbacks
  onMoveToAccepted: (item: ContentItem) => void;
  onMoveToRejected: (item: ContentItem) => void;
  onMoveToPending: (item: ContentItem, from: string) => void;
  onSaveForFuture: (item: ContentItem) => void;
  onChangeCategory: (item: ContentItem, slug: string) => void;
  onStartEditingSummary: (item: ContentItem) => void;
  onCancelEditingSummary: () => void;
  onSaveSummary: (item: ContentItem) => void;
  onEditingSummaryChange: (value: string) => void;
  onStartEditingSourceName: (item: ContentItem) => void;
  onCancelEditingSourceName: () => void;
  onSaveSourceName: (item: ContentItem) => void;
  onEditingSourceNameChange: (value: string) => void;
  onToggleFeatured: (item: ContentItem, order: number) => void;
  onGenerateDescription: (item: ContentItem) => void;
  onClearGenerationError: (itemId: number) => void;
}

export default function ContentCard({
  item,
  status,
  editingItemId,
  editingSummary,
  editingSourceItemId,
  editingSourceName,
  generatingItemIds,
  generationErrors,
  onMoveToAccepted,
  onMoveToRejected,
  onMoveToPending,
  onSaveForFuture,
  onChangeCategory,
  onStartEditingSummary,
  onCancelEditingSummary,
  onSaveSummary,
  onEditingSummaryChange,
  onStartEditingSourceName,
  onCancelEditingSourceName,
  onSaveSourceName,
  onEditingSourceNameChange,
  onToggleFeatured,
  onGenerateDescription,
  onClearGenerationError,
}: ContentCardProps) {
  return (
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
              {/* Title and Link */}
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-gray-100 hover:text-blue-400 inline-flex items-center gap-1 mb-1 line-clamp-2"
              >
                {item.title}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>

              {/* Source Badge */}
              <div className="flex flex-wrap items-center gap-1 mb-2 text-xs">
                <span
                  className={`px-1.5 py-0.5 rounded border ${getSourceBadgeClasses(item.sourceType)}`}
                >
                  {item.sourceType.toUpperCase()}
                </span>

                {/* Source Name Edit */}
                {editingSourceItemId === item.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={editingSourceName}
                      onChange={(e) => onEditingSourceNameChange(e.target.value)}
                      className="flex-1 min-w-0 text-xs text-gray-200 bg-gray-900/50 border border-gray-700 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onSaveSourceName(item);
                        } else if (e.key === "Escape") {
                          onCancelEditingSourceName();
                        }
                      }}
                    />
                    <button
                      onClick={() => onSaveSourceName(item)}
                      className="p-1 bg-green-600 hover:bg-green-700 rounded text-white"
                      title="Save"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      onClick={onCancelEditingSourceName}
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
                      onClick={() => onStartEditingSourceName(item)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded"
                      title="Edit author/source"
                    >
                      <Edit className="h-3 w-3 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>

              {/* Summary Edit */}
              {editingItemId === item.id ? (
                <div className="mb-2">
                  <textarea
                    value={editingSummary}
                    onChange={(e) => onEditingSummaryChange(e.target.value)}
                    className="w-full text-xs text-gray-200 bg-gray-900/50 border border-gray-700 rounded p-2 min-h-[60px] focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <div className="flex gap-1 mt-1">
                    <Button
                      size="sm"
                      onClick={() => onSaveSummary(item)}
                      className="h-6 text-xs bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancelEditingSummary}
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
                    onClick={() => onStartEditingSummary(item)}
                    className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-800 rounded border border-gray-700 shadow-sm hover:bg-gray-700"
                    title="Edit description"
                  >
                    <Edit className="h-3 w-3 text-gray-300" />
                  </button>
                </div>
              )}

              {/* Category Selection (Accepted items only) */}
              {status === "accepted" && (
                <div className="mb-2">
                  <p className="text-xs text-gray-400 mb-1">Change category:</p>
                  <div className="flex flex-wrap gap-1">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => onChangeCategory(item, cat.slug)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          item.category?.slug === cat.slug
                            ? cat.bgColor + " ring-2 ring-offset-0 ring-blue-500"
                            : cat.bgColor + " opacity-50 hover:opacity-75"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Actions */}
              {status === "pending" && (
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    onClick={() => onMoveToAccepted(item)}
                    className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSaveForFuture(item)}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save for Future
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onMoveToRejected(item)}
                    className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                  >
                    Reject
                  </Button>
                </div>
              )}

              {/* Accepted Actions */}
              {status === "accepted" && (
                <div className="space-y-2">
                  {/* Featured Star Buttons */}
                  <div className="flex gap-1 items-center mb-2 pb-2 border-b border-gray-700">
                    <span className="text-xs text-gray-400 mr-1">
                      Featured:
                    </span>
                    {[1, 2, 3].map((order) => (
                      <button
                        key={order}
                        onClick={() => onToggleFeatured(item, order)}
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
                      onClick={() => onGenerateDescription(item)}
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
                      onClick={() => onSaveForFuture(item)}
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save for Future
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMoveToPending(item, "accepted")}
                      className="h-7 text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Move to Pending
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onMoveToRejected(item)}
                      className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                    >
                      Reject
                    </Button>
                  </div>

                  {/* Generation Error Display */}
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
                        onClick={() => onClearGenerationError(item.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Rejected Actions */}
              {status === "rejected" && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onMoveToPending(item, "rejected")}
                    className="h-7 text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Move to Pending
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onMoveToAccepted(item)}
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
}
