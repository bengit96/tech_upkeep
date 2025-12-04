/**
 * API Hooks
 * Custom React hooks for data fetching with SWR
 */

'use client';

import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import type { SWRConfiguration } from 'swr';
import { api } from './client';

// ============================================
// Generic fetcher
// ============================================

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ============================================
// Content Hooks
// ============================================

/**
 * Fetch pending content
 */
export function usePendingContent(batchId?: number, config?: SWRConfiguration) {
  const params = batchId ? `?batchId=${batchId}` : '';
  return useSWR(
    `/api/admin/content/pending${params}`,
    fetcher,
    config
  );
}

/**
 * Fetch all content
 */
export function useContent(config?: SWRConfiguration) {
  return useSWR(
    '/api/admin/content',
    fetcher,
    config
  );
}

/**
 * Fetch sent content
 */
export function useSentContent(config?: SWRConfiguration) {
  return useSWR(
    '/api/admin/sent-content',
    fetcher,
    config
  );
}

// ============================================
// Newsletter Hooks
// ============================================

/**
 * Fetch all newsletter drafts
 */
export function useNewsletters(config?: SWRConfiguration) {
  return useSWR(
    '/api/admin/newsletters',
    fetcher,
    config
  );
}

/**
 * Fetch single newsletter draft
 */
export function useNewsletter(id: number | null, config?: SWRConfiguration) {
  return useSWR(
    id ? `/api/admin/newsletters/${id}` : null,
    fetcher,
    config
  );
}

/**
 * Fetch newsletter logs
 */
export function useNewsletterLogs(config?: SWRConfiguration) {
  return useSWR(
    '/api/admin/newsletter-logs',
    fetcher,
    config
  );
}

// ============================================
// Admin Hooks
// ============================================

/**
 * Fetch admin stats
 */
export function useAdminStats(config?: SWRConfiguration) {
  return useSWR(
    '/api/admin/stats',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      ...config,
    }
  );
}

/**
 * Fetch scrape batches
 */
export function useScrapeBatches(config?: SWRConfiguration) {
  return useSWR(
    '/api/admin/batches',
    fetcher,
    config
  );
}

/**
 * Fetch admin settings
 */
export function useAdminSettings(config?: SWRConfiguration) {
  return useSWR(
    '/api/admin/settings',
    fetcher,
    config
  );
}

/**
 * Fetch sources
 */
export function useSources(config?: SWRConfiguration) {
  return useSWR(
    '/api/admin/sources',
    fetcher,
    config
  );
}

// ============================================
// Analytics Hooks
// ============================================

/**
 * Fetch analytics overview
 */
export function useAnalyticsOverview(timeRange: string = '30', config?: SWRConfiguration) {
  return useSWR(
    `/api/admin/analytics?timeRange=${timeRange}`,
    fetcher,
    config
  );
}

/**
 * Fetch subscriber analytics
 */
export function useSubscriberAnalytics(timeRange: string = '30', config?: SWRConfiguration) {
  return useSWR(
    `/api/admin/analytics/subscribers?timeRange=${timeRange}`,
    fetcher,
    config
  );
}

/**
 * Fetch content performance
 */
export function useContentPerformance(
  timeRange: string = '30',
  limit: number = 10,
  config?: SWRConfiguration
) {
  return useSWR(
    `/api/admin/analytics/comprehensive?timeRange=${timeRange}&limit=${limit}`,
    fetcher,
    config
  );
}

/**
 * Fetch newsletter performance
 */
export function useNewsletterPerformance(timeRange: string = '30', config?: SWRConfiguration) {
  return useSWR(
    `/api/admin/analytics/newsletters?timeRange=${timeRange}`,
    fetcher,
    config
  );
}

/**
 * Fetch location data
 */
export function useLocationData(config?: SWRConfiguration) {
  return useSWR(
    '/api/admin/analytics/location',
    fetcher,
    config
  );
}

/**
 * Fetch health metrics
 */
export function useHealthMetrics(config?: SWRConfiguration) {
  return useSWR(
    '/api/admin/analytics/health',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      ...config,
    }
  );
}

// ============================================
// Public Hooks
// ============================================

/**
 * Fetch recent public content
 */
export function useRecentContent(config?: SWRConfiguration) {
  return useSWR(
    '/api/public/recent-content',
    fetcher,
    {
      revalidateOnFocus: false,
      ...config,
    }
  );
}

// ============================================
// Mutation Hooks
// ============================================

// Mutation function helper
async function mutationFetcher(url: string, { arg }: { arg: any }) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

/**
 * Fetch unassigned content
 */
export function useUnassignedContent() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/admin/content?unassigned=true",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    items: data?.items || [],
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to accept content
 */
export function useAcceptContent() {
  return useSWRMutation("/api/admin/content/accept", mutationFetcher);
}

/**
 * Hook to reject/discard content
 */
export function useRejectContent() {
  return useSWRMutation("/api/admin/content/discard", mutationFetcher);
}

/**
 * Hook to move content to pending
 */
export function useMoveToPending() {
  return useSWRMutation("/api/admin/content/pending", mutationFetcher);
}

/**
 * Hook to save content for future
 */
export function useSaveForFuture() {
  return useSWRMutation("/api/admin/content/save-for-next", mutationFetcher);
}

/**
 * Hook to change category
 */
export function useChangeCategory() {
  return useSWRMutation("/api/admin/content/category", mutationFetcher);
}

/**
 * Hook to update summary
 */
export function useUpdateSummary() {
  return useSWRMutation("/api/admin/content/update", mutationFetcher);
}

/**
 * Hook to update source name
 */
export function useUpdateSourceName() {
  return useSWRMutation("/api/admin/content/update-source", mutationFetcher);
}

/**
 * Hook to generate description
 */
export function useGenerateDescription() {
  return useSWRMutation(
    "/api/admin/content/generate-description",
    mutationFetcher
  );
}

/**
 * Hook to trigger scraping
 */
export function useScrapeContent() {
  return useSWRMutation("/api/admin/scrape", async (url: string) => {
    const response = await fetch(url, { method: "POST" });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Scraping failed");
    }

    return response.json();
  });
}

/**
 * Hook to create newsletter
 */
export function useCreateNewsletter() {
  return useSWRMutation("/api/admin/newsletters/create", mutationFetcher);
}

/**
 * Hook to bulk tag content to newsletter
 */
export function useBulkTagContent() {
  return useSWRMutation("/api/admin/content/bulk-tag", mutationFetcher);
}
