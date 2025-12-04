'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Loader2, TrendingUp, Users, MousePointerClick, BarChart3, Mail } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getSourceBadgeColor } from '@/lib/constants/sources';

interface TopClickedItem {
  contentId: number;
  title: string;
  link: string;
  sourceType: string;
  sourceName: string;
  categoryName: string | null;
  clickCount: number;
}

interface CategoryClick {
  categoryName: string | null;
  clickCount: number;
}

interface SourceClick {
  sourceType: string;
  clickCount: number;
}

interface ClickOverTime {
  date: string;
  clickCount: number;
}

interface EmailStats {
  totalSent: number;
  totalOpened: number;
  totalClicks: number;
  uniqueClickers: number;
  openRate: string;
  clickThroughRate: string;
  clickToOpenRate: string;
}

interface AnalyticsData {
  topClicked: TopClickedItem[];
  clicksByCategory: CategoryClick[];
  clicksBySource: SourceClick[];
  totalClicks: number;
  uniqueUsers: number;
  clicksOverTime: ClickOverTime[];
  emailStats: EmailStats;
  timeRange: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('7');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Newsletter Analytics</h1>
              <p className="text-gray-600">Track click-through rates and engagement metrics</p>
            </div>
            <div className="flex gap-2">
              {['7', '30', '90'].map((days) => (
                <Button
                  key={days}
                  variant={timeRange === days ? 'default' : 'outline'}
                  onClick={() => setTimeRange(days)}
                >
                  Last {days} days
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalClicks}</div>
                <p className="text-xs text-muted-foreground">
                  Last {analytics.timeRange} days
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.uniqueUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Who clicked on links
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Clicks/User</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.uniqueUsers > 0
                    ? (analytics.totalClicks / analytics.uniqueUsers).toFixed(1)
                    : '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click-through engagement
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email Open Rate</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.emailStats.openRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.emailStats.totalOpened} of {analytics.emailStats.totalSent} opened
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.emailStats.clickThroughRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.emailStats.totalClicks} clicks from emails
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click-to-Open Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.emailStats.clickToOpenRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Of users who opened, {analytics.emailStats.uniqueClickers} clicked
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Top Clicked Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Top Clicked Articles</CardTitle>
                <CardDescription>Most popular content in your newsletters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topClicked.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No clicks yet</p>
                  ) : (
                    analytics.topClicked.slice(0, 10).map((item, index) => (
                      <div
                        key={item.contentId}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-grow min-w-0">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 mb-1"
                          >
                            {item.title}
                          </a>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className={`px-2 py-0.5 rounded ${getSourceBadgeColor(item.sourceType)}`}>
                              {item.sourceType.toUpperCase()}
                            </span>
                            <span>{item.sourceName}</span>
                            {item.categoryName && (
                              <>
                                <span>•</span>
                                <span>{item.categoryName}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-lg font-bold text-blue-600">{item.clickCount}</div>
                          <div className="text-xs text-gray-500">clicks</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Clicks by Category & Source */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Clicks by Category</CardTitle>
                  <CardDescription>Performance across content categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.clicksByCategory.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No data</p>
                    ) : (
                      analytics.clicksByCategory.map((cat) => (
                        <div key={cat.categoryName || 'uncategorized'} className="flex items-center gap-3">
                          <div className="flex-grow">
                            <div className="text-sm font-medium text-gray-900">
                              {cat.categoryName || 'Uncategorized'}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${(cat.clickCount / analytics.totalClicks) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-sm font-bold text-gray-900 w-12 text-right">
                            {cat.clickCount}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Clicks by Source</CardTitle>
                  <CardDescription>Performance across content types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.clicksBySource.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No data</p>
                    ) : (
                      analytics.clicksBySource.map((source) => (
                        <div key={source.sourceType} className="flex items-center gap-3">
                          <div className="flex-grow">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSourceBadgeColor(source.sourceType)}`}>
                                {source.sourceType.toUpperCase()}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${(source.clickCount / analytics.totalClicks) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-sm font-bold text-gray-900 w-12 text-right">
                            {source.clickCount}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Clicks Over Time */}
        {analytics.clicksOverTime.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Clicks Over Time</CardTitle>
                <CardDescription>Daily click activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.clicksOverTime.map((day) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <div className="text-sm text-gray-600 w-28">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-grow">
                        <div className="w-full bg-gray-200 rounded-full h-6">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full flex items-center justify-end pr-2"
                            style={{
                              width: `${Math.max((day.clickCount / Math.max(...analytics.clicksOverTime.map(d => d.clickCount))) * 100, 5)}%`,
                            }}
                          >
                            <span className="text-xs font-bold text-white">{day.clickCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
