"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Edit } from "lucide-react";

interface FullNewsletterPreviewModalProps {
  showFullPreview: boolean;
  onClose: () => void;
  newsletterSubject: string;
  preheaderText: string;
  isEditingSubject: boolean;
  editedSubject: string;
  onStartEditingSubject: () => void;
  onCancelEditingSubject: () => void;
  onSaveSubject: () => void;
  onEditedSubjectChange: (value: string) => void;
}

export const FullNewsletterPreviewModal = ({
  showFullPreview,
  onClose,
  newsletterSubject,
  preheaderText,
  isEditingSubject,
  editedSubject,
  onStartEditingSubject,
  onCancelEditingSubject,
  onSaveSubject,
  onEditedSubjectChange,
}: FullNewsletterPreviewModalProps) => {
  if (!showFullPreview) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
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
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Subject Line Display */}
          {newsletterSubject && (
            <div className="space-y-2 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Subject Line
                  </label>
                  {!isEditingSubject && (
                    <button
                      onClick={onStartEditingSubject}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </button>
                  )}
                </div>
                {isEditingSubject ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editedSubject}
                      onChange={(e) => onEditedSubjectChange(e.target.value)}
                      onBlur={onSaveSubject}
                      className="w-full text-sm text-gray-200 bg-gray-900/50 border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onSaveSubject();
                        } else if (e.key === "Escape") {
                          onCancelEditingSubject();
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 italic">
                      Press Enter to save, Escape to cancel, or click outside to
                      save.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-100 font-medium mt-1">
                    {newsletterSubject}
                  </p>
                )}
              </div>
              {preheaderText && !isEditingSubject && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Preview Text
                  </label>
                  <p className="text-xs text-gray-300 mt-1">{preheaderText}</p>
                </div>
              )}
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
