'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Loader2, Globe, MapPin, Users, Building, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LocationData {
  geographicDistribution: Array<{
    country: string;
    countryName: string | null;
    subscriberCount: number;
    openRate: number;
    clickRate: number;
  }>;
  topCities: Array<{
    city: string;
    country: string | null;
    subscriberCount: number;
    engagementScore: number;
  }>;
  audienceSegments: Array<{
    audience: string;
    count: number;
    percentage: number;
    avgEngagementScore: number;
  }>;
  companySizeBreakdown: Array<{
    companySize: string;
    count: number;
    percentage: number;
  }>;
}

export default function LocationAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<string>('30');

  const { data, error, isLoading } = useSWR<LocationData>(
    `/api/admin/analytics/location?timeRange=${timeRange}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading location analytics...</p>
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
              <p className="text-gray-400 mb-4">Failed to load location data</p>
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
          <Link href="/admin/analytics/comprehensive" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Back to Analytics
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-100 mb-2">Location & Audience Insights</h1>
              <p className="text-gray-400">Geographic distribution and audience demographics of your subscribers</p>
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

        {/* Geographic Distribution Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-400" />
                Geographic Distribution
              </CardTitle>
              <CardDescription className="text-gray-400">Where your subscribers are located</CardDescription>
            </CardHeader>
            <CardContent>
              {data.geographicDistribution.length > 0 ? (
                <div className="space-y-4">
                  {data.geographicDistribution.map((location, index) => (
                    <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {location.countryName || location.country}
                          </h3>
                          <p className="text-sm text-gray-400">{location.subscriberCount} subscribers</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Engagement</p>
                          <p className="text-lg font-bold text-blue-400">{location.openRate.toFixed(1)}% open</p>
                          <p className="text-sm text-green-400">{location.clickRate.toFixed(1)}% click</p>
                        </div>
                      </div>

                      {/* Progress bar showing subscriber distribution */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (location.subscriberCount / data.geographicDistribution[0].subscriberCount) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">No location data available yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Cities Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-400" />
                Top Cities
              </CardTitle>
              <CardDescription className="text-gray-400">Cities with the most engaged subscribers</CardDescription>
            </CardHeader>
            <CardContent>
              {data.topCities.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {data.topCities.slice(0, 10).map((city, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-semibold text-white">{city.city}</h4>
                        <p className="text-sm text-gray-400">{city.country || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{city.subscriberCount} subscribers</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Engagement</p>
                        <p className="text-2xl font-bold text-purple-400">{city.engagementScore}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">No city data available yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Audience Segments & Company Size */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Audience Segments */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-400" />
                  Audience Segments
                </CardTitle>
                <CardDescription className="text-gray-400">Breakdown by subscriber role</CardDescription>
              </CardHeader>
              <CardContent>
                {data.audienceSegments.length > 0 ? (
                  <div className="space-y-4">
                    {data.audienceSegments.map((segment, index) => (
                      <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-white capitalize">{segment.audience}</h4>
                          <span className="text-sm font-bold text-green-400">{segment.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                          <span>{segment.count} subscribers</span>
                          <span>Avg engagement: {segment.avgEngagementScore}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${segment.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-8">No audience data available yet</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Company Size */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100 flex items-center gap-2">
                  <Building className="h-5 w-5 text-orange-400" />
                  Company Size
                </CardTitle>
                <CardDescription className="text-gray-400">Distribution by organization size</CardDescription>
              </CardHeader>
              <CardContent>
                {data.companySizeBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {data.companySizeBreakdown.map((size, index) => (
                      <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-white capitalize">{size.companySize}</h4>
                          <span className="text-sm font-bold text-orange-400">{size.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="text-sm text-gray-400 mb-2">{size.count} subscribers</div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${size.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-8">No company size data available yet</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
