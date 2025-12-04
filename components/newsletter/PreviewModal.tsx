"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  htmlContent: string;
}

export function PreviewModal({
  isOpen,
  onClose,
  title,
  subtitle,
  htmlContent,
}: PreviewModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
              <div>
                <h2 className="text-xl font-bold text-gray-100">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <iframe
              srcDoc={htmlContent}
              className="w-full h-full border-0"
              title={title}
              sandbox="allow-same-origin"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
