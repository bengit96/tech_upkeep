/**
 * Content category definitions with styling and metadata
 */

export interface Category {
  name: string;
  slug: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  {
    name: "Frontend ⚛️",
    slug: "frontend-engineering",
    color: "text-purple-400",
    bgColor: "bg-purple-900/30",
    borderColor: "border-purple-700",
    emoji: "⚛️",
  },
  {
    name: "Backend 🔧",
    slug: "backend-engineering",
    color: "text-blue-400",
    bgColor: "bg-blue-900/30",
    borderColor: "border-blue-700",
    emoji: "🔧",
  },
  {
    name: "DevOps 🚀",
    slug: "devops",
    color: "text-orange-400",
    bgColor: "bg-orange-900/30",
    borderColor: "border-orange-700",
    emoji: "🚀",
  },
  {
    name: "AI/ML 🤖",
    slug: "ai-ml",
    color: "text-green-400",
    bgColor: "bg-green-900/30",
    borderColor: "border-green-700",
    emoji: "🤖",
  },
  {
    name: "Tools 🛠️",
    slug: "tools",
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/30",
    borderColor: "border-yellow-700",
    emoji: "🛠️",
  },
  {
    name: "Product 📊",
    slug: "product",
    color: "text-pink-400",
    bgColor: "bg-pink-900/30",
    borderColor: "border-pink-700",
    emoji: "📊",
  },
  {
    name: "Career 🎯",
    slug: "career",
    color: "text-indigo-400",
    bgColor: "bg-indigo-900/30",
    borderColor: "border-indigo-700",
    emoji: "🎯",
  },
  {
    name: "Security 🔐",
    slug: "security",
    color: "text-red-400",
    bgColor: "bg-red-900/30",
    borderColor: "border-red-700",
    emoji: "🔐",
  },
  {
    name: "News 📰",
    slug: "news",
    color: "text-cyan-400",
    bgColor: "bg-cyan-900/30",
    borderColor: "border-cyan-700",
    emoji: "📰",
  },
  {
    name: "Other 📌",
    slug: "other",
    color: "text-gray-400",
    bgColor: "bg-gray-900/30",
    borderColor: "border-gray-700",
    emoji: "📌",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((cat) => cat.slug === slug);
}

export function getCategoryColor(slug: string): string {
  return getCategoryBySlug(slug)?.bgColor || CATEGORIES[CATEGORIES.length - 1].bgColor;
}

export function getCategoryBorderColor(slug: string): string {
  return getCategoryBySlug(slug)?.borderColor || CATEGORIES[CATEGORIES.length - 1].borderColor;
}
