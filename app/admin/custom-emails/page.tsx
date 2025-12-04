"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Plus, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  useCustomEmailDrafts,
  useCreateCustomEmail,
  useUpdateCustomEmail,
  useDeleteCustomEmail,
} from "@/lib/hooks/use-custom-emails";
import type {
  CustomEmailDraft,
  TargetAudience,
  CreateCustomEmailRequest,
  UpdateCustomEmailRequest,
} from "@/lib/types/custom-email";
import EmailEditorDialog from "./components/EmailEditorDialog";
import EmailSendDialog from "./components/EmailSendDialog";
import EmailPreviewDialog from "./components/EmailPreviewDialog";
import EmailDraftCard from "./components/EmailDraftCard";

export default function CustomEmailsPage() {
  const { drafts, isLoading, mutate } = useCustomEmailDrafts();
  const { createDraft, isCreating } = useCreateCustomEmail();
  const { updateDraft, isUpdating } = useUpdateCustomEmail();
  const { deleteDraft } = useDeleteCustomEmail();

  const [showEditor, setShowEditor] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingDraft, setEditingDraft] = useState<CustomEmailDraft | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCustomEmailRequest>({
    name: "",
    subject: "",
    preheaderText: "",
    htmlContent: "",
    includeTracking: true,
    targetAudience: { allUsers: true },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      subject: "",
      preheaderText: "",
      htmlContent: "",
      includeTracking: true,
      targetAudience: { allUsers: true },
    });
    setEditingDraft(null);
  };

  const openEditor = (draft?: CustomEmailDraft) => {
    if (draft) {
      setEditingDraft(draft);
      setFormData({
        name: draft.name,
        subject: draft.subject,
        preheaderText: draft.preheaderText || "",
        htmlContent: draft.htmlContent,
        includeTracking: draft.includeTracking,
        targetAudience: draft.targetAudience ? JSON.parse(draft.targetAudience) : { allUsers: true },
      });
    } else {
      resetForm();
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.htmlContent) {
      setMessage({ type: "error", text: "Name, subject, and content are required" });
      return;
    }

    try {
      if (editingDraft) {
        await updateDraft({ ...formData, id: editingDraft.id } as UpdateCustomEmailRequest);
        setMessage({ type: "success", text: "Draft updated successfully" });
      } else {
        await createDraft(formData);
        setMessage({ type: "success", text: "Draft created successfully" });
      }

      mutate();
      setTimeout(() => {
        setShowEditor(false);
        resetForm();
        setMessage(null);
      }, 1500);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save draft" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;

    try {
      await deleteDraft(id);
      mutate();
    } catch (error) {
      console.error("Error deleting draft:", error);
    }
  };

  const openSendDialog = (draft: CustomEmailDraft) => {
    setEditingDraft(draft);
    setShowSendDialog(true);
  };

  const openPreview = (htmlContent: string) => {
    setPreviewHtml(htmlContent);
    setShowPreview(true);
  };

  const getTargetDescription = (targetAudience: string | null) => {
    if (!targetAudience) return "All active users";
    const parsed: TargetAudience = JSON.parse(targetAudience);
    if (parsed.allUsers) return "All active users";
    if (parsed.specificUserIds && parsed.specificUserIds.length > 0) {
      return `${parsed.specificUserIds.length} specific users`;
    }
    const filters = [];
    if (parsed.audience) filters.push(`audience: ${parsed.audience.join(", ")}`);
    if (parsed.seniority) filters.push(`seniority: ${parsed.seniority.join(", ")}`);
    if (parsed.companySize) filters.push(`company: ${parsed.companySize.join(", ")}`);
    if (parsed.country) filters.push(`country: ${parsed.country.join(", ")}`);
    if (parsed.riskLevel) filters.push(`risk: ${parsed.riskLevel.join(", ")}`);
    return filters.join(" | ") || "Custom filters";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Custom Emails
            </h1>
            <p className="text-gray-400 mt-2">Create and send custom emails to your subscribers</p>
          </div>
          <Button
            onClick={() => openEditor()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Email
          </Button>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            {message.text}
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12 text-gray-400">
            Loading drafts...
          </div>
        )}

        {/* Drafts List */}
        {!isLoading && (
          <div className="grid gap-4">
            {drafts?.map((draft) => (
              <EmailDraftCard
                key={draft.id}
                draft={draft}
                getTargetDescription={getTargetDescription}
                onPreview={() => openPreview(draft.htmlContent)}
                onEdit={() => openEditor(draft)}
                onSend={() => openSendDialog(draft)}
                onDelete={() => handleDelete(draft.id)}
              />
            ))}

            {drafts && drafts.length === 0 && (
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="text-center py-12 text-gray-400">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No email drafts yet. Create your first custom email!</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Editor Dialog */}
        <EmailEditorDialog
          open={showEditor}
          onOpenChange={setShowEditor}
          formData={formData}
          setFormData={setFormData}
          isLoading={isCreating || isUpdating}
          isEditing={!!editingDraft}
          onSave={handleSave}
        />

        {/* Send Dialog */}
        {editingDraft && (
          <EmailSendDialog
            open={showSendDialog}
            onOpenChange={setShowSendDialog}
            draft={editingDraft}
            getTargetDescription={getTargetDescription}
            onSuccess={() => {
              mutate();
              setShowSendDialog(false);
            }}
          />
        )}

        {/* Preview Dialog */}
        <EmailPreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          htmlContent={previewHtml}
        />
      </div>
    </div>
  );
}
