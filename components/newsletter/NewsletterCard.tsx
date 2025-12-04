"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Mail,
  Edit,
  Trash2,
  Check,
  X,
  FileText,
  Calendar,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { NewsletterDraftWithStats } from "@/lib/types";

interface NewsletterCardProps {
  draft: NewsletterDraftWithStats;
  onPreview: (draft: NewsletterDraftWithStats) => void;
  onEdit?: (draft: NewsletterDraftWithStats) => void;
  onSend?: (draftId: number) => Promise<void>;
  onDelete?: (draftId: number) => Promise<void>;
  onUpdateSubject?: (draftId: number, subject: string) => Promise<void>;
  isSending?: boolean;
}

export function NewsletterCard({
  draft,
  onPreview,
  onEdit,
  onSend,
  onDelete,
  onUpdateSubject,
  isSending = false,
}: NewsletterCardProps) {
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editedSubject, setEditedSubject] = useState(draft.subject);

  const handleSaveSubject = async () => {
    if (!editedSubject.trim() || !onUpdateSubject) return;
    await onUpdateSubject(draft.id, editedSubject);
    setIsEditingSubject(false);
  };

  const handleCancelEdit = () => {
    setEditedSubject(draft.subject);
    setIsEditingSubject(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1">
                  <div className="mb-2">
                    {draft.name && (
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        {draft.name}
                      </p>
                    )}
                    {isEditingSubject ? (
                      <div>
                        <input
                          type="text"
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveSubject();
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          className="w-full text-lg font-bold text-gray-100 bg-gray-900/50 border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={handleSaveSubject}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <h3 className="text-lg font-bold text-gray-100">
                          {draft.subject}
                        </h3>
                        {draft.status === "draft" && onUpdateSubject && (
                          <button
                            onClick={() => setIsEditingSubject(true)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded"
                            title="Edit subject"
                          >
                            <Edit className="h-4 w-4 text-gray-400" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {draft.preheaderText && (
                    <p className="text-sm text-gray-400 mb-2">
                      {draft.preheaderText}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{draft.articleCount || 0} articles</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Created {new Date(draft.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {draft.sentAt && (
                      <div className="flex items-center gap-1 text-green-400">
                        <Check className="h-4 w-4" />
                        <span>
                          Sent {new Date(draft.sentAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  {draft.status === "sent" ? (
                    <span className="px-3 py-1 bg-green-900/30 text-green-300 border border-green-800 rounded-full text-sm font-medium">
                      ✅ Sent
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-900/30 text-yellow-300 border border-yellow-800 rounded-full text-sm font-medium">
                      📝 Draft
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {draft.status === "draft" && onEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(draft)}
                    className="bg-green-700 border-green-600 text-green-200 hover:bg-green-600 hover:text-white"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Build Newsletter
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPreview(draft)}
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>

                {draft.status === "draft" && (
                  <>
                    {onSend && (
                      <Button
                        size="sm"
                        onClick={() => onSend(draft.id)}
                        disabled={isSending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-1" />
                            Send to All
                          </>
                        )}
                      </Button>
                    )}

                    {onDelete && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(draft.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
