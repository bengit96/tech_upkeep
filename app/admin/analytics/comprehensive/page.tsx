'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Loader2, Users, FileText, TrendingUp, BarChart3, AlertCircle, Globe } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ComprehensiveData {
  userEngagement: {
    totalSubscribers: number;
    usersWhoOpened: number;
    usersWhoClicked: number;
    openPercentage: number;
    clickPercentage: number;
  };
  articleEngagement: {
    totalArticlesSent: number;
    uniqueArticlesClicked: number;
    totalClicks: number;
    clickedPercentage: number;
    avgClicksPerArticle: number;
  };
  categoryPerformance: Array<{
    category: string;
    articlesSent: number;
    uniqueArticlesClicked: number;
    totalClicks: number;
    clickRate: number;
  }>;
  newsletterMetrics: {
    totalNewslettersSent: number;
    avgOpenRate: number;
    avgClickRate: number;
  };
}

export default function ComprehensiveAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<string>('30');

  const { data, error, isLoading } = useSWR<ComprehensiveData>(
    `/api/admin/analytics/comprehensive?timeRange=${timeRange}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
        <Card className="bg-gray-800/50 border-red-700 max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Error Loading Analytics</h3>
              <p className="text-gray-400 mb-4">Failed to load data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/admin" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-100 mb-2">Newsletter Analytics</h1>
              <p className="text-gray-400">Meaningful insights about your newsletter performance</p>
              <Link
                href="/admin/analytics/location"
                className="mt-2 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <Globe className="h-4 w-4" />
                View Location & Audience Analytics
              </Link>
            </div>
            <div className="flex gap-2">
              {['7', '30', '90'].map((days) => (
                <Button
                  key={days}
                  variant={timeRange === days ? 'default' : 'outline'}
                  onClick={() => setTimeRange(days)}
                  className={timeRange === days ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}
                >
                  Last {days} days
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* User Engagement Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                User Engagement
              </CardTitle>
              <CardDescription className="text-gray-400">How many of your subscribers are engaging with newsletters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Total Subscribers</p>
                  <p className="text-4xl font-bold text-white mb-1">{data.userEngagement.totalSubscribers}</p>
                  <p className="text-xs text-gray-500">Active users</p>
                </div>

                <div className="text-center p-6 bg-green-950/20 rounded-lg border border-green-700/50">
                  <p className="text-sm text-gray-400 mb-2">Users Who Opened</p>
                  <p className="text-4xl font-bold text-green-400 mb-1">{data.userEngagement.usersWhoOpened}</p>
                  <p className="text-lg font-semibold text-green-300">
                    {data.userEngagement.openPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">of all subscribers</p>
                </div>

                <div className="text-center p-6 bg-blue-950/20 rounded-lg border border-blue-700/50">
                  <p className="text-sm text-gray-400 mb-2">Users Who Clicked</p>
                  <p className="text-4xl font-bold text-blue-400 mb-1">{data.userEngagement.usersWhoClicked}</p>
                  <p className="text-lg font-semibold text-blue-300">
                    {data.userEngagement.clickPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">of all subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Article Engagement Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                Article Engagement
              </CardTitle>
              <CardDescription className="text-gray-400">How many articles are being clicked from your newsletters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Articles Sent</p>
                  <p className="text-4xl font-bold text-white mb-1">{data.articleEngagement.totalArticlesSent}</p>
                  <p className="text-xs text-gray-500">Total articles</p>
                </div>

                <div className="text-center p-6 bg-purple-950/20 rounded-lg border border-purple-700/50">
                  <p className="text-sm text-gray-400 mb-2">Articles Clicked</p>
                  <p className="text-4xl font-bold text-purple-400 mb-1">{data.articleEngagement.uniqueArticlesClicked}</p>
                  <p className="text-lg font-semibold text-purple-300">
                    {data.articleEngagement.clickedPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">of all articles</p>
                </div>

                <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Total Clicks</p>
                  <p className="text-4xl font-bold text-white mb-1">{data.articleEngagement.totalClicks}</p>
                  <p className="text-xs text-gray-500">All clicks</p>
                </div>

                <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Avg Clicks/Article</p>
                  <p className="text-4xl font-bold text-white mb-1">{data.articleEngagement.avgClicksPerArticle.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">Per article sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Performance Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-400" />
                Category Performance
              </CardTitle>
              <CardDescription className="text-gray-400">Which categories your users find most interesting</CardDescription>
            </CardHeader>
            <CardContent>
              {data.categoryPerformance.length > 0 ? (
                <div className="space-y-4">
                  {data.categoryPerformance.map((category, index) => (
                    <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-white">{category.category}</h3>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                          category.clickRate >= 50 ? 'bg-green-900/50 text-green-400 border border-green-700' :
                          category.clickRate >= 25 ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700' :
                          'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                          {category.clickRate.toFixed(1)}% clicked
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Articles Sent</p>
                          <p className="text-xl font-bold text-white">{category.articlesSent}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Clicked</p>
                          <p className="text-xl font-bold text-purple-400">{category.uniqueArticlesClicked}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Total Clicks</p>
                          <p className="text-xl font-bold text-blue-400">{category.totalClicks}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Avg Clicks</p>
                          <p className="text-xl font-bold text-white">
                            {category.articlesSent > 0 ? (category.totalClicks / category.articlesSent).toFixed(1) : '0'}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              category.clickRate >= 50 ? 'bg-green-500' :
                              category.clickRate >= 25 ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: `${Math.min(100, category.clickRate)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">No category data available</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Newsletter Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Newsletter Summary
              </CardTitle>
              <CardDescription className="text-gray-400">Overall newsletter performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Newsletters Sent</p>
                  <p className="text-4xl font-bold text-white">{data.newsletterMetrics.totalNewslettersSent}</p>
                </div>

                <div className="text-center p-6 bg-green-950/20 rounded-lg border border-green-700/50">
                  <p className="text-sm text-gray-400 mb-2">Avg Open Rate</p>
                  <p className="text-4xl font-bold text-green-400">{data.newsletterMetrics.avgOpenRate.toFixed(1)}%</p>
                </div>

                <div className="text-center p-6 bg-blue-950/20 rounded-lg border border-blue-700/50">
                  <p className="text-sm text-gray-400 mb-2">Avg Click Rate</p>
                  <p className="text-4xl font-bold text-blue-400">{data.newsletterMetrics.avgClickRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
