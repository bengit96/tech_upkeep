"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  Mail,
  ChevronLeft,
  Loader2,
  Calendar,
  FileText,
  Check,
  Trash2,
  Edit,
  X,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useNewsletters } from "@/lib/api/hooks";

interface NewsletterDraft {
  id: number;
  name: string | null;
  subject: string;
  preheaderText: string;
  contentCount: number;
  status: string;
  createdAt: string;
  sentAt: string | null;
  articleCount?: number;
}

export default function NewslettersPage() {
  const { data, isLoading, mutate } = useNewsletters();
  const drafts: NewsletterDraft[] = data?.newsletters || [];
  
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewDraft, setPreviewDraft] = useState<NewsletterDraft | null>(
    null
  );
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [editedSubject, setEditedSubject] = useState<string>("");

  const handleSendNewsletter = async (draftId: number) => {
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft) return;

    if (
      !confirm(
        `Send newsletter "${draft.subject}" to all active subscribers?\\n\\nThis will send ${draft.articleCount} articles to all users.`
      )
    ) {
      return;
    }

    setSendingId(draftId);
    try {
      const response = await fetch("/api/admin/send-newsletter-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          data.message ||
            "Newsletter send enqueued. Delivery will process in the background."
        );
        mutate(); // Refresh to show updated status
      } else {
        const data = await response.json();
        alert(`Failed to send newsletter: ${data.error}`);
      }
    } catch (error) {
      console.error("Error sending newsletter:", error);
      alert("Error sending newsletter");
    } finally {
      setSendingId(null);
    }
  };

  const handlePreview = async (draft: NewsletterDraft) => {
    try {
      const response = await fetch(
        `/api/admin/newsletter-draft-preview?draftId=${draft.id}`
      );
      if (response.ok) {
        const html = await response.text();
        setPreviewHtml(html);
        setPreviewDraft(draft);
      } else {
        alert("Failed to load preview");
      }
    } catch (error) {
      console.error("Error loading preview:", error);
      alert("Error loading preview");
    }
  };

  const handleDelete = async (draftId: number) => {
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft) return;

    if (!confirm(`Delete newsletter draft "${draft.subject}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/newsletters/${draftId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Newsletter draft deleted");
        mutate();
      } else {
        alert("Failed to delete newsletter draft");
      }
    } catch (error) {
      console.error("Error deleting draft:", error);
      alert("Error deleting draft");
    }
  };

  const startEditingSubject = (draft: NewsletterDraft) => {
    setEditingSubjectId(draft.id);
    setEditedSubject(draft.subject);
  };

  const cancelEditingSubject = () => {
    setEditingSubjectId(null);
    setEditedSubject("");
  };

  const saveSubject = async (draftId: number) => {
    if (!editedSubject.trim()) {
      alert("Subject cannot be empty");
      return;
    }

    try {
      const response = await fetch(`/api/admin/newsletters/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: editedSubject }),
      });

      if (response.ok) {
        mutate(); // Refresh from server
        setEditingSubjectId(null);
        setEditedSubject("");
      } else {
        alert("Failed to update subject");
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      alert("Error updating subject");
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
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-1">
                Newsletters
              </h1>
              <p className="text-sm text-gray-400">
                Create, build, and send newsletters
              </p>
            </div>
            <Link href="/admin/newsletters/create">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Check className="mr-2 h-4 w-4" />
                Create New Newsletter
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Drafts List */}
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">
                  No newsletter drafts yet. Create one from the{" "}
                  <Link
                    href="/admin/curate"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Curation page
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          ) : (
            drafts.map((draft) => (
              <motion.div
                key={draft.id}
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
                              {editingSubjectId === draft.id ? (
                                <div>
                                  <input
                                    type="text"
                                    value={editedSubject}
                                    onChange={(e) =>
                                      setEditedSubject(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        saveSubject(draft.id);
                                      } else if (e.key === "Escape") {
                                        cancelEditingSubject();
                                      }
                                    }}
                                    className="w-full text-lg font-bold text-gray-100 bg-gray-900/50 border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                                    autoFocus
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      onClick={() => saveSubject(draft.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditingSubject}
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
                                  {draft.status === "draft" && (
                                    <button
                                      onClick={() => startEditingSubject(draft)}
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
                                  Created{" "}
                                  {new Date(draft.createdAt).toLocaleString()}
                                </span>
                              </div>
                              {draft.sentAt && (
                                <div className="flex items-center gap-1 text-green-400">
                                  <Check className="h-4 w-4" />
                                  <span>
                                    Sent{" "}
                                    {new Date(draft.sentAt).toLocaleString()}
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
                          {draft.status === "draft" && (
                            <Link href={`/admin/newsletters/${draft.id}/build`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-700 border-green-600 text-green-200 hover:bg-green-600 hover:text-white"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Build Newsletter
                              </Button>
                            </Link>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(draft)}
                            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>

                          {draft.status === "draft" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSendNewsletter(draft.id)}
                                disabled={sendingId === draft.id}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {sendingId === draft.id ? (
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

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(draft.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Preview Modal */}
        {previewHtml && previewDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setPreviewHtml(null);
              setPreviewDraft(null);
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
                      {previewDraft.subject}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewHtml(null);
                      setPreviewDraft(null);
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
