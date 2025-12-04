/**
 * API request and response type definitions
 */

import type { Content, NewsletterDraft, User, Category, Source } from './database';

// ============================================
// API Response Wrapper
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Content Management
// ============================================

export interface ContentWithRelations extends Content {
  category?: Category;
  source?: Source;
  tags?: Array<{ name: string; slug: string }>;
  featuredOrder?: number;
}

export interface ContentFilters {
  status?: Content['status'];
  categoryId?: number;
  sourceId?: number;
  scrapeBatchId?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ContentUpdatePayload {
  title?: string;
  summary?: string;
  description?: string;
  categoryId?: number;
  status?: Content['status'];
  featuredOrder?: number | null;
}

// ============================================
// Newsletter Management
// ============================================

export interface NewsletterDraftWithStats extends NewsletterDraft {
  articleCount?: number;
  contentCount?: number;
  recipientCount?: number;
}

export interface CreateNewsletterPayload {
  name?: string;
  subject: string;
  preheaderText?: string;
}

export interface NewsletterContentItem {
  id: number;
  title: string;
  summary: string;
  description?: string;
  link: string;
  sourceName: string;
  sourceType: string;
  categoryName?: string;
  featuredOrder?: number;
}

export interface NewsletterPreviewData {
  subject: string;
  preheaderText: string;
  content: Array<{
    category: string;
    items: NewsletterContentItem[];
  }>;
  featuredItems: NewsletterContentItem[];
}

// ============================================
// Analytics
// ============================================

export interface AnalyticsOverview {
  totalSends: number;
  totalOpens: number;
  totalClicks: number;
  openRate: number;
  clickRate: number;
  totalSubscribers: number;
  activeSubscribers: number;
}

export interface ContentPerformance {
  contentId: number;
  title: string;
  link: string;
  sourceName: string;
  categoryName: string | null;
  clicks: number;
  clickRate: number;
}

export interface CategoryPerformance {
  categoryName: string;
  totalArticles: number;
  totalClicks: number;
  avgClickRate: number;
}

export interface SubscriberGrowth {
  date: string;
  newSubscribers: number;
  unsubscribes: number;
  totalActive: number;
}

export interface NewsletterPerformance {
  id: number;
  subject: string;
  sentAt: string;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  openRate: number;
  clickRate: number;
}

export interface LocationData {
  country: string;
  city?: string;
  count: number;
  percentage: number;
}

// ============================================
// User Management
// ============================================

export interface RegisterUserPayload {
  email: string;
}

export interface UnsubscribePayload {
  userId: number;
  reason?: string;
}

// ============================================
// Authentication
// ============================================

export interface SendOTPPayload {
  email: string;
}

export interface VerifyOTPPayload {
  email: string;
  code: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
}

// ============================================
// Admin Operations
// ============================================

export interface ScrapeResult {
  batchId: number;
  totalItems: number;
  newItems: number;
  duplicates: number;
  status: 'completed' | 'failed';
  message?: string;
}

export interface BulkContentOperation {
  contentIds: number[];
  action: 'accept' | 'discard' | 'tag' | 'untag';
  newsletterDraftId?: number;
  categoryId?: number;
}

export interface SourceUpdatePayload {
  name?: string;
  feedUrl?: string;
  websiteUrl?: string;
  categoryId?: number;
  isActive?: boolean;
}

// ============================================
// Email Tracking
// ============================================

export interface EmailClickEvent {
  newsletterSendId: number;
  contentId: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface EmailOpenEvent {
  newsletterSendId: number;
  ipAddress?: string;
  userAgent?: string;
}
