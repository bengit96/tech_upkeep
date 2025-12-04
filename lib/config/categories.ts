/**
 * Category configuration
 * Centralized category definitions with styling
 */

export interface CategoryConfig {
  name: string;
  slug: string;
  emoji: string;
  color: string;
  description?: string;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    name: "Frontend",
    slug: "frontend-engineering",
    emoji: "⚛️",
    color: "bg-purple-900/30 text-purple-300 hover:bg-purple-900/50 border border-purple-800",
    description: "React, Vue, Next.js, and modern frontend development",
  },
  {
    name: "Backend",
    slug: "backend-apis",
    emoji: "⚙️",
    color: "bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-800",
    description: "Node.js, Python, Go, APIs, and backend architectures",
  },
  {
    name: "Cloud & DevOps",
    slug: "cloud-devops",
    emoji: "☁️",
    color: "bg-cyan-900/30 text-cyan-300 hover:bg-cyan-900/50 border border-cyan-800",
    description: "AWS, Docker, Kubernetes, CI/CD, and infrastructure",
  },
  {
    name: "AI",
    slug: "ai-machine-learning",
    emoji: "🤖",
    color: "bg-pink-900/30 text-pink-300 hover:bg-pink-900/50 border border-pink-800",
    description: "Machine learning, LLMs, AI tools, and applications",
  },
  {
    name: "System Design",
    slug: "system-design-architecture",
    emoji: "📦",
    color: "bg-blue-900/30 text-blue-300 hover:bg-blue-900/50 border border-blue-800",
    description: "Architecture patterns, scalability, and system design",
  },
  {
    name: "Security",
    slug: "security",
    emoji: "🔒",
    color: "bg-red-900/30 text-red-300 hover:bg-red-900/50 border border-red-800",
    description: "Cybersecurity, authentication, and secure coding practices",
  },
  {
    name: "Dev Tools",
    slug: "developer-tools",
    emoji: "🛠️",
    color: "bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50 border border-yellow-800",
    description: "IDEs, extensions, productivity tools, and workflows",
  },
  {
    name: "Career",
    slug: "career-leadership",
    emoji: "📈",
    color: "bg-green-900/30 text-green-300 hover:bg-green-900/50 border border-green-800",
    description: "Career growth, leadership, and professional development",
  },
  {
    name: "Product & Culture",
    slug: "product",
    emoji: "🚀",
    color: "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50 border border-indigo-800",
    description: "Product management, startup culture, and team dynamics",
  },
  {
    name: "Opinions",
    slug: "opinions-general",
    emoji: "💭",
    color: "bg-orange-900/30 text-orange-300 hover:bg-orange-900/50 border border-orange-800",
    description: "Industry opinions, hot takes, and general tech discussions",
  },
];

// Helper functions
export const getCategoryBySlug = (slug: string): CategoryConfig | undefined => {
  return CATEGORIES.find((cat) => cat.slug === slug);
};

export const getCategoryColor = (slug: string): string => {
  const category = getCategoryBySlug(slug);
  return category?.color || "bg-gray-800/50 text-gray-300 border border-gray-700";
};

export const getCategoryDisplay = (slug: string): string => {
  const category = getCategoryBySlug(slug);
  return category ? `${category.name} ${category.emoji}` : "Uncategorized";
};
