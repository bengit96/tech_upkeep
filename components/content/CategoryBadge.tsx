"use client";

import { getCategoryBySlug, getCategoryDisplay } from "@/lib/config/categories";

interface CategoryBadgeProps {
  categorySlug: string;
  showEmoji?: boolean;
  className?: string;
}

export function CategoryBadge({
  categorySlug,
  showEmoji = true,
  className = "",
}: CategoryBadgeProps) {
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium bg-gray-800/50 text-gray-300 border border-gray-700 ${className}`}
      >
        Uncategorized
      </span>
    );
  }

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${category.color} ${className}`}
    >
      {showEmoji ? `${category.name} ${category.emoji}` : category.name}
    </span>
  );
}
