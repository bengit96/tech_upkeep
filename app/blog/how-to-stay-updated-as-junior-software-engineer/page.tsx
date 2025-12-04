import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, CheckCircle2, BookOpen, Github, Twitter, Youtube, Podcast } from "lucide-react";
import Logo from "@/components/layout/Logo";
import BlogVisitTracker from "@/components/BlogVisitTracker";
import BlogSubscriptionModal from "@/components/BlogSubscriptionModal";
import BlogInlineSubscription from "@/components/BlogInlineSubscription";

export const metadata: Metadata = {
  title: "How to Stay Updated as a Junior Software Engineer in 2025 | Tech Upkeep",
  description: "Learn proven strategies to stay current with tech trends as a junior developer. From newsletters to podcasts, discover how to learn programming and grow your engineering skills without information overload.",
  keywords: [
    "how to stay updated as developer",
    "how to learn programming",
    "junior software engineer",
    "developer learning",
    "stay current with tech",
    "software engineering learning",
    "tech learning strategy",
    "bootcamp grad learning",
  ],
  openGraph: {
    title: "How to Stay Updated as a Junior Software Engineer in 2025",
    description: "Proven strategies to stay current with tech trends without information overload.",
    url: "https://www.techupkeep.dev/blog/how-to-stay-updated-as-junior-software-engineer",
    type: "article",
    publishedTime: "2025-10-18T00:00:00Z",
    images: [
      {
        url: "https://www.techupkeep.dev/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "How to Stay Updated as a Junior Software Engineer in 2025",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://www.techupkeep.dev/og-image.jpeg"],
  },
  alternates: {
    canonical: "https://www.techupkeep.dev/blog/how-to-stay-updated-as-junior-software-engineer",
  },
};

export default function BlogPost() {
  const learningChannels = [
    {
      icon: BookOpen,
      name: "Curated Newsletters",
      description: "The most efficient way to stay updated",
      examples: ["Tech Upkeep", "TLDR Newsletter", "ByteByteGo"],
      why: "Newsletters filter hundreds of sources into digestible summaries. You get the best content without spending hours searching.",
      timeCommitment: "15-30 min/week",
    },
    {
      icon: Github,
      name: "GitHub Trending",
      description: "Discover new tools and libraries",
      examples: ["GitHub Trending (Daily/Weekly)", "GitHub Explore", "Awesome Lists"],
      why: "See what developers worldwide are building. Discover tools before they become mainstream. Learn from real code.",
      timeCommitment: "10-15 min/week",
    },
    {
      icon: Twitter,
      name: "Tech Twitter/LinkedIn",
      description: "Follow the right engineers",
      examples: ["Kent C. Dodds", "Dan Abramov", "Theo Browne", "Cassidy Williams"],
      why: "Get instant updates on breaking changes, hot takes, and behind-the-scenes insights from engineers at big tech.",
      timeCommitment: "15-20 min/day (optional)",
    },
    {
      icon: Youtube,
      name: "YouTube Channels",
      description: "Visual learning and deep dives",
      examples: ["Fireship", "ThePrimeagen", "Web Dev Simplified", "Traversy Media"],
      why: "Complex concepts become easier with visual explanations. Great for system design, architecture, and tutorials.",
      timeCommitment: "1-2 videos/week",
    },
    {
      icon: Podcast,
      name: "Tech Podcasts",
      description: "Learn during commutes",
      examples: ["Syntax.fm", "The Changelog", "Software Engineering Daily"],
      why: "Turn dead time into learning time. Get perspectives from experienced engineers.",
      timeCommitment: "1-2 episodes/week",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <BlogVisitTracker page="/blog/how-to-stay-updated-as-junior-software-engineer" />
      <BlogSubscriptionModal
        source="blog"
        sourcePage="/blog/how-to-stay-updated-as-junior-software-engineer"
      />
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Logo size="sm" variant="default" />
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Title */}
        <header className="mb-8">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 mb-4">
            Career Growth
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-4 leading-tight">
            How to Stay Updated as a Junior Software Engineer
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <time dateTime="2025-10-18">October 18, 2025</time>
            <span>·</span>
            <span>10 min read</span>
          </div>
        </header>

        {/* Introduction */}
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-gray-300 leading-relaxed mb-6">
            You just landed your first software engineering job. Congratulations! Now comes the hard part: <strong className="text-gray-100">staying relevant</strong>.
          </p>
          <p className="text-gray-300 leading-relaxed mb-6">
            JavaScript frameworks change every month. New database technologies emerge quarterly. Yesterday's best practices become today's anti-patterns. How do senior engineers stay on top of everything?
          </p>
          <p className="text-gray-300 leading-relaxed mb-8">
            The truth is, <strong className="text-gray-100">they don't</strong>. Nobody can keep up with everything. The secret is having a <strong className="text-gray-100">learning system</strong> that filters signal from noise.
          </p>

          {/* Key Takeaways Box */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 mb-12">
            <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />
              Key Takeaways
            </h2>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Don't try to learn everything—build a sustainable learning system instead</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Curated newsletters are the highest ROI learning channel (15 min/week = 100+ sources)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Follow the 70-20-10 rule: 70% depth in your stack, 20% adjacent technologies, 10% exploration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Set a weekly "learning budget" and stick to it (recommended: 2-3 hours/week)</span>
              </li>
            </ul>
          </div>

          {/* The Problem */}
          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            The Information Overload Problem
          </h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Every day, the tech world publishes:
          </p>
          <ul className="space-y-2 mb-6 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span><strong className="text-gray-100">1,000+</strong> engineering blog posts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span><strong className="text-gray-100">500+</strong> new GitHub repositories</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span><strong className="text-gray-100">200+</strong> YouTube videos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span><strong className="text-gray-100">100+</strong> podcast episodes</span>
            </li>
          </ul>
          <p className="text-gray-300 leading-relaxed mb-6">
            As a junior engineer, you're already working 8-10 hours a day writing code, attending meetings, and debugging production issues. When are you supposed to learn?
          </p>
          <p className="text-gray-300 leading-relaxed mb-8">
            The answer isn't "read more." It's <strong className="text-gray-100">read smarter</strong>.
          </p>

          {/* Learning Channels */}
          <h2 className="text-3xl font-bold text-gray-100 mb-6 mt-12">
            5 Learning Channels Every Junior Engineer Should Use
          </h2>
          <div className="space-y-8 mb-12">
            {learningChannels.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <div
                  key={channel.name}
                  className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 bg-blue-500/10 p-3 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-100 mb-1">
                        {index + 1}. {channel.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{channel.description}</p>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-4 leading-relaxed">
                    <strong className="text-gray-100">Why it works:</strong> {channel.why}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-gray-500 text-sm">Examples:</span>
                      <ul className="mt-1 space-y-1">
                        {channel.examples.map((example) => (
                          <li key={example} className="text-gray-300 text-sm">• {example}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Time Commitment:</span>
                      <p className="text-blue-400 font-semibold mt-1">{channel.timeCommitment}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* The 70-20-10 Rule */}
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">
              The 70-20-10 Learning Rule
            </h2>
            <p className="text-gray-300 mb-6">
              As a junior engineer, you have limited time. Don't waste it learning random technologies. Follow this framework:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">
                  70% - Deep Dive Your Stack
                </h3>
                <p className="text-gray-300">
                  Master the technologies you use daily at work. If you're a React developer, understand React deeply before learning Vue or Svelte. Read the official docs, source code, and advanced patterns.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">
                  20% - Adjacent Technologies
                </h3>
                <p className="text-gray-300">
                  Learn technologies that complement your stack. Frontend devs should understand backend basics. Backend devs should know frontend fundamentals. This makes you a better communicator and problem solver.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">
                  10% - Exploration & Trends
                </h3>
                <p className="text-gray-300">
                  Stay aware of emerging technologies. You don't need to learn every new framework, but you should know they exist. This is where newsletters and GitHub Trending shine.
                </p>
              </div>
            </div>
          </div>

          {/* Practical System */}
          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            My Recommended Weekly Learning System
          </h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Here's the exact system I used to go from junior to senior engineer in 3 years:
          </p>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-100 mb-4">
              Monday (15 minutes)
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Read your weekly newsletters (Tech Upkeep arrives Tuesday, perfect timing)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Bookmark 2-3 articles to read in depth</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-100 mb-4">
              Wednesday (30 minutes)
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Deep dive into 1-2 bookmarked articles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Take notes in your knowledge base (Notion, Obsidian, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Try a code example if relevant</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-100 mb-4">
              Friday (10 minutes)
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Browse GitHub Trending in your language</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Star 2-3 interesting repositories</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Read README files to understand use cases</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-100 mb-4">
              Weekend (1-2 hours - optional)
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Watch 1-2 YouTube tutorials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Build a small side project with a new technology</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Listen to a podcast episode during chores</span>
              </li>
            </ul>
          </div>

          <p className="text-gray-300 leading-relaxed mb-8">
            <strong className="text-gray-100">Total time investment:</strong> 2-3 hours per week. That's less than one Netflix episode per day.
          </p>

          {/* Common Mistakes */}
          <h2 className="text-3xl font-bold text-gray-100 mb-4 mt-12">
            5 Common Mistakes Junior Engineers Make
          </h2>

          <div className="space-y-6 mb-12">
            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                ❌ Mistake #1: Tutorial Hell
              </h3>
              <p className="text-gray-300">
                <strong>The trap:</strong> Watching endless tutorials without building anything.<br />
                <strong className="text-green-400">The fix:</strong> Watch one tutorial, then build something without following along. Apply knowledge immediately.
              </p>
            </div>

            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                ❌ Mistake #2: Learning Too Broadly
              </h3>
              <p className="text-gray-300">
                <strong>The trap:</strong> Trying to learn React, Vue, Angular, Node, Python, Go, and Rust simultaneously.<br />
                <strong className="text-green-400">The fix:</strong> Master one thing deeply before moving on. Depth beats breadth early in your career.
              </p>
            </div>

            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                ❌ Mistake #3: No Knowledge Management
              </h3>
              <p className="text-gray-300">
                <strong>The trap:</strong> Reading articles and forgetting them the next day.<br />
                <strong className="text-green-400">The fix:</strong> Build a personal knowledge base. Write summaries in your own words. Create a TIL (Today I Learned) document.
              </p>
            </div>

            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                ❌ Mistake #4: Comparing to Senior Engineers
              </h3>
              <p className="text-gray-300">
                <strong>The trap:</strong> Feeling overwhelmed because senior engineers seem to know everything.<br />
                <strong className="text-green-400">The fix:</strong> They have 10 years of consistent learning. You're not behind—you're on your own timeline. Focus on progress, not perfection.
              </p>
            </div>

            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                ❌ Mistake #5: Not Connecting with Others
              </h3>
              <p className="text-gray-300">
                <strong>The trap:</strong> Learning in isolation without discussing concepts with peers.<br />
                <strong className="text-green-400">The fix:</strong> Join engineering communities (Discord servers, local meetups). Explaining concepts to others solidifies your understanding.
              </p>
            </div>
          </div>

          {/* Conclusion */}
          <h2 className="text-3xl font-bold text-gray-100 mb-4">
            Final Thoughts
          </h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Staying updated as a junior engineer isn't about reading everything. It's about building a <strong className="text-gray-100">sustainable learning system</strong> that filters quality content to you.
          </p>
          <p className="text-gray-300 leading-relaxed mb-6">
            The engineers who grow fastest aren't the ones who hustle 12 hours a day. They're the ones who learn <strong className="text-gray-100">consistently and strategically</strong>.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Start small. Subscribe to 2-3 newsletters. Dedicate 2 hours per week to learning. In 6 months, you'll be amazed at how much you've grown.
          </p>
        </div>

        {/* CTA */}
        <BlogInlineSubscription
          source="blog"
          sourcePage="/blog/how-to-stay-updated-as-junior-software-engineer"
        />

        {/* Author */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            Written by <span className="text-gray-200 font-medium">Benjamin Loh</span>,
            curator of Tech Upkeep
          </p>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            © 2025 Tech Upkeep. Built for engineers who want to learn and grow.
          </p>
        </div>
      </footer>
    </div>
  );
}
