/**
 * Source type configuration
 * Badge colors and display settings for different content sources
 */

export interface SourceTypeConfig {
  type: string;
  displayName: string;
  badgeColor: string;
  icon?: string;
}

export const SOURCE_TYPES: Record<string, SourceTypeConfig> = {
  youtube: {
    type: "youtube",
    displayName: "YouTube",
    badgeColor: "bg-red-900/30 text-red-300 border-red-800",
    icon: "▶️",
  },
  twitter: {
    type: "twitter",
    displayName: "Twitter/X",
    badgeColor: "bg-blue-900/30 text-blue-300 border-blue-800",
    icon: "🐦",
  },
  article: {
    type: "article",
    displayName: "Article",
    badgeColor: "bg-green-900/30 text-green-300 border-green-800",
    icon: "📰",
  },
  reddit: {
    type: "reddit",
    displayName: "Reddit",
    badgeColor: "bg-orange-900/30 text-orange-300 border-orange-800",
    icon: "🔶",
  },
  substack: {
    type: "substack",
    displayName: "Substack",
    badgeColor: "bg-purple-900/30 text-purple-300 border-purple-800",
    icon: "📧",
  },
  podcast: {
    type: "podcast",
    displayName: "Podcast",
    badgeColor: "bg-indigo-900/30 text-indigo-300 border-indigo-800",
    icon: "🎙️",
  },
  github: {
    type: "github",
    displayName: "GitHub",
    badgeColor: "bg-gray-900/50 text-gray-200 border-gray-700",
    icon: "⚡",
  },
  medium: {
    type: "medium",
    displayName: "Medium",
    badgeColor: "bg-emerald-900/30 text-emerald-300 border-emerald-800",
    icon: "✍️",
  },
  blog: {
    type: "blog",
    displayName: "Blog",
    badgeColor: "bg-blue-900/30 text-blue-300 border-blue-800",
    icon: "📝",
  },
};

// Helper functions
export const getSourceBadgeColor = (sourceType: string): string => {
  return SOURCE_TYPES[sourceType]?.badgeColor || "bg-gray-800/50 text-gray-300 border-gray-700";
};

export const getSourceDisplayName = (sourceType: string): string => {
  return SOURCE_TYPES[sourceType]?.displayName || sourceType.toUpperCase();
};

export const getSourceIcon = (sourceType: string): string => {
  return SOURCE_TYPES[sourceType]?.icon || "📄";
};
