"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Edit, Check, X, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { SourceBadge } from "./SourceBadge";
import { CategoryBadge } from "./CategoryBadge";
import { motion } from "framer-motion";
import type { ContentWithRelations } from "@/lib/types";

interface ContentCardProps {
  item: ContentWithRelations;
  onAccept?: (item: ContentWithRelations) => Promise<void>;
  onReject?: (item: ContentWithRelations) => Promise<void>;
  onSaveForFuture?: (item: ContentWithRelations) => Promise<void>;
  onMoveToPending?: (item: ContentWithRelations) => Promise<void>;
  onGenerateDescription?: (item: ContentWithRelations) => Promise<void>;
  onUpdateSummary?: (item: ContentWithRelations, summary: string) => Promise<void>;
  showActions?: boolean;
  isGenerating?: boolean;
  generationError?: string;
}

export function ContentCard({
  item,
  onAccept,
  onReject,
  onSaveForFuture,
  onMoveToPending,
  onGenerateDescription,
  onUpdateSummary,
  showActions = true,
  isGenerating = false,
  generationError,
}: ContentCardProps) {
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState(item.summary);

  const handleSaveSummary = async () => {
    if (!editedSummary.trim() || !onUpdateSummary) return;
    await onUpdateSummary(item, editedSummary);
    setIsEditingSummary(false);
  };

  const handleCancelEdit = () => {
    setEditedSummary(item.summary);
    setIsEditingSummary(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="mb-3 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 hover:border-gray-600 transition-all backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            {item.thumbnailUrl && (
              <div className="flex-shrink-0">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-20 h-20 object-cover rounded"
                />
              </div>
            )}
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
                <SourceBadge sourceType={item.sourceType} />
                <span className="text-gray-400 truncate">{item.sourceName}</span>
                {item.category && (
                  <CategoryBadge categorySlug={item.category.slug} showEmoji={false} />
                )}
              </div>

              {isEditingSummary ? (
                <div className="mb-2">
                  <textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    className="w-full text-xs text-gray-200 bg-gray-900/50 border border-gray-700 rounded p-2 min-h-[60px] focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <div className="flex gap-1 mt-1">
                    <Button
                      size="sm"
                      onClick={handleSaveSummary}
                      className="h-6 text-xs bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="h-6 text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-2 group relative">
                  <p className="text-xs text-gray-300 line-clamp-2">
                    {item.summary || item.description}
                  </p>
                  {onUpdateSummary && (
                    <button
                      onClick={() => setIsEditingSummary(true)}
                      className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-800 rounded border border-gray-700 shadow-sm hover:bg-gray-700"
                      title="Edit description"
                    >
                      <Edit className="h-3 w-3 text-gray-300" />
                    </button>
                  )}
                </div>
              )}

              {showActions && (
                <div className="flex flex-wrap gap-1">
                  {onAccept && (
                    <Button
                      size="sm"
                      onClick={() => onAccept(item)}
                      className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                    >
                      Accept
                    </Button>
                  )}
                  {onSaveForFuture && (
                    <Button
                      size="sm"
                      onClick={() => onSaveForFuture(item)}
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save for Future
                    </Button>
                  )}
                  {onMoveToPending && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMoveToPending(item)}
                      className="h-7 text-xs bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Move to Pending
                    </Button>
                  )}
                  {onGenerateDescription && (
                    <Button
                      size="sm"
                      onClick={() => onGenerateDescription(item)}
                      disabled={isGenerating}
                      className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                      title={item.description ? "Regenerate AI description" : "Generate AI description"}
                    >
                      {isGenerating ? (
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
                  )}
                  {onReject && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onReject(item)}
                      className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                    >
                      Reject
                    </Button>
                  )}
                </div>
              )}

              {generationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-2 bg-red-900/30 border border-red-800 rounded text-xs text-red-300 mt-2"
                >
                  <div className="flex-1">
                    <p className="font-medium">Generation failed</p>
                    <p className="text-red-400">{generationError}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
