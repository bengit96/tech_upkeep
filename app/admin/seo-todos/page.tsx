import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Clock, ExternalLink, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "SEO To-Do List - Admin",
  description: "Track your SEO implementation tasks",
};

interface Task {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
  priority: "high" | "medium" | "low";
  timeEstimate: string;
  dueDate?: string;
  links?: { label: string; url: string }[];
  steps?: string[];
}

const tasks: Task[] = [
  // COMPLETED
  {
    id: "og-image",
    title: "Create OG Image",
    description: "1200x630px social sharing image",
    status: "completed",
    priority: "high",
    timeEstimate: "20 min",
    steps: [
      "Created in Canva",
      "Saved to public/og-image.png",
      "Deployed to production",
    ],
  },
  {
    id: "google-console",
    title: "Google Search Console Setup",
    description: "Verify ownership and submit sitemap",
    status: "completed",
    priority: "high",
    timeEstimate: "25 min",
    steps: [
      "Property verified",
      "Sitemap submitted",
      "Homepage indexing requested",
    ],
    links: [
      { label: "Search Console", url: "https://search.google.com/search-console" },
    ],
  },
  {
    id: "deploy",
    title: "Deploy to Production",
    description: "Push all SEO changes live",
    status: "completed",
    priority: "high",
    timeEstimate: "5 min",
  },

  // IMMEDIATE PRIORITY
  {
    id: "directories",
    title: "Submit to Newsletter Directories",
    description: "Get backlinks and visibility from 5 directories",
    status: "pending",
    priority: "high",
    timeEstimate: "15 min",
    dueDate: "This Week",
    links: [
      { label: "Indie Hackers", url: "https://indiehackers.com" },
      { label: "The Sample", url: "https://thesample.ai/publishers" },
      { label: "Newsletter Crew", url: "https://newslettercrew.com/submit" },
      { label: "r/SideProject", url: "https://reddit.com/r/SideProject" },
    ],
    steps: [
      "Use this description: 'Tech Upkeep - Bi-weekly curated tech newsletter for product engineers who ship. Learn from Netflix, Uber, and Airbnb engineering teams. Plus GitHub Trending. Free, Tuesday & Friday.'",
      "Submit to Indie Hackers (post in Show IH)",
      "Submit to The Sample",
      "Submit to Newsletter Crew",
      "Post on r/SideProject (provide value, share story)",
    ],
  },

  // THIS WEEK
  {
    id: "blog-post-2",
    title: "Write Blog Post #2",
    description: "How Product Engineers Stay Updated Without Burning Out",
    status: "pending",
    priority: "high",
    timeEstimate: "2 hours",
    dueDate: "This Week",
    steps: [
      "Target keywords: 'how to stay updated as developer' (720 searches/month)",
      "Structure: Problem → Bad solutions → Good solutions → CTA",
      "1,500+ words",
      "Include internal links to blog post #1",
      "Add to app/blog/how-product-engineers-stay-updated/page.tsx",
    ],
  },
  {
    id: "check-console",
    title: "Check Google Search Console",
    description: "Monitor indexing status daily",
    status: "in-progress",
    priority: "medium",
    timeEstimate: "5 min/day",
    dueDate: "Daily",
    links: [
      { label: "Search Console", url: "https://search.google.com/search-console" },
    ],
    steps: [
      "Go to Overview - check for impressions",
      "Check Pages section - verify pages are indexed",
      "If sitemap still shows error, resubmit it",
      "Track which keywords are getting impressions",
    ],
  },

  // NEXT WEEK
  {
    id: "product-hunt",
    title: "Launch on Product Hunt",
    description: "Get 100-500 visitors in one day",
    status: "pending",
    priority: "high",
    timeEstimate: "1 hour",
    dueDate: "Week 2",
    links: [
      { label: "Product Hunt", url: "https://producthunt.com" },
    ],
    steps: [
      "Create Product Hunt account",
      "Write compelling description",
      "Add 3-5 screenshots of newsletter/website",
      "Launch on Tuesday-Thursday (best days)",
      "Respond to ALL comments",
      "Ask friends to upvote (naturally)",
    ],
  },
  {
    id: "blog-post-3",
    title: "Write Blog Post #3",
    description: "10 Best Engineering Blogs to Follow in 2025",
    status: "pending",
    priority: "medium",
    timeEstimate: "2 hours",
    dueDate: "Week 2",
    steps: [
      "Target keywords: 'engineering blogs' (8,100 searches/month)",
      "List your 110 sources with descriptions",
      "Explain what each blog covers",
      "Why you include them in Tech Upkeep",
      "CTA: Get them curated in your inbox",
    ],
  },
  {
    id: "twitter-strategy",
    title: "Start Twitter/LinkedIn Strategy",
    description: "Share individual articles from newsletter",
    status: "pending",
    priority: "medium",
    timeEstimate: "30 min/week",
    dueDate: "Week 2",
    steps: [
      "Post 2-3 times per week",
      "Share interesting articles from your sources",
      "Format: '🔥 New from [Company]: [Insight]' + link to techupkeep.dev",
      "Engage with comments",
      "Build relationships with other tech creators",
    ],
  },

  // MONTH 1
  {
    id: "reddit-posts",
    title: "Share on Reddit",
    description: "Value-first posts in 3 subreddits",
    status: "pending",
    priority: "medium",
    timeEstimate: "1 hour",
    dueDate: "Month 1",
    steps: [
      "r/webdev - 'Built a curated tech newsletter'",
      "r/cscareerquestions - 'How I stay updated as a product engineer'",
      "r/programming - Share blog post #2 or #3",
      "IMPORTANT: Provide value first, don't spam links",
      "Engage with every comment",
    ],
  },
  {
    id: "blog-post-4",
    title: "Write Blog Post #4",
    description: "GitHub Trending Explained: Find Projects to Level Up",
    status: "pending",
    priority: "low",
    timeEstimate: "2 hours",
    dueDate: "Month 1",
    steps: [
      "Target keywords: 'GitHub trending' (14,800 searches/month)",
      "Explain how GitHub Trending works",
      "Best projects to learn from",
      "How to use GitHub Trending for learning",
      "CTA: Get GitHub Trending in newsletter",
    ],
  },

  // ONGOING
  {
    id: "content-schedule",
    title: "Maintain Content Schedule",
    description: "1 blog post per week for SEO growth",
    status: "in-progress",
    priority: "high",
    timeEstimate: "2 hours/week",
    dueDate: "Ongoing",
    steps: [
      "Write 1 blog post per week",
      "Target different keywords each time",
      "1,500+ words per post",
      "Internal linking between posts",
      "Update old posts every 3 months",
    ],
  },
  {
    id: "track-metrics",
    title: "Track SEO Metrics",
    description: "Monitor growth and adjust strategy",
    status: "in-progress",
    priority: "medium",
    timeEstimate: "15 min/week",
    dueDate: "Weekly",
    links: [
      { label: "Search Console", url: "https://search.google.com/search-console" },
      { label: "Vercel Analytics", url: "https://vercel.com/analytics" },
    ],
    steps: [
      "Google Search Console: Track clicks, impressions, CTR, position",
      "Vercel Analytics: Page views, visitors, top pages",
      "Newsletter metrics: Subscriber growth rate",
      "Identify which keywords are working",
      "Double down on what's working",
    ],
  },
];

export default function SEOTodosPage() {
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const pendingTasks = tasks.filter((t) => t.status === "pending");

  const completionRate = Math.round((completedTasks.length / tasks.length) * 100);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="text-4xl font-bold text-gray-100 mb-2">SEO To-Do List</h1>
          <p className="text-gray-400">
            Track your SEO implementation progress
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-100">Overall Progress</h2>
            <span className="text-3xl font-bold text-blue-400">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <div className="flex gap-6 mt-4 text-sm">
            <span className="text-gray-400">
              ✅ Completed: <span className="text-green-400 font-semibold">{completedTasks.length}</span>
            </span>
            <span className="text-gray-400">
              🔄 In Progress: <span className="text-yellow-400 font-semibold">{inProgressTasks.length}</span>
            </span>
            <span className="text-gray-400">
              ⏳ Pending: <span className="text-gray-300 font-semibold">{pendingTasks.length}</span>
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <h3 className="font-semibold text-green-400">Completed</h3>
            </div>
            <p className="text-2xl font-bold text-gray-100">{completedTasks.length}</p>
            <p className="text-sm text-gray-400">Great job! 🎉</p>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-400" />
              <h3 className="font-semibold text-yellow-400">High Priority</h3>
            </div>
            <p className="text-2xl font-bold text-gray-100">
              {tasks.filter((t) => t.priority === "high" && t.status === "pending").length}
            </p>
            <p className="text-sm text-gray-400">Do these ASAP</p>
          </div>

          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-blue-400">This Week</h3>
            </div>
            <p className="text-2xl font-bold text-gray-100">
              {tasks.filter((t) => t.dueDate === "This Week" && t.status === "pending").length}
            </p>
            <p className="text-sm text-gray-400">Deadlines approaching</p>
          </div>
        </div>

        {/* Task Lists */}
        <div className="space-y-8">
          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
                Completed ✅
              </h2>
              <div className="space-y-4">
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}

          {/* In Progress Tasks */}
          {inProgressTasks.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                <Clock className="h-6 w-6 text-yellow-400" />
                In Progress 🔄
              </h2>
              <div className="space-y-4">
                {inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}

          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                <Circle className="h-6 w-6 text-gray-400" />
                To Do ⏳
              </h2>
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 bg-blue-900/20 border border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">📚 Documentation</h3>
          <p className="text-gray-300 mb-4">
            For detailed guides, check these files in your project:
          </p>
          <ul className="space-y-2 text-gray-400">
            <li>• <code className="text-blue-300">QUICK_START_SEO.md</code> - Fast action guide</li>
            <li>• <code className="text-blue-300">SEO_STRATEGY.md</code> - Complete 90-day playbook</li>
            <li>• <code className="text-blue-300">GOOGLE_SEARCH_CONSOLE_SETUP.md</code> - Verification help</li>
            <li>• <code className="text-blue-300">SEO_IMPLEMENTATION_COMPLETE.md</code> - What was done</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const statusConfig = {
    completed: {
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "bg-green-900/20",
      border: "border-green-800",
    },
    "in-progress": {
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-900/20",
      border: "border-yellow-800",
    },
    pending: {
      icon: Circle,
      color: "text-gray-400",
      bg: "bg-gray-900/50",
      border: "border-gray-800",
    },
  };

  const priorityColors = {
    high: "text-red-400",
    medium: "text-yellow-400",
    low: "text-gray-400",
  };

  const config = statusConfig[task.status];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-6`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <Icon className={`h-6 w-6 ${config.color} flex-shrink-0 mt-1`} />
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-100 mb-1">{task.title}</h3>
            <p className="text-gray-400">{task.description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs font-semibold uppercase ${priorityColors[task.priority]}`}>
            {task.priority} priority
          </span>
          <span className="text-xs text-gray-500">{task.timeEstimate}</span>
          {task.dueDate && (
            <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-800">
              Due: {task.dueDate}
            </span>
          )}
        </div>
      </div>

      {task.steps && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Steps:</h4>
          <ul className="space-y-2">
            {task.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {task.links && task.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {task.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
