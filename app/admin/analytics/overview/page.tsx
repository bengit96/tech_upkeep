'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Loader2, TrendingUp, AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface OverviewData {
  subscribers: any;
  contentIntelligence: any;
  health: any;
  newsletters: any;
}

export default function AnalyticsOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('30');

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [subscribers, contentIntelligence, health, newsletters] = await Promise.all([
        fetch(`/api/admin/analytics/subscribers?timeRange=${timeRange}`).then(r => r.json()),
        fetch(`/api/admin/analytics/content-intelligence?timeRange=${timeRange}`).then(r => r.json()),
        fetch(`/api/admin/analytics/health?timeRange=${timeRange}`).then(r => r.json()),
        fetch(`/api/admin/analytics/newsletters?limit=5`).then(r => r.json()),
      ]);

      setData({ subscribers, contentIntelligence, health, newsletters });
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="h-5 w-5 text-green-400" />;
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-400" />;
    return <AlertCircle className="h-5 w-5 text-red-400" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Failed to load analytics</p>
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
              <h1 className="text-4xl font-bold text-gray-100 mb-2">Analytics Overview</h1>
              <p className="text-gray-400">Comprehensive newsletter performance metrics</p>
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

        {/* Health Score Hero */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 mb-2">Overall Newsletter Health</p>
                  <div className="flex items-center gap-4">
                    <div className={`text-6xl font-bold ${getHealthColor(data.health.healthScore)}`}>
                      {data.health.healthScore}
                    </div>
                    <div className="text-gray-400 text-sm">
                      <div>/ 100</div>
                      {getHealthIcon(data.health.healthScore)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-right">
                  <div>
                    <p className="text-sm text-gray-400">Delivery Rate</p>
                    <p className="text-2xl font-bold text-white">{data.health.deliveryRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Open Rate</p>
                    <p className="text-2xl font-bold text-white">{data.health.openRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Click Rate</p>
                    <p className="text-2xl font-bold text-white">{data.health.clickThroughRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Bounce Rate</p>
                    <p className="text-2xl font-bold text-white">{data.health.bounceRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Subscriber Metrics */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gray-800/50 border-gray-700 h-full">
              <CardHeader>
                <CardTitle className="text-gray-100 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Subscribers
                </CardTitle>
                <CardDescription className="text-gray-400">Growth & engagement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Total Subscribers</p>
                  <p className="text-3xl font-bold text-white">{data.subscribers.totalSubscribers}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Avg Engagement Score</p>
                  <p className="text-2xl font-bold text-green-400">{data.subscribers.avgEngagementScore}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Churn Rate</p>
                  <p className="text-2xl font-bold text-orange-400">{data.subscribers.churnRate}%</p>
                </div>
                <Link href="/admin/analytics/subscribers">
                  <Button variant="outline" className="w-full bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-700">
                    View Details →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content Intelligence */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gray-800/50 border-gray-700 h-full">
              <CardHeader>
                <CardTitle className="text-gray-100 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  Content Performance
                </CardTitle>
                <CardDescription className="text-gray-400">Top sources & categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Top Sources</p>
                  {data.contentIntelligence.topSources.slice(0, 3).map((source: any, i: number) => (
                    <div key={i} className="flex justify-between items-center mb-1">
                      <p className="text-sm text-gray-300 truncate">{source.name}</p>
                      <p className="text-sm font-bold text-blue-400">{source.clicks} clicks</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm text-gray-400">Content Freshness</p>
                  <p className="text-2xl font-bold text-white">{data.contentIntelligence.contentFreshness} days</p>
                  <p className="text-xs text-gray-500">Average age when sent</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Newsletter Performance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gray-800/50 border-gray-700 h-full">
              <CardHeader>
                <CardTitle className="text-gray-100">Best Newsletter</CardTitle>
                <CardDescription className="text-gray-400">Highest engagement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.newsletters.bestPerformer && (
                  <>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Subject</p>
                      <p className="text-sm font-medium text-gray-200">{data.newsletters.bestPerformer.subject}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400">Open Rate</p>
                        <p className="text-xl font-bold text-green-400">{data.newsletters.bestPerformer.openRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Click Rate</p>
                        <p className="text-xl font-bold text-blue-400">{data.newsletters.bestPerformer.clickRate}%</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Engagement Score</p>
                      <p className="text-2xl font-bold text-purple-400">{data.newsletters.bestPerformer.engagementScore}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Detailed Analytics</CardTitle>
              <CardDescription className="text-gray-400">Explore specific metrics in depth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Link href="/admin/analytics/subscribers">
                  <Button variant="outline" className="w-full bg-blue-600/10 border-blue-600/50 text-blue-400 hover:bg-blue-600/20">
                    Subscriber Analytics
                  </Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button variant="outline" className="w-full bg-purple-600/10 border-purple-600/50 text-purple-400 hover:bg-purple-600/20">
                    Content Analytics
                  </Button>
                </Link>
                <Link href="/admin/newsletters">
                  <Button variant="outline" className="w-full bg-green-600/10 border-green-600/50 text-green-400 hover:bg-green-600/20">
                    Newsletter History
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
