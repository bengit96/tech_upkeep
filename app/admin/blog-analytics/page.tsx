'use client';

import { useEffect, useState } from 'react';
import {
  Eye,
  Users,
  TrendingUp,
  Calendar,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  category: string | null;
  totalViews: number;
  uniqueVisitors: number;
  recentViews: number;
  recentUniqueVisitors: number;
  publishedAt: string;
}

interface VisitOverTime {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

interface TopReferrer {
  referrer: string;
  count: number;
}

interface AnalyticsData {
  posts: BlogPost[];
  totalStats: {
    allTimeViews: number;
    allTimeUnique: number;
    recentViews: number;
  };
  visitsOverTime: VisitOverTime[];
  topReferrers: TopReferrer[];
  period: string;
}

export default function BlogAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<number>(30);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/blog-analytics?days=${period}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-red-400">Failed to load analytics</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">
              Blog Analytics
            </h1>
            <p className="text-gray-400">
              Track visits and engagement for your blog posts
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Period Selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>

            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="h-5 w-5 text-blue-400" />
              <span className="text-gray-400 text-sm">All Time Views</span>
            </div>
            <div className="text-3xl font-bold text-gray-100">
              {data.totalStats.allTimeViews.toLocaleString()}
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-purple-400" />
              <span className="text-gray-400 text-sm">Unique Visitors</span>
            </div>
            <div className="text-3xl font-bold text-gray-100">
              {data.totalStats.allTimeUnique.toLocaleString()}
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-gray-400 text-sm">Recent Views ({data.period})</span>
            </div>
            <div className="text-3xl font-bold text-gray-100">
              {data.totalStats.recentViews.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Blog Posts Table */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-gray-100">
              Blog Posts Performance
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total Views
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Unique
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Recent ({period}d)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-100">
                        {post.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.category && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                          {post.category}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-100">
                        {post.totalViews.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-400">
                        {post.uniqueVisitors.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-green-400 font-medium">
                        {post.recentViews.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Referrers */}
        {data.topReferrers.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-gray-100">
                Top Referrers ({data.period})
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {data.topReferrers.map((referrer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-400 w-6">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-gray-300 truncate max-w-md">
                        {referrer.referrer}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-blue-400">
                      {referrer.count} visits
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
