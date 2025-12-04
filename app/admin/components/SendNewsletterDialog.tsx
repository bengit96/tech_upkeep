"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send,
  FileText,
  Users,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { type User, type NewsletterDraft } from "@/lib/types/admin";

interface SendNewsletterDialogProps {
  showSendDialog: boolean;
  onOpenChange: (open: boolean) => void;
  availableDrafts: NewsletterDraft[];
  selectedDraftId: number | null;
  onSelectedDraftIdChange: (id: number) => void;
  allUsers: User[];
  selectedUserIds: number[];
  onToggleUser: (userId: number) => void;
  onSelectAll: () => void;
  onSelectActiveOnly: () => void;
  emailResult: string;
  isEmailLoading: boolean;
  onSendNewsletter: () => void;
}

export const SendNewsletterDialog = ({
  showSendDialog,
  onOpenChange,
  availableDrafts,
  selectedDraftId,
  onSelectedDraftIdChange,
  allUsers,
  selectedUserIds,
  onToggleUser,
  onSelectAll,
  onSelectActiveOnly,
  emailResult,
  isEmailLoading,
  onSendNewsletter,
}: SendNewsletterDialogProps) => {
  return (
    <Dialog open={showSendDialog} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Send className="h-6 w-6 text-blue-500" />
            Send Newsletter
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Select a newsletter draft and users to send to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Newsletter Draft Selection */}
          <div className="space-y-3 pb-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Select Newsletter to Send
            </h3>
            {availableDrafts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-gray-800/50 rounded-lg border border-gray-700">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No newsletter drafts available</p>
                <p className="text-sm mt-1">
                  Create a newsletter draft first before sending
                </p>
                <Link href="/admin/newsletters/create" className="mt-4 inline-block">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create Newsletter
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      selectedDraftId === draft.id
                        ? "bg-purple-950/30 border-purple-700"
                        : "bg-gray-800/50 border-gray-700"
                    } hover:border-gray-600 transition-colors cursor-pointer`}
                    onClick={() => onSelectedDraftIdChange(draft.id)}
                  >
                    <input
                      type="radio"
                      name="newsletter-draft"
                      checked={selectedDraftId === draft.id}
                      onChange={() => onSelectedDraftIdChange(draft.id)}
                      className="mt-1 h-4 w-4 border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-200">
                        {draft.subject}
                      </p>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        {draft.name && (
                          <span className="text-xs text-gray-400">
                            {draft.name}
                          </span>
                        )}
                        <span className="text-xs text-blue-400">
                          {draft.articleCount} articles
                        </span>
                        <span
                          className={`text-xs ${
                            draft.status === "finalized"
                              ? "text-green-400"
                              : draft.status === "sent"
                              ? "text-gray-500"
                              : "text-yellow-400"
                          }`}
                        >
                          {draft.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(draft.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Selection Controls */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select Recipients
            </h3>
            <div className="flex gap-2 pb-4 border-b border-gray-700">
              <Button
                onClick={onSelectAll}
                size="sm"
                variant="outline"
                className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
              >
                {selectedUserIds.length === allUsers.length ? "Deselect All" : "Select All"}
              </Button>
              <Button
                onClick={onSelectActiveOnly}
                size="sm"
                variant="outline"
                className="bg-blue-900/30 border-blue-700 text-blue-300 hover:bg-blue-900/50"
              >
                Active Only ({allUsers.filter(u => u.isActive).length})
              </Button>
              <div className="ml-auto text-sm text-gray-400 flex items-center">
                {selectedUserIds.length} of {allUsers.length} selected
              </div>
            </div>

            {/* User List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    selectedUserIds.includes(user.id)
                      ? "bg-blue-950/30 border-blue-700"
                      : "bg-gray-800/50 border-gray-700"
                  } hover:border-gray-600 transition-colors cursor-pointer`}
                  onClick={() => onToggleUser(user.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => onToggleUser(user.id)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-200">
                      {user.email}
                    </p>
                    <div className="flex gap-3 mt-1">
                      <span
                        className={`text-xs ${
                          user.isActive ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                      {user.engagementScore !== null && (
                        <span className="text-xs text-gray-400">
                          Engagement: {user.engagementScore}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Result Message */}
          {emailResult && (
            <div
              className={`p-3 rounded-md text-sm ${
                emailResult.startsWith("✅")
                  ? "bg-green-950/30 border border-green-700 text-green-300"
                  : "bg-red-950/30 border border-red-700 text-red-300"
              }`}
            >
              {emailResult}
            </div>
          )}

          {/* Send Button */}
          <div className="flex gap-2 pt-4 border-t border-gray-700">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1 bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
              disabled={isEmailLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={onSendNewsletter}
              disabled={isEmailLoading || selectedUserIds.length === 0 || !selectedDraftId}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEmailLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending to {selectedUserIds.length} users...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
