"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  action,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {backHref && (
        <Link
          href={backHref}
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-1">{title}</h1>
          {description && (
            <p className="text-sm text-gray-400">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </motion.div>
  );
}
