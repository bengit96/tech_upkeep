"use client";

import { getSourceBadgeColor, getSourceDisplayName } from "@/lib/config/sources";

interface SourceBadgeProps {
  sourceType: string;
  className?: string;
}

export function SourceBadge({ sourceType, className = "" }: SourceBadgeProps) {
  const badgeColor = getSourceBadgeColor(sourceType);
  const displayName = getSourceDisplayName(sourceType);

  return (
    <span
      className={`px-1.5 py-0.5 rounded border text-xs font-medium ${badgeColor} ${className}`}
    >
      {displayName}
    </span>
  );
}
