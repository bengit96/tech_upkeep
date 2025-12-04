"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Download,
  Mail,
  BarChart3,
  Users,
  FileText,
  Loader2,
  Eye,
  Settings as SettingsIcon,
  History,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckSquare,
  Share2,
  Video,
  Send,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Logo from "@/components/layout/Logo";
import {
  type Stats,
  type Settings,
  type User,
  type NewsletterDraft,
  type NewsletterLogsData,
} from "@/lib/types/admin";
import { SendNewsletterDialog } from "./components/SendNewsletterDialog";

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminPage() {
  // SWR hooks for data fetching
  const { data: stats, error: statsError, isLoading: statsLoading, mutate: mutateStats } = useSWR<Stats>("/api/admin/stats", fetcher);
  const { data: settings, error: settingsError, isLoading: settingsLoading, mutate: mutateSettings } = useSWR<Settings>("/api/admin/settings", fetcher);
  const { data: newsletterLogs, error: logsError, isLoading: logsLoading, mutate: mutateLogs } = useSWR<NewsletterLogsData>("/api/admin/newsletter-logs", fetcher);

  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isRegeneratingReddit, setIsRegeneratingReddit] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<string>("");
  const [emailResult, setEmailResult] = useState<string>("");
  const [redditResult, setRedditResult] = useState<string>("");
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<number | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [availableDrafts, setAvailableDrafts] = useState<NewsletterDraft[]>([]);

  const toggleCron = async () => {
    if (!settings) return;

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cronEnabled: !settings.cronEnabled }),
      });

      if (response.ok) {
        // Revalidate settings data with SWR
        mutateSettings();
      }
    } catch (error) {
      console.error("Error toggling cron:", error);
    }
  };

  const handleScrape = async () => {
    setIsScrapingLoading(true);
    setScrapeResult("");

    try {
      const response = await fetch("/api/admin/scrape", { method: "POST" });
      const data = await response.json();

      if (response.ok) {
        setScrapeResult(`✅ ${data.message}`);
        // Revalidate stats with SWR
        mutateStats();
      } else {
        setScrapeResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setScrapeResult(
        `❌ Failed to scrape content: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsScrapingLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleOpenSendDialog = async () => {
    setShowSendDialog(true);
    setEmailResult("");
    setSelectedDraftId(null);

    // Fetch all users
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (response.ok) {
        setAllUsers(data.users);
        // Pre-select active users
        const activeUserIds = data.users
          .filter((u: User) => u.isActive)
          .map((u: User) => u.id);
        setSelectedUserIds(activeUserIds);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setEmailResult(`❌ Failed to fetch users: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // Fetch available newsletter drafts
    try {
      const response = await fetch("/api/admin/newsletters");
      const data = await response.json();
      if (response.ok) {
        setAvailableDrafts(data.newsletters || []);
        // Auto-select the most recent finalized draft if available
        const finalizedDrafts = (data.newsletters || []).filter((d: NewsletterDraft) => d.status === "finalized");
        if (finalizedDrafts.length > 0) {
          setSelectedDraftId(finalizedDrafts[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching newsletter drafts:", error);
      setEmailResult(`❌ Failed to fetch newsletter drafts: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === allUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(allUsers.map(u => u.id));
    }
  };

  const handleSelectActiveOnly = () => {
    const activeUserIds = allUsers
      .filter(u => u.isActive)
      .map(u => u.id);
    setSelectedUserIds(activeUserIds);
  };

  const handleSendNewsletter = async () => {
    if (selectedUserIds.length === 0) {
      setEmailResult("❌ Please select at least one user");
      return;
    }

    if (!selectedDraftId) {
      setEmailResult("❌ Please select a newsletter to send");
      return;
    }

    setIsEmailLoading(true);
    setEmailResult("");

    try {
      const response = await fetch("/api/admin/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedUserIds,
          draftId: selectedDraftId
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setEmailResult(`✅ ${data.message}`);
        // Revalidate stats and logs with SWR
        mutateStats();
        mutateLogs();
        // Close dialog after successful send
        setTimeout(() => setShowSendDialog(false), 2000);
      } else {
        setEmailResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setEmailResult(
        `❌ Failed to send newsletters: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleRegenerateReddit = async () => {
    setIsRegeneratingReddit(true);
    setRedditResult("");

    try {
      const response = await fetch("/api/admin/sources/regenerate-reddit", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        setRedditResult(`✅ ${data.message}`);
      } else {
        setRedditResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setRedditResult(
        `❌ Failed to regenerate Reddit sources: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsRegeneratingReddit(false);
    }
  };

  // Loading state for initial data fetch
  if (statsLoading || settingsLoading || logsLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (statsError || settingsError || logsError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
        <Card className="bg-gray-800/50 border-red-700 max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Error Loading Dashboard</h3>
              <p className="text-gray-400 mb-4">
                {statsError?.message || settingsError?.message || logsError?.message || "Failed to load data"}
              </p>
              <Button
                onClick={() => {
                  mutateStats();
                  mutateSettings();
                  mutateLogs();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8 relative overflow-hidden">
      {/* Animated Tech Grid Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/10 via-gray-900 to-purple-950/10"></div>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      ></div>

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Logo size="md" variant="default" showIcon={true} />
                <h1 className="text-4xl font-bold font-[family-name:var(--font-jetbrains)] text-gray-200">
                  Admin
                </h1>
              </div>
              <p className="text-gray-400">
                Manage content aggregation and newsletter distribution
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/seo-todos">
                <Button
                  variant="outline"
                  className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700 text-blue-300 hover:from-blue-800/50 hover:to-purple-800/50 hover:text-blue-200 animate-pulse"
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  SEO To-Do
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Navigation Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Newsletter Management */}
            <Link href="/admin/newsletters" className="group">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 hover:border-gray-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <Mail className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-200">Newsletters</h3>
                </div>
                <p className="text-sm text-gray-400">Create & manage</p>
              </div>
            </Link>

            {/* Custom Emails */}
            <Link href="/admin/custom-emails" className="group">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 hover:border-gray-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                    <Send className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-gray-200">Custom Emails</h3>
                </div>
                <p className="text-sm text-gray-400">Draft & send</p>
              </div>
            </Link>

            {/* Analytics */}
            <Link href="/admin/analytics/comprehensive" className="group">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 hover:border-gray-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-200">Analytics</h3>
                </div>
                <p className="text-sm text-gray-400">View insights</p>
              </div>
            </Link>

            {/* Sent History */}
            <Link href="/admin/sent" className="group">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 hover:border-gray-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gray-500/10 rounded-lg group-hover:bg-gray-500/20 transition-colors">
                    <History className="h-5 w-5 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-200">Sent History</h3>
                </div>
                <p className="text-sm text-gray-400">Past newsletters</p>
              </div>
            </Link>

            {/* Sources */}
            <Link href="/admin/sources" className="group">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 hover:border-gray-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gray-500/10 rounded-lg group-hover:bg-gray-500/20 transition-colors">
                    <SettingsIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-200">Sources</h3>
                </div>
                <p className="text-sm text-gray-400">Manage feeds</p>
              </div>
            </Link>

            {/* Content Tools Section */}
            <Link href="/admin/slides" className="group">
              <div className="bg-gradient-to-br from-pink-900/30 to-orange-900/30 border border-pink-700/50 rounded-lg p-4 hover:from-pink-900/40 hover:to-orange-900/40 hover:border-pink-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-pink-500/20 rounded-lg group-hover:bg-pink-500/30 transition-colors">
                    <ImageIcon className="h-5 w-5 text-pink-300" />
                  </div>
                  <h3 className="font-semibold text-pink-200">TikTok Slides</h3>
                </div>
                <p className="text-sm text-pink-300/70">Generate slides</p>
              </div>
            </Link>

            <Link href="/admin/videos" className="group">
              <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-700/50 rounded-lg p-4 hover:from-blue-900/40 hover:to-cyan-900/40 hover:border-blue-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <Video className="h-5 w-5 text-blue-300" />
                  </div>
                  <h3 className="font-semibold text-blue-200">Videos</h3>
                </div>
                <p className="text-sm text-blue-300/70">Generate videos</p>
              </div>
            </Link>

            <Link href="/admin/social-media" className="group">
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-lg p-4 hover:from-purple-900/40 hover:to-pink-900/40 hover:border-purple-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <Share2 className="h-5 w-5 text-purple-300" />
                  </div>
                  <h3 className="font-semibold text-purple-200">Social Media</h3>
                </div>
                <p className="text-sm text-purple-300/70">Posts & content</p>
              </div>
            </Link>

            {/* Outreach */}
            <Link href="/admin/outreach" className="group">
              <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border border-green-700/50 rounded-lg p-4 hover:from-green-900/40 hover:to-blue-900/40 hover:border-green-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                    <Users className="h-5 w-5 text-green-300" />
                  </div>
                  <h3 className="font-semibold text-green-200">Outreach</h3>
                </div>
                <p className="text-sm text-green-300/70">Grow audience</p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Health Score Hero */}
        {stats?.health && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 mb-6 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 mb-2 text-sm">Newsletter Health Score</p>
                    <div className="flex items-center gap-4">
                      <div className={`text-5xl font-bold ${
                        stats.health.score >= 80 ? 'text-green-400' :
                        stats.health.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {stats.health.score}
                      </div>
                      <div className="text-gray-400 text-xs">
                        <div>/ 100</div>
                        <div className="mt-1">
                          {stats.health.score >= 80 ? '✓ Excellent' :
                           stats.health.score >= 60 ? '⚠ Good' : '⚠ Needs Attention'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <p className="text-xs text-gray-400">Delivery</p>
                      <p className="text-xl font-bold text-white">{stats.health.deliveryRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">CTR</p>
                      <p className="text-xl font-bold text-white">{stats.health.clickThroughRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Engagement</p>
                      <p className="text-xl font-bold text-green-400">{stats.engagement.avgScore}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Bounce</p>
                      <p className="text-xl font-bold text-white">{stats.health.bounceRate.toFixed(1)}%</p>
                    </div>
                  </div>
                  <Link href="/admin/analytics/comprehensive">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Analytics
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats?.users.total || 0}
                </div>
                <p className="text-xs text-gray-400">
                  {stats?.users.active || 0} active
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">
                  Content Items
                </CardTitle>
                <FileText className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats?.content.total || 0}
                </div>
                <p className="text-xs text-gray-400">
                  +{stats?.content.last24Hours || 0} in last 24h
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">
                  Newsletters Sent
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats?.newsletters.total || 0}
                </div>
                <p className="text-xs text-gray-400">
                  +{stats?.newsletters.last24Hours || 0} in last 24h
                </p>
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-xs font-medium text-gray-300">
                    Open Rate:{" "}
                    <span className="text-green-400 font-bold">
                      {stats?.newsletters.openRate || "0.00%"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {stats?.newsletters.opened || 0} opened
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Manual Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Newsletter Management Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <Mail className="h-5 w-5" />
                  Newsletter Management
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Create, build, and send newsletters to subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/newsletters/create">
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white mb-4"
                    size="lg"
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Create New Newsletter
                  </Button>
                </Link>

                <Button
                  onClick={handleOpenSendDialog}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white mb-4"
                  size="lg"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Send Newsletter Now
                </Button>
                {emailResult && (
                  <div
                    className={`mb-4 p-3 rounded-md text-sm ${
                      emailResult.startsWith("✅")
                        ? "bg-green-950/30 border border-green-700 text-green-300"
                        : "bg-red-950/30 border border-red-700 text-red-300"
                    }`}
                  >
                    {emailResult}
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-400">
                  <p className="font-semibold mb-2 text-gray-300">
                    Create New Newsletter:
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Auto-scrapes latest content from all sources</li>
                    <li>Shows only unassigned articles (not in other newsletters)</li>
                    <li>Accept/reject articles in one page</li>
                    <li>Fill in newsletter name & subject</li>
                    <li>Save to create newsletter + tag articles</li>
                  </ol>
                  <p className="mt-3 text-gray-500 italic">
                    ✨ Everything happens in one smooth flow!
                  </p>
                </div>

                <div className="mt-4 p-3 bg-blue-950/30 border border-blue-700 rounded-md">
                  <p className="text-xs text-blue-300 font-semibold mb-1">
                    📧 Send Newsletter Now:
                  </p>
                  <p className="text-xs text-blue-300">
                    Sends all accepted content to active subscribers. Use this for manual sending or when automated sending fails.
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link href="/admin/newsletters" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View All
                    </Button>
                  </Link>

                  <Link href="/admin/curate" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full bg-purple-700/50 border-purple-600 text-purple-200 hover:bg-purple-700 hover:text-white"
                      title="Old workflow - use Create New instead"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Legacy
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Regenerate Reddit Sources Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <RefreshCw className="h-5 w-5" />
                  Regenerate Reddit Sources
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Reset Reddit sources to default configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleRegenerateReddit}
                  disabled={isRegeneratingReddit}
                  className="w-full bg-orange-600 hover:bg-orange-500"
                  size="lg"
                >
                  {isRegeneratingReddit && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isRegeneratingReddit
                    ? "Regenerating..."
                    : "Regenerate Reddit"}
                </Button>
                {redditResult && (
                  <div
                    className={`mt-4 p-3 rounded-md text-sm ${
                      redditResult.startsWith("✅")
                        ? "bg-green-950/30 border border-green-700 text-green-300"
                        : "bg-red-950/30 border border-red-700 text-red-300"
                    }`}
                  >
                    {redditResult}
                  </div>
                )}
                <div className="mt-4 text-xs text-gray-400">
                  <p className="font-semibold mb-2 text-gray-300">
                    This will regenerate:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>r/programming</li>
                    <li>r/webdev</li>
                    <li>r/MachineLearning</li>
                    <li>r/devops</li>
                  </ul>
                  <p className="mt-2 text-gray-500">
                    Use this if Reddit sources are misconfigured or have issues.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="mt-8 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-gray-100">
                    Automated Schedule
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    These actions are automatically triggered on a schedule in
                    production
                  </CardDescription>
                </div>
                <Button
                  onClick={toggleCron}
                  variant={settings?.cronEnabled ? "default" : "outline"}
                  className={
                    settings?.cronEnabled
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-700"
                  }
                >
                  {settings?.cronEnabled ? "✓ Enabled" : "Disabled"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Download
                      className={`h-4 w-4 ${settings?.cronEnabled ? "text-green-400" : "text-gray-500"}`}
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-gray-200">
                      Content Scraping
                    </p>
                    <p className="text-sm text-gray-400">
                      Scheduled daily at 6:00 AM{" "}
                      {!settings?.cronEnabled && "(Currently disabled)"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Mail
                      className={`h-4 w-4 ${settings?.cronEnabled ? "text-green-400" : "text-gray-500"}`}
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-gray-200">
                      Newsletter Sending
                    </p>
                    <p className="text-sm text-gray-400">
                      Scheduled daily at 8:00 AM{" "}
                      {!settings?.cronEnabled && "(Currently disabled)"}
                    </p>
                  </div>
                </div>
              </div>
              {settings?.cronEnabled && (
                <div className="mt-4 p-3 bg-green-950/30 border border-green-700 rounded-md">
                  <p className="text-sm text-green-300">
                    ✓ Automated tasks are currently <strong>enabled</strong>.
                    They will run according to the schedule above.
                  </p>
                </div>
              )}
              {!settings?.cronEnabled && (
                <div className="mt-4 p-3 bg-yellow-950/30 border border-yellow-700 rounded-md">
                  <p className="text-sm text-yellow-300">
                    ⚠️ Automated tasks are currently <strong>disabled</strong>.
                    You can still trigger actions manually above.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Newsletter Send Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="mt-8 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-gray-100 flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Newsletter Send Logs
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Recent newsletter batches and their delivery status
                  </CardDescription>
                </div>
                <Button
                  onClick={() => mutateLogs()}
                  variant="outline"
                  size="sm"
                  className="bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {newsletterLogs &&
              newsletterLogs.batches &&
              newsletterLogs.batches.length > 0 ? (
                <div className="space-y-3">
                  {newsletterLogs.batches.map((batch, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-100">
                            {new Date(batch.sentAt).toLocaleString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {batch.articleCount} articles included
                          </p>
                        </div>
                        <div className="flex gap-3 text-sm">
                          <div className="text-right">
                            <p className="text-green-400 font-bold">
                              {batch.successCount}
                            </p>
                            <p className="text-xs text-gray-400">sent</p>
                          </div>
                          {batch.failureCount > 0 && (
                            <div className="text-right">
                              <p className="text-red-400 font-bold">
                                {batch.failureCount}
                              </p>
                              <p className="text-xs text-gray-400">failed</p>
                            </div>
                          )}
                          <div className="text-right">
                            <p className="text-blue-400 font-bold">
                              {batch.recipientCount}
                            </p>
                            <p className="text-xs text-gray-400">total</p>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${(batch.successCount / batch.recipientCount) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <p className="text-gray-400">
                          Success Rate:{" "}
                          <span className="text-green-400 font-semibold">
                            {(
                              (batch.successCount / batch.recipientCount) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </p>
                        {batch.failureCount > 0 && (
                          <p className="text-red-300">
                            {batch.failureCount} email
                            {batch.failureCount > 1 ? "s" : ""} failed
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No newsletters sent yet</p>
                  <p className="text-sm mt-1">
                    Send your first newsletter to see logs here
                  </p>
                </div>
              )}

              {newsletterLogs &&
                newsletterLogs.batches &&
                newsletterLogs.batches.length > 10 && (
                  <div className="mt-4 text-center">
                    <Link href="/admin/sent">
                      <Button
                        variant="outline"
                        className="bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-700"
                      >
                        <History className="mr-2 h-4 w-4" />
                        View All ({newsletterLogs.batches.length} total)
                      </Button>
                    </Link>
                  </div>
                )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Send Newsletter Dialog */}
      <SendNewsletterDialog
        showSendDialog={showSendDialog}
        onOpenChange={setShowSendDialog}
        availableDrafts={availableDrafts}
        selectedDraftId={selectedDraftId}
        onSelectedDraftIdChange={setSelectedDraftId}
        allUsers={allUsers}
        selectedUserIds={selectedUserIds}
        onToggleUser={handleToggleUser}
        onSelectAll={handleSelectAll}
        onSelectActiveOnly={handleSelectActiveOnly}
        emailResult={emailResult}
        isEmailLoading={isEmailLoading}
        onSendNewsletter={handleSendNewsletter}
      />
    </div>
  );
}
