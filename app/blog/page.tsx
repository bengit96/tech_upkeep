import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import Logo from "@/components/layout/Logo";

export const metadata: Metadata = {
  title: "Blog - Tech Upkeep",
  description:
    "Learn about tech newsletters, staying updated as a developer, and engineering blogs. Tips for junior and senior engineers.",
  openGraph: {
    title: "Blog - Tech Upkeep",
    description:
      "Learn about tech newsletters, staying updated as a developer, and engineering blogs.",
    url: "https://techupkeep.dev/blog",
  },
  alternates: {
    canonical: "https://techupkeep.dev/blog",
  },
};

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readTime: string;
  category: string;
}

const blogPosts: BlogPost[] = [
  {
    slug: "cloud-outages-2025-ai-infrastructure",
    title: "The Year the Internet Kept Breaking: 2025's Major Cloud Outages and the AI Factor",
    description:
      "Google Cloud, AWS, Azure, Cloudflare - all went down in 2025. Not from cyberattacks, but config errors. $60 billion in damages and counting. Here's what actually happened.",
    publishedAt: "2025-11-21",
    readTime: "14 min read",
    category: "Infrastructure & Cloud",
  },
  {
    slug: "ai-coding-agents-reality-check",
    title: "AI Coding Agents: What the Data Actually Shows",
    description:
      "Octomind's article barely scratched the surface. GitHub reports 51% faster coding, 82% of developers use AI daily, and Google sees 2.5x better task completion. Here's what they missed.",
    publishedAt: "2025-11-14",
    readTime: "12 min read",
    category: "Developer Productivity",
  },
  {
    slug: "state-of-agentic-ai-2025",
    title:
      "The Uncomfortable Truth About AI Agents: 90% Claim Victory While 10% Achieve Adoption",
    description:
      "MMC Ventures' data exposes the strategic miscalculation that will eliminate 40% of agent initiatives by 2027. Analysis of accuracy vs adoption, pricing models, and what actually works.",
    publishedAt: "2025-11-08",
    readTime: "10 min read",
    category: "AI / Analysis",
  },
  {
    slug: "reddit-ai-data-war",
    title: "Reddit vs. AI Giants: The Data War That Will Define the Internet",
    description:
      "Analysis of Reddit's lawsuits against Anthropic and Perplexity over AI training data. Examining legal precedent, user compensation, and implications for the open web.",
    publishedAt: "2025-10-30",
    readTime: "12 min read",
    category: "AI & Ethics",
  },
  {
    slug: "why-i-built-tech-upkeep",
    title: "Why I Built Tech Upkeep",
    description:
      "My inbox was a mess of tech newsletters, most of which I didn't read. So I built Tech Upkeep to curate the tech news I actually care about and figured others might want it too.",
    publishedAt: "2025-10-27",
    readTime: "8 min read",
    category: "Origin Story",
  },
  // Hidden - still working on this one
  // {
  //   slug: "understanding-prompt-engineering",
  //   title: "Understanding Prompt Engineering",
  //   description:
  //     "Learn about prompt engineering and why it should be your first step in optimizing your AI systems. Discover practical techniques for in-context learning, data modeling, and quality optimization.",
  //   publishedAt: "2025-10-26",
  //   readTime: "12 min read",
  //   category: "AI Engineering",
  // },
  {
    slug: "aws-outage-october-2025-analysis",
    title:
      "AWS US-EAST-1 Outage (October 2025): What Happened and What We Can Learn",
    description:
      "Analysis of the massive AWS outage on October 20, 2025 that took down Snapchat, Roblox, Fortnite, and thousands of websites. Technical breakdown and lessons for engineering teams.",
    publishedAt: "2025-10-21",
    readTime: "10 min read",
    category: "Infrastructure & Cloud",
  },
  {
    slug: "github-trending-discover-new-tools",
    title: "GitHub Trending: Your Secret Weapon for Discovering New Tools",
    description:
      "Learn how to use GitHub Trending to discover cutting-edge tools, libraries, and frameworks before everyone else. A developer's guide to staying ahead of the curve.",
    publishedAt: "2025-10-21",
    readTime: "7 min read",
    category: "Developer Tools",
  },
  {
    slug: "how-to-stay-updated-as-junior-software-engineer",
    title: "How to Stay Updated as a Junior Software Engineer",
    description:
      "Learn proven strategies to stay current with tech trends without information overload. Build a sustainable learning system with newsletters, GitHub Trending, and more.",
    publishedAt: "2025-10-18",
    readTime: "10 min read",
    category: "Career Growth",
  },
  {
    slug: "best-tech-newsletters-for-junior-developers",
    title: "10 Best Tech Newsletters for Junior Developers in 2025",
    description:
      "Discover the top newsletters that will accelerate your engineering career. From beginner-friendly to advanced content, we've curated the best sources for software engineers.",
    publishedAt: "2025-10-15",
    readTime: "8 min read",
    category: "Learning",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Logo size="sm" variant="default" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-4">
            Tech Upkeep Blog
          </h1>
          <p className="text-lg text-gray-400">
            Insights on tech newsletters, engineering blogs, and staying updated
            as a developer
          </p>
        </div>

        {/* Blog Posts */}
        <div className="space-y-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <article className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:bg-gray-900/70">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 mb-3">
                      {post.category}
                    </span>
                    <h2 className="text-2xl font-semibold text-gray-100 mb-2 group-hover:text-blue-300 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-400 leading-relaxed mb-4">
                      {post.description}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-600 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-100 mb-3">
            Want curated tech content delivered to your inbox?
          </h2>
          <p className="text-gray-400 mb-6">
            Join 2,500+ engineers receiving the best tech content every Tuesday
            & Friday
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            Subscribe to Newsletter
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
