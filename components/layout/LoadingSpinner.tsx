"use client";

import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  message = "Loading...",
  submessage,
  fullScreen = false,
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-blue-500 mb-4`}
      />
      {message && (
        <p className="text-gray-300 text-lg font-medium">{message}</p>
      )}
      {submessage && <p className="text-gray-500 text-sm">{submessage}</p>}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
