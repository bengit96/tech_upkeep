/**
 * Typed API Client
 * Centralized API request functions with proper typing
 */

import type {
  ApiResponse,
  ContentWithRelations,
  ContentUpdatePayload,
  NewsletterDraftWithStats,
  CreateNewsletterPayload,
  ScrapeResult,
  AnalyticsOverview,
  ContentPerformance,
  CategoryPerformance,
  SubscriberGrowth,
  NewsletterPerformance,
  LocationData,
} from '@/lib/types';

// ============================================
// Base API Request Function
// ============================================

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// ============================================
// Content API
// ============================================

export const contentAPI = {
  /**
   * Get pending content items
   */
  getPending: async (batchId?: number) => {
    const params = batchId ? `?batchId=${batchId}` : '';
    return apiRequest<{ items: ContentWithRelations[] }>(
      `/api/admin/content/pending${params}`
    );
  },

  /**
   * Accept a content item
   */
  accept: async (contentId: number) => {
    return apiRequest<{ success: boolean }>(
      '/api/admin/content/accept',
      {
        method: 'POST',
        body: JSON.stringify({ contentId }),
      }
    );
  },

  /**
   * Discard a content item
   */
  discard: async (contentId: number) => {
    return apiRequest<{ success: boolean }>(
      '/api/admin/content/discard',
      {
        method: 'POST',
        body: JSON.stringify({ contentId }),
      }
    );
  },

  /**
   * Update content item
   */
  update: async (contentId: number, updates: ContentUpdatePayload) => {
    return apiRequest<{ content: ContentWithRelations }>(
      '/api/admin/content/update',
      {
        method: 'POST',
        body: JSON.stringify({ contentId, ...updates }),
      }
    );
  },

  /**
   * Change category of content item
   */
  changeCategory: async (contentId: number, categorySlug: string) => {
    return apiRequest<{ category: { name: string; slug: string } }>(
      '/api/admin/content/category',
      {
        method: 'POST',
        body: JSON.stringify({ contentId, categorySlug }),
      }
    );
  },

  /**
   * Generate AI description for content
   */
  generateDescription: async (contentId: number) => {
    return apiRequest<{ description: string }>(
      '/api/admin/content/generate-description',
      {
        method: 'POST',
        body: JSON.stringify({ contentId }),
      }
    );
  },

  /**
   * Bulk discard content items
   */
  bulkDiscard: async (contentIds: number[]) => {
    return apiRequest<{ count: number }>(
      '/api/admin/content/bulk-discard',
      {
        method: 'POST',
        body: JSON.stringify({ contentIds }),
      }
    );
  },

  /**
   * Bulk tag content to newsletter
   */
  bulkTag: async (
    newsletterDraftId: number,
    contentIds: number[],
    featuredOrders?: Record<number, number>
  ) => {
    return apiRequest<{ count: number }>(
      '/api/admin/content/bulk-tag',
      {
        method: 'POST',
        body: JSON.stringify({ newsletterDraftId, contentIds, featuredOrders }),
      }
    );
  },
};

// ============================================
// Newsletter API
// ============================================

export const newsletterAPI = {
  /**
   * Get all newsletter drafts
   */
  getAll: async () => {
    return apiRequest<{ drafts: NewsletterDraftWithStats[] }>(
      '/api/admin/newsletters'
    );
  },

  /**
   * Get single newsletter draft
   */
  getById: async (id: number) => {
    return apiRequest<{ draft: NewsletterDraftWithStats }>(
      `/api/admin/newsletters/${id}`
    );
  },

  /**
   * Create newsletter draft
   */
  create: async (payload: CreateNewsletterPayload) => {
    return apiRequest<{ draft: NewsletterDraftWithStats }>(
      '/api/admin/newsletters/create',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Update newsletter draft
   */
  update: async (id: number, updates: Partial<CreateNewsletterPayload>) => {
    return apiRequest<{ draft: NewsletterDraftWithStats }>(
      `/api/admin/newsletters/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  },

  /**
   * Delete newsletter draft
   */
  delete: async (id: number) => {
    return apiRequest<{ success: boolean }>(
      `/api/admin/newsletters/${id}`,
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * Send newsletter draft
   */
  send: async (draftId: number) => {
    return apiRequest<{ message: string; sent: number }>(
      '/api/admin/send-newsletter-draft',
      {
        method: 'POST',
        body: JSON.stringify({ draftId }),
      }
    );
  },

  /**
   * Get newsletter preview HTML
   */
  getPreview: async (draftId: number): Promise<string> => {
    const response = await fetch(
      `/api/admin/newsletter-draft-preview?draftId=${draftId}`
    );
    return response.text();
  },
};

// ============================================
// Admin Operations API
// ============================================

export const adminAPI = {
  /**
   * Trigger content scraping
   */
  scrape: async () => {
    return apiRequest<ScrapeResult>(
      '/api/admin/scrape',
      {
        method: 'POST',
      }
    );
  },

  /**
   * Get admin stats
   */
  getStats: async () => {
    return apiRequest<{
      users: { total: number; active: number };
      content: { total: number; last24Hours: number };
      newsletters: {
        total: number;
        last24Hours: number;
        opened: number;
        openRate: string;
      };
      health: {
        score: number;
        deliveryRate: number;
        openRate: number;
        clickThroughRate: number;
        bounceRate: number;
      };
      engagement: {
        avgScore: number;
      };
    }>('/api/admin/stats');
  },

  /**
   * Get scrape batches
   */
  getBatches: async () => {
    return apiRequest<{
      batches: Array<{
        id: number;
        totalItems: number;
        status: string;
        startedAt: string;
      }>;
    }>('/api/admin/batches');
  },

  /**
   * Get newsletter logs
   */
  getLogs: async () => {
    return apiRequest<{
      batches: Array<{
        sentAt: string;
        subject: string;
        recipientCount: number;
        articleCount: number;
        successCount: number;
        failureCount: number;
        openRate: number;
      }>;
    }>('/api/admin/newsletter-logs');
  },
};

// ============================================
// Analytics API
// ============================================

export const analyticsAPI = {
  /**
   * Get comprehensive analytics overview
   */
  getOverview: async (timeRange: string = '30') => {
    return apiRequest<AnalyticsOverview>(
      `/api/admin/analytics?timeRange=${timeRange}`
    );
  },

  /**
   * Get subscriber analytics
   */
  getSubscribers: async (timeRange: string = '30') => {
    return apiRequest<{
      totalSubscribers: number;
      activeSubscribers: number;
      growth: SubscriberGrowth[];
      churnRate: number;
    }>(`/api/admin/analytics/subscribers?timeRange=${timeRange}`);
  },

  /**
   * Get content performance analytics
   */
  getContentPerformance: async (timeRange: string = '30', limit: number = 10) => {
    return apiRequest<{
      topContent: ContentPerformance[];
      categoryPerformance: CategoryPerformance[];
    }>(
      `/api/admin/analytics/comprehensive?timeRange=${timeRange}&limit=${limit}`
    );
  },

  /**
   * Get newsletter performance
   */
  getNewsletterPerformance: async (timeRange: string = '30') => {
    return apiRequest<{
      newsletters: NewsletterPerformance[];
    }>(`/api/admin/analytics/newsletters?timeRange=${timeRange}`);
  },

  /**
   * Get location/audience data
   */
  getLocationData: async () => {
    return apiRequest<{
      locations: LocationData[];
    }>('/api/admin/analytics/location');
  },

  /**
   * Get health metrics
   */
  getHealthMetrics: async () => {
    return apiRequest<{
      score: number;
      deliveryRate: number;
      openRate: number;
      clickThroughRate: number;
      bounceRate: number;
      issues: string[];
    }>('/api/admin/analytics/health');
  },
};

// ============================================
// User/Public API
// ============================================

export const userAPI = {
  /**
   * Register new user
   */
  register: async (email: string) => {
    return apiRequest<{ message: string }>(
      '/api/users/register',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
  },

  /**
   * Unsubscribe user
   */
  unsubscribe: async (userId: number) => {
    return apiRequest<{ message: string }>(
      `/api/users/unsubscribe/${userId}`,
      {
        method: 'POST',
      }
    );
  },

  /**
   * Get recent public content
   */
  getRecentContent: async () => {
    return apiRequest<{
      hasContent: boolean;
      content: Array<{
        id: number;
        title: string;
        summary: string;
        link: string;
        sourceName: string;
        sourceType: string;
        category: { name: string } | null;
        tags: { name: string }[];
      }>;
    }>('/api/public/recent-content');
  },
};

// ============================================
// Auth API
// ============================================

export const authAPI = {
  /**
   * Send OTP to email
   */
  sendOTP: async (email: string) => {
    return apiRequest<{ message: string; debug?: { otp: string } }>(
      '/api/auth/send-otp',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
  },

  /**
   * Verify OTP and login
   */
  verifyOTP: async (email: string, otp: string) => {
    return apiRequest<{ success: boolean; token?: string }>(
      '/api/auth/verify-otp',
      {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }
    );
  },

  /**
   * Logout
   */
  logout: async () => {
    return apiRequest<{ success: boolean }>(
      '/api/auth/logout',
      {
        method: 'POST',
      }
    );
  },
};

// ============================================
// Export all
// ============================================

export const api = {
  content: contentAPI,
  newsletter: newsletterAPI,
  admin: adminAPI,
  analytics: analyticsAPI,
  user: userAPI,
  auth: authAPI,
};
