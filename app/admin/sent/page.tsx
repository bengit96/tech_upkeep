'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface SentItem {
  id: number;
  title: string;
  summary: string;
  link: string;
  sourceType: string;
  sourceName: string;
  publishedAt: Date;
  sentAt: Date;
  category: string;
}

interface GroupedContent {
  [date: string]: SentItem[];
}

export default function SentContentPage() {
  const [groupedContent, setGroupedContent] = useState<GroupedContent>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSentContent();
  }, []);

  const fetchSentContent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/sent-content');
      const data = await response.json();
      setGroupedContent(data.grouped || {});
    } catch (error) {
      console.error('Error fetching sent content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceBadgeColor = (sourceType: string) => {
    const colors: Record<string, string> = {
      youtube: 'bg-red-100 text-red-800 border-red-200',
      twitter: 'bg-blue-100 text-blue-800 border-blue-200',
      article: 'bg-green-100 text-green-800 border-green-200',
      reddit: 'bg-orange-100 text-orange-800 border-orange-200',
      substack: 'bg-purple-100 text-purple-800 border-purple-200',
      podcast: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[sourceType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Sent Newsletter History</h1>
          <p className="text-sm text-gray-600">
            View all articles that have been sent in newsletters, grouped by send date
          </p>
        </motion.div>

        {Object.keys(groupedContent).length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500">No newsletters have been sent yet.</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedContent).map(([date, items], index) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="text-xl flex items-center justify-between">
                      <span>📧 {date}</span>
                      <span className="text-sm font-normal text-gray-600">
                        {items.length} article{items.length !== 1 ? 's' : ''}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-grow min-w-0">
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-base font-semibold text-gray-900 hover:text-blue-600 inline-flex items-center gap-2 mb-2"
                              >
                                {item.title}
                                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                              </a>

                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-xs border ${getSourceBadgeColor(item.sourceType)}`}>
                                  {item.sourceType.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-600">{item.sourceName}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  {item.category}
                                </span>
                              </div>

                              <p className="text-sm text-gray-700 line-clamp-2">
                                {item.summary}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
