"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Users,
  BookOpen,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import { CURATOR_EMAIL } from "@/lib/constants";
import { CATEGORIES } from "@/lib/config/categories";
import Logo from "@/components/layout/Logo";
import { StructuredData } from "@/components/layout/StructuredData";

export const dynamic = "force-dynamic";

interface RecentContent {
  id: number;
  title: string;
  summary: string;
  link: string;
  sourceType: string;
  sourceName: string;
  category: { name: string } | null;
  tags: { name: string }[];
  publishedAt: string;
  readingTime?: string;
  isFeatured?: boolean;
  featuredOrder?: number | null;
}

interface RecentContentResponse {
  hasContent: boolean;
  content: RecentContent[];
}

const recentContentFetcher = async (
  url: string
): Promise<RecentContentResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch recent content");
  }
  return response.json();
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const {
    data: recentContentData,
    isLoading: isRecentContentLoading,
    error: recentContentError,
  } = useSWR<RecentContentResponse>(
    "/api/public/recent-content",
    recentContentFetcher,
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (recentContentError) {
      console.error("Failed to fetch recent content:", recentContentError);
    }
  }, [recentContentError]);

  const recentContent =
    recentContentData?.hasContent && Array.isArray(recentContentData.content)
      ? recentContentData.content
      : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setIsSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Example content headlines (actual examples from the newsletter)
  const exampleContent = [
    {
      title: "How Netflix Scales Its API with GraphQL Federation",
      source: "Netflix Tech Blog",
      category: "System Design",
    },
    {
      title: "Building a Real-Time Collaboration Feature with CRDTs",
      source: "Figma Engineering",
      category: "Frontend",
    },
    {
      title: "Reducing Kubernetes Costs by 60% at Airbnb",
      source: "Airbnb Engineering",
      category: "Cloud & DevOps",
    },
    {
      title: "Fine-Tuning LLMs for Production: Lessons from Stripe",
      source: "Stripe Dev Blog",
      category: "AI/ML",
    },
    {
      title: "Zero-Downtime Database Migrations at Scale",
      source: "Uber Engineering",
      category: "Backend",
    },
  ];

  return (
    <>
      <StructuredData />
      <Tooltip.Provider delayDuration={200}>
        <div className="min-h-screen bg-gray-950 relative overflow-hidden">
          {/* Animated Tech Grid Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-gray-900 to-purple-950/20"></div>
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.15) 1px, transparent 1px)
          `,
              backgroundSize: "64px 64px",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-950"></div>

          <div className="relative container mx-auto px-4 py-12">
            {/* Hero Section - Simplified */}
            <motion.div
              className="text-center mb-20 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Logo
                  size="lg"
                  variant="default"
                  className="justify-center mb-12"
                />
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-100 mb-4 md:mb-6 leading-tight px-4 sm:px-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Discover What's Trending
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Before Your Team Asks
                </span>
              </motion.h1>

              {/* Benefit Statement */}
              <motion.p
                className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-6 md:mb-8 leading-relaxed px-4 sm:px-6 md:px-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <span className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded border border-blue-500/30 whitespace-nowrap">
                  <span className="text-blue-300 font-semibold text-sm sm:text-base">
                    ⭐ GitHub Trending
                  </span>
                </span>{" "}
                + Big Tech engineering blogs + breaking news.
                <br className="hidden sm:block" />
                <span className="block sm:inline text-gray-400 text-sm sm:text-base md:text-lg mt-2 sm:mt-0">
                  Bi-weekly insights for product engineers who ship.
                </span>
              </motion.p>

              {/* Email Form - Moved Up */}
              <motion.div
                className="max-w-xl mx-auto mb-6 px-4 sm:px-6 md:px-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {isSuccess ? (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-gray-100 mb-2">
                      Welcome to Tech Upkeep!
                    </h3>
                    <p className="text-gray-400 mb-4">
                      You'll receive your newsletter every Tuesday and Friday
                    </p>
                    <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-4 max-w-md mx-auto">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="text-blue-300 text-sm font-medium mb-1">
                            Check your inbox!
                          </p>
                          <p className="text-blue-200/80 text-sm">
                            We just sent you our most recent newsletter. If you
                            don't see it, please check your spam folder.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Subscribe another email
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="flex-1 h-12 sm:h-14 text-base sm:text-lg bg-gray-900/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                      />
                      <Button
                        type="submit"
                        className="h-12 sm:h-14 px-6 sm:px-10 text-sm sm:text-base bg-blue-600 hover:bg-blue-500 font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/60 transition-all hover:scale-[1.02] active:scale-[0.98] border border-blue-500/50 whitespace-nowrap"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          "Subscribing..."
                        ) : (
                          <>
                            Subscribe Free{" "}
                            <ArrowRight className="ml-1 sm:ml-2 h-4 sm:h-5 w-4 sm:w-5" />
                          </>
                        )}
                      </Button>
                    </div>
                    {error && (
                      <motion.div
                        className="bg-red-900/20 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {error}
                      </motion.div>
                    )}
                    <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green-500" />
                        <span className="hidden xs:inline">No spam</span>
                        <span className="xs:hidden">Free</span>
                      </span>
                      <span className="hidden xs:inline">•</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green-500" />
                        Unsubscribe anytime
                      </span>
                    </div>
                  </form>
                )}
              </motion.div>
            </motion.div>

            {/* Social Proof Bar */}
            <motion.div
              className="max-w-4xl mx-auto mb-16 sm:mb-20 text-center px-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-800/30 border border-gray-700/50 rounded-full">
                <span className="text-gray-700 hidden xs:inline">•</span>
                <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-300">
                  <Zap className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green-400" />
                  Tue & Fri
                </span>
                <span className="text-gray-700 hidden xs:inline">•</span>
                <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green-400" />
                  Free forever
                </span>
              </div>
            </motion.div>

            {/* Categories We Cover */}
            <motion.section
              className="max-w-5xl mx-auto mb-16 sm:mb-20 px-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-100 mb-2">
                Stay Ahead of the Curve
              </h2>
              <p className="text-center text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
                From trending tools to Big Tech engineering insights—discover
                what matters before it's mainstream
              </p>

              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 max-w-3xl mx-auto">
                {[
                  { emoji: "⚛️", title: "Frontend" },
                  { emoji: "⚙️", title: "Backend" },
                  { emoji: "☁️", title: "Cloud & DevOps" },
                  { emoji: "🤖", title: "AI/ML" },
                  { emoji: "📦", title: "System Design" },
                  { emoji: "🔒", title: "Security" },
                  { emoji: "🛠️", title: "Dev Tools" },
                  { emoji: "📈", title: "Career" },
                  { emoji: "🚀", title: "Product" },
                ].map((cat, index) => (
                  <motion.div
                    key={cat.title}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800/30 border border-gray-700/50 rounded-full hover:border-blue-500/50 hover:bg-gray-800/50 transition-all"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="text-lg sm:text-xl">{cat.emoji}</span>
                    <span className="text-xs sm:text-sm text-gray-300">
                      {cat.title}
                    </span>
                  </motion.div>
                ))}
              </div>

              <motion.article
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h3 className="text-lg sm:text-xl font-semibold text-gray-100 mb-2 text-center">
                  {recentContent.length > 0
                    ? "From Our Latest Newsletter"
                    : "Example Content You'll Receive"}
                </h3>
                {recentContent.length > 0 && (
                  <p className="text-xs sm:text-sm text-gray-500 text-center mb-4 sm:mb-6">
                    Real articles sent to subscribers
                  </p>
                )}

                {isRecentContentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <>
                    {(() => {
                      // Group articles by category for real content, or show example content
                      const displayContent =
                        recentContent.length > 0
                          ? recentContent
                          : exampleContent;

                      // Group by category
                      const groupedByCategory = displayContent.reduce(
                        (acc, item) => {
                          const categoryName =
                            "category" in item && item.category
                              ? typeof item.category === "string"
                                ? item.category
                                : item.category.name
                              : "Tech";

                          if (!acc[categoryName]) {
                            acc[categoryName] = [];
                          }
                          acc[categoryName].push(item);
                          return acc;
                        },
                        {} as Record<
                          string,
                          (
                            | RecentContent
                            | {
                                title: string;
                                source: string;
                                category: string;
                              }
                          )[]
                        >
                      );

                      // Get category config for styling
                      const getCategoryConfig = (categoryName: string) => {
                        // Map database category names to our config names
                        const categoryMapping: Record<string, string> = {
                          "Backend & APIs": "Backend",
                          "Frontend Engineering": "Frontend",
                          "Cloud & DevOps": "Cloud & DevOps",
                          AI: "AI",
                          "System Design & Architecture": "System Design",
                          "Developer Tools": "Dev Tools",
                          "Career & Leadership": "Career",
                          "Product/Culture": "Product & Culture",
                          Security: "Security",
                          "Opinions & General": "Opinions",
                        };

                        const mappedName =
                          categoryMapping[categoryName] || categoryName;
                        return CATEGORIES.find(
                          (cat) => cat.name === mappedName
                        );
                      };

                      return Object.entries(groupedByCategory).map(
                        ([categoryName, articles], categoryIndex) => {
                          const categoryConfig =
                            getCategoryConfig(categoryName);

                          return (
                            <div key={categoryName} className="mb-8 last:mb-0">
                              {/* Category Header */}
                              <div className="flex items-center gap-3 mb-4">
                                <div
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                                    categoryConfig
                                      ? categoryConfig.color
                                      : "bg-gray-800/50 text-gray-300 border border-gray-700"
                                  }`}
                                >
                                  <span className="text-lg">
                                    {categoryConfig?.emoji || "📄"}
                                  </span>
                                  <span>{categoryName}</span>
                                </div>
                                <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent"></div>
                                <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                                  {articles.length} article
                                  {articles.length !== 1 ? "s" : ""}
                                </span>
                              </div>

                              {/* Articles in this category */}
                              <div className="space-y-3">
                                {articles.map((item, index) => (
                                  <motion.a
                                    key={"id" in item ? item.id : index}
                                    href={"link" in item ? item.link : "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group bg-gray-800/70 border border-gray-700 rounded-xl p-3 sm:p-4 md:p-5 hover:border-blue-500/50 hover:bg-gray-800/90 transition-all cursor-pointer block"
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                      duration: 0.4,
                                      delay: categoryIndex * 0.1 + index * 0.05,
                                    }}
                                    whileHover={{ x: 4, scale: 1.01 }}
                                  >
                                    <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                                      <div className="hidden sm:block flex-shrink-0 w-1 h-16 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1 sm:mb-2">
                                          <h4 className="text-gray-100 font-semibold text-sm sm:text-base leading-snug group-hover:text-blue-300 transition-colors">
                                            {item.title}
                                          </h4>
                                          <ExternalLink className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-gray-600 group-hover:text-blue-400 flex-shrink-0 mt-1 transition-colors" />
                                        </div>
                                        {"summary" in item && item.summary && (
                                          <p className="text-gray-400 text-xs sm:text-sm mb-1.5 sm:mb-2 line-clamp-2 leading-relaxed">
                                            {item.summary.length > 150
                                              ? item.summary.substring(0, 150) +
                                                "..."
                                              : item.summary}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-2 sm:gap-3 text-sm flex-wrap">
                                          <span className="text-gray-500 text-xs truncate max-w-[120px] sm:max-w-none">
                                            {"sourceName" in item
                                              ? item.sourceName
                                              : "source" in item
                                                ? item.source
                                                : ""}
                                          </span>
                                          {"readingTime" in item &&
                                            item.readingTime && (
                                              <>
                                                <span className="text-gray-700">
                                                  ·
                                                </span>
                                                <span className="flex items-center gap-1 text-gray-500 text-xs">
                                                  <Clock className="h-3 w-3" />
                                                  <span>
                                                    {item.readingTime}
                                                  </span>
                                                </span>
                                              </>
                                            )}
                                          <span className="text-gray-700 hidden xs:inline">
                                            ·
                                          </span>
                                          <span
                                            className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium border ${
                                              categoryConfig
                                                ? categoryConfig.color
                                                    .replace("bg-", "bg-")
                                                    .replace("text-", "text-")
                                                    .replace("hover:bg-", "")
                                                    .replace(
                                                      "border border-",
                                                      "border "
                                                    )
                                                : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                                            }`}
                                          >
                                            {categoryName}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.a>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      );
                    })()}

                    <p className="text-center text-gray-400 text-xs sm:text-sm mt-6 sm:mt-8 px-4">
                      <span className="text-gray-500 text-xs inline-block">
                        GitHub Trending · Engineering Blogs · Technical YouTube
                        · Hacker News · Reddit · Podcasts
                      </span>
                    </p>
                  </>
                )}
              </motion.article>
            </motion.section>

            {/* Blog CTA */}
            <motion.section
              className="max-w-4xl mx-auto mb-12 sm:mb-16 px-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6 sm:p-8 text-center">
                <BookOpen className="h-10 sm:h-12 w-10 sm:w-12 text-blue-400 mx-auto mb-3 sm:mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2 sm:mb-3">
                  Learn How to Stay Updated as a Developer
                </h2>
                <p className="text-sm sm:text-base text-gray-400 mb-5 sm:mb-6 max-w-2xl mx-auto">
                  Read our in-depth guides on tech newsletters, engineering
                  blogs, and learning resources for junior developers
                </p>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 text-sm sm:text-base font-semibold rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                >
                  Read the Blog
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.section>

            {/* Footer */}
            <motion.div
              className="text-center pt-8 sm:pt-12 pb-6 sm:pb-8 border-t border-gray-800/50 px-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">
                For product engineers who ship, not just code
              </p>
              <p className="text-gray-600 text-xs sm:text-sm mb-4">
                Curated by{" "}
                <span className="text-gray-500 font-medium">Benjamin Loh</span>
              </p>

              {/* Social Links */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-4">
                <a
                  href="https://www.instagram.com/techupkeep/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-pink-500/50 rounded-lg text-gray-400 hover:text-pink-400 transition-all text-sm group"
                >
                  <svg
                    className="h-3.5 sm:h-4 w-3.5 sm:w-4 group-hover:scale-110 transition-transform"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm6.5-.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" />
                  </svg>
                  <span className="hidden xs:inline">Instagram</span>
                </a>
                <a
                  href="https://www.tiktok.com/@techupkeep"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-pink-500/50 rounded-lg text-gray-400 hover:text-pink-400 transition-all text-sm group"
                >
                  <svg
                    className="h-4 w-4 group-hover:scale-110 transition-transform"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                  <span>TikTok</span>
                </a>
                <a
                  href="https://substack.com/@benfromtechupkeep"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-orange-500/50 rounded-lg text-gray-400 hover:text-orange-400 transition-all text-sm group"
                >
                  <svg
                    className="h-4 w-4 group-hover:scale-110 transition-transform"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
                  </svg>
                  <span>Substack</span>
                </a>
              </div>

              <Tooltip.Root delayDuration={100}>
                <Tooltip.Trigger asChild>
                  <a
                    href={`mailto:${CURATOR_EMAIL}`}
                    className="inline-block text-gray-600 hover:text-blue-400 transition-all duration-300 text-sm font-light cursor-pointer hover:underline underline-offset-2"
                  >
                    Feedback? Reach out
                  </a>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 px-4 py-2.5 rounded-xl text-sm shadow-2xl border border-blue-500/30 max-w-xs animate-in fade-in zoom-in-95 duration-200"
                    sideOffset={8}
                  >
                    <div className="flex items-center gap-2">
                      <span>💬</span>
                      <span>{CURATOR_EMAIL}</span>
                    </div>
                    <Tooltip.Arrow
                      className="fill-gray-800"
                      width={12}
                      height={6}
                    />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </motion.div>
          </div>
        </div>
      </Tooltip.Provider>
    </>
  );
}
