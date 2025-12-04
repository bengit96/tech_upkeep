'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Loader2, TrendingUp, TrendingDown, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface SubscriberAnalytics {
  growthData: Array<{
    date: string;
    newSubscribers: number;
    unsubscribed: number;
    netGrowth: number;
  }>;
  totalSubscribers: number;
  churnRate: number;
  avgEngagementScore: number;
  riskDistribution: Array<{ riskLevel: string; count: number }>;
  engagementDistribution: Array<{ score: number; count: number }>;
  cohortData: Array<{ month: string; count: number; avgEngagement: number }>;
  topEngaged: Array<{
    email: string;
    engagementScore: number;
    lastEngagedAt: Date | null;
    createdAt: Date;
  }>;
  atRisk: Array<{
    email: string;
    engagementScore: number;
    lastEngagedAt: Date | null;
    riskLevel: string;
  }>;
  timeRange: number;
}

export default function SubscriberAnalyticsPage() {
  const [analytics, setAnalytics] = useState<SubscriberAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('30');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/subscribers?timeRange=${timeRange}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching subscriber analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    const colors: Record<string, string> = {
      active: 'text-green-600 bg-green-100',
      at_risk: 'text-yellow-600 bg-yellow-100',
      dormant: 'text-orange-600 bg-orange-100',
      churned: 'text-red-600 bg-red-100',
    };
    return colors[riskLevel] || 'text-gray-600 bg-gray-100';
  };

  const getRiskIcon = (riskLevel: string) => {
    if (riskLevel === 'active') return <CheckCircle2 className="h-4 w-4" />;
    if (riskLevel === 'at_risk' || riskLevel === 'dormant') return <AlertTriangle className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Failed to load subscriber analytics</p>
      </div>
    );
  }

  const totalGrowth = analytics.growthData.reduce((sum, day) => sum + day.netGrowth, 0);
  const avgDailyGrowth = totalGrowth / analytics.growthData.length;

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/admin/analytics" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Back to Analytics
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-100 mb-2">Subscriber Analytics</h1>
              <p className="text-gray-400">Track subscriber growth, engagement, and churn</p>
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

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{analytics.totalSubscribers}</div>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  {avgDailyGrowth >= 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-400" />
                      <span className="text-green-400">+{avgDailyGrowth.toFixed(1)}/day</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-400" />
                      <span className="text-red-400">{avgDailyGrowth.toFixed(1)}/day</span>
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Churn Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{analytics.churnRate}%</div>
                <p className="text-xs text-gray-400">Last {analytics.timeRange} days</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Avg Engagement</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{analytics.avgEngagementScore}</div>
                <p className="text-xs text-gray-400">Out of 100</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Net Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalGrowth >= 0 ? '+' : ''}{totalGrowth}</div>
                <p className="text-xs text-gray-400">Last {analytics.timeRange} days</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Growth Chart */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100">Subscriber Growth</CardTitle>
                <CardDescription className="text-gray-400">Daily new subscribers vs unsubscribes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.growthData.slice(-14).map((day) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <div className="text-sm text-gray-400 w-20">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="w-full bg-gray-700 rounded-full h-6 relative overflow-hidden">
                              <div
                                className="absolute top-0 left-0 bg-green-500 h-6 flex items-center justify-end pr-2"
                                style={{ width: `${Math.max((day.newSubscribers / Math.max(...analytics.growthData.map(d => d.newSubscribers))) * 100, 5)}%` }}
                              >
                                {day.newSubscribers > 0 && <span className="text-xs font-bold text-white">+{day.newSubscribers}</span>}
                              </div>
                            </div>
                          </div>
                          {day.unsubscribed > 0 && (
                            <div className="w-16">
                              <div className="bg-red-500 rounded-full h-6 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">-{day.unsubscribed}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`text-sm font-bold w-12 text-right ${day.netGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {day.netGrowth >= 0 ? '+' : ''}{day.netGrowth}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Risk Distribution */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100">Subscriber Health</CardTitle>
                <CardDescription className="text-gray-400">Distribution by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.riskDistribution.map((risk) => (
                    <div key={risk.riskLevel} className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getRiskColor(risk.riskLevel)}`}>
                        {getRiskIcon(risk.riskLevel)}
                        {risk.riskLevel.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="flex-grow">
                        <div className="w-full bg-gray-700 rounded-full h-6">
                          <div
                            className={`h-6 rounded-full flex items-center justify-end pr-2 ${
                              risk.riskLevel === 'active' ? 'bg-green-500' :
                              risk.riskLevel === 'at_risk' ? 'bg-yellow-500' :
                              risk.riskLevel === 'dormant' ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(risk.count / analytics.totalSubscribers) * 100}%` }}
                          >
                            <span className="text-xs font-bold text-white">{risk.count}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 w-16 text-right">
                        {((risk.count / analytics.totalSubscribers) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Top Engaged Subscribers */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100">Top Engaged Subscribers</CardTitle>
                <CardDescription className="text-gray-400">Most active readers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topEngaged.slice(0, 10).map((user, index) => (
                    <div key={user.email} className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Last active: {user.lastEngagedAt ? new Date(user.lastEngagedAt).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-lg font-bold text-green-400">{user.engagementScore}</div>
                        <div className="text-xs text-gray-500">score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* At-Risk Subscribers */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100">At-Risk Subscribers</CardTitle>
                <CardDescription className="text-gray-400">Subscribers needing attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.atRisk.slice(0, 10).map((user) => (
                    <div key={user.email} className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors">
                      <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${getRiskColor(user.riskLevel || 'at_risk')}`}>
                        {getRiskIcon(user.riskLevel || 'at_risk')}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Last active: {user.lastEngagedAt ? new Date(user.lastEngagedAt).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-lg font-bold text-orange-400">{user.engagementScore}</div>
                        <div className="text-xs text-gray-500">score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Cohort Analysis */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Cohort Analysis</CardTitle>
              <CardDescription className="text-gray-400">Subscriber engagement by signup month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.cohortData.map((cohort) => (
                  <div key={cohort.month} className="flex items-center gap-4">
                    <div className="text-sm text-gray-300 w-24 font-medium">{cohort.month}</div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="w-full bg-gray-700 rounded-full h-8">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-8 rounded-full flex items-center justify-between px-3"
                              style={{ width: `${Math.max((cohort.count / Math.max(...analytics.cohortData.map(c => c.count))) * 100, 10)}%` }}
                            >
                              <span className="text-sm font-bold text-white">{cohort.count} subscribers</span>
                              <span className="text-sm font-bold text-white">{cohort.avgEngagement} avg score</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
