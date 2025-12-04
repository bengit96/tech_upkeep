'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Loader2, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSources } from '@/lib/api/hooks';

interface Source {
  id: number;
  name: string;
  url?: string;
  channelId?: string;
  type: string;
  active: boolean;
}

interface Sources {
  rssFeeds: Source[];
  substackFeeds: Source[];
  podcastFeeds: Source[];
  redditSubs: Source[];
  youtubeChannels: Source[];
}

export default function SourcesPage() {
  const { data: sources, isLoading, mutate } = useSources() as { 
    data: Sources | undefined; 
    isLoading: boolean; 
    mutate: (data?: Sources | Promise<Sources>, shouldRevalidate?: boolean) => void;
  };

  const toggleSource = async (category: keyof Sources, id: number) => {
    if (!sources) return;

    const currentSource = sources[category].find(s => s.id === id);
    if (!currentSource) return;

    // Optimistic update
    const optimisticData = {
      ...sources,
      [category]: sources[category].map((source) =>
        source.id === id ? { ...source, active: !source.active } : source
      ),
    };
    mutate(optimisticData, false); // Update UI immediately without revalidation

    try {
      const response = await fetch('/api/admin/sources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentSource.active }),
      });

      if (!response.ok) {
        // Revert on error by re-fetching
        mutate();
        console.error('Failed to toggle source');
      }
    } catch (error) {
      // Revert on error by re-fetching
      mutate();
      console.error('Error toggling source:', error);
    }
  };

  const deleteSource = async (category: keyof Sources, id: number) => {
    if (!sources || !confirm('Are you sure you want to delete this source?')) return;

    try {
      const response = await fetch(`/api/admin/sources?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Optimistically update then revalidate
        mutate({
          ...sources,
          [category]: sources[category].filter((source) => source.id !== id),
        }, false);
      } else {
        console.error('Failed to delete source');
      }
    } catch (error) {
      console.error('Error deleting source:', error);
    }
  };

  const addNewSource = async (type: string) => {
    const name = prompt('Enter source name:');
    if (!name) return;

    const url = prompt('Enter source URL (RSS feed, website, etc):');
    if (!url) return;

    let metadata = null;

    // For YouTube, ask for channel ID
    if (type === 'youtube') {
      const channelId = prompt('Enter YouTube Channel ID:');
      if (channelId) {
        metadata = { channelId };
      }
    }

    // For Reddit, ask for subreddit name
    if (type === 'reddit') {
      const subreddit = prompt('Enter subreddit name (without r/):');
      if (subreddit) {
        metadata = { subreddit };
      }
    }

    try {
      const response = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, type, metadata }),
      });

      if (response.ok) {
        // Refresh sources
        mutate();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding source:', error);
      alert('Failed to add source');
    }
  };

  const SourceCard = ({ title, sources: items, category, icon, type }: { title: string; sources: Source[]; category: keyof Sources; icon: string; type: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>{icon}</span>
              {title}
            </span>
            <span className="text-sm font-normal text-gray-500">
              {items.filter(s => s.active).length} / {items.length} active
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((source) => (
              <motion.div
                key={source.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                  source.active
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex-grow">
                  <div className="font-medium text-sm">{source.name}</div>
                  {source.url && (
                    <div className="text-xs text-gray-600 truncate max-w-md">
                      {source.url}
                    </div>
                  )}
                  {source.channelId && (
                    <div className="text-xs text-gray-600">
                      Channel ID: {source.channelId}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleSource(category, source.id)}
                    className={source.active ? 'text-green-600' : 'text-gray-400'}
                  >
                    {source.active ? (
                      <ToggleRight className="h-5 w-5" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteSource(category, source.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4" size="sm" onClick={() => addNewSource(type)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New {title.slice(0, -1)}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

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
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Manage Sources</h1>
          <p className="text-sm text-gray-600">
            Enable/disable content sources and add new ones
          </p>
        </motion.div>

        {sources && (
          <div className="grid md:grid-cols-2 gap-6">
            <SourceCard
              title="Engineering Blogs"
              sources={sources.rssFeeds}
              category="rssFeeds"
              icon="📰"
              type="blog"
            />
            <SourceCard
              title="Technical Substacks"
              sources={sources.substackFeeds}
              category="substackFeeds"
              icon="📮"
              type="substack"
            />
            <SourceCard
              title="Tech Podcasts"
              sources={sources.podcastFeeds}
              category="podcastFeeds"
              icon="🎙️"
              type="podcast"
            />
            <SourceCard
              title="Reddit Communities"
              sources={sources.redditSubs}
              category="redditSubs"
              icon="🤖"
              type="reddit"
            />
            <SourceCard
              title="YouTube Channels"
              sources={sources.youtubeChannels}
              category="youtubeChannels"
              icon="🎥"
              type="youtube"
            />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <p className="font-medium text-blue-900">Note</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Sources are stored in the database and loaded dynamically during aggregation.
                    Changes take effect immediately on the next scraping run.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
