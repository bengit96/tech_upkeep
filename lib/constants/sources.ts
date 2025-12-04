/**
 * Source type styling and configuration
 */

export type SourceType =
  | "youtube"
  | "twitter"
  | "reddit"
  | "rss"
  | "substack"
  | "medium"
  | "newsletter"
  | "podcast"
  | "blog"
  | "other";

export interface SourceStyle {
  bgColor: string;
  textColor: string;
  icon: string;
}

const SOURCE_COLORS: Record<SourceType, SourceStyle> = {
  youtube: {
    bgColor: "bg-red-900/30",
    textColor: "text-red-400",
    icon: "▶️",
  },
  twitter: {
    bgColor: "bg-blue-900/30",
    textColor: "text-blue-400",
    icon: "𝕏",
  },
  reddit: {
    bgColor: "bg-orange-900/30",
    textColor: "text-orange-400",
    icon: "🔴",
  },
  rss: {
    bgColor: "bg-yellow-900/30",
    textColor: "text-yellow-400",
    icon: "📡",
  },
  substack: {
    bgColor: "bg-purple-900/30",
    textColor: "text-purple-400",
    icon: "📧",
  },
  medium: {
    bgColor: "bg-gray-700/30",
    textColor: "text-gray-300",
    icon: "✍️",
  },
  newsletter: {
    bgColor: "bg-green-900/30",
    textColor: "text-green-400",
    icon: "📨",
  },
  podcast: {
    bgColor: "bg-pink-900/30",
    textColor: "text-pink-400",
    icon: "🎙️",
  },
  blog: {
    bgColor: "bg-indigo-900/30",
    textColor: "text-indigo-400",
    icon: "📝",
  },
  other: {
    bgColor: "bg-gray-900/30",
    textColor: "text-gray-400",
    icon: "📄",
  },
};

export function getSourceBadgeColor(
  sourceType: string | null | undefined
): SourceStyle {
  const normalizedType = (sourceType?.toLowerCase() ?? "other") as SourceType;
  return SOURCE_COLORS[normalizedType] || SOURCE_COLORS.other;
}

export function getSourceBadgeClasses(sourceType: string | null | undefined): string {
  const style = getSourceBadgeColor(sourceType);
  return `${style.bgColor} ${style.textColor} px-2 py-1 rounded-full text-xs font-medium`;
}
