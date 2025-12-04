/**
 * Database type definitions
 * Auto-generated types for database tables and relations
 */

export interface User {
  id: number;
  email: string;
  isActive: boolean;
  unsubscribedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Source {
  id: number;
  name: string;
  type: 'blog' | 'youtube' | 'reddit' | 'podcast' | 'substack' | 'newsletter';
  feedUrl: string | null;
  websiteUrl: string | null;
  categoryId: number | null;
  isActive: boolean;
  lastScrapedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Content {
  id: number;
  title: string;
  summary: string;
  description: string | null;
  link: string;
  urlHash: string;
  sourceId: number;
  sourceType: string;
  sourceName: string;
  categoryId: number | null;
  thumbnailUrl: string | null;
  publishedAt: Date;
  qualityScore: number | null;
  engagementScore: number | null;
  status: 'pending' | 'accepted' | 'discarded' | 'sent' | 'saved-for-next';
  scrapeBatchId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsletterDraft {
  id: number;
  name: string | null;
  subject: string;
  preheaderText: string;
  status: 'draft' | 'sent' | 'scheduled';
  scheduledFor: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsletterSend {
  id: number;
  newsletterDraftId: number;
  userId: number;
  resendEmailId: string | null;
  status: 'queued' | 'sent' | 'failed' | 'bounced';
  sentAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  openedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailClick {
  id: number;
  newsletterSendId: number;
  contentId: number;
  clickedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface ScrapeBatch {
  id: number;
  totalItems: number;
  status: 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentTag {
  contentId: number;
  tagId: number;
  createdAt: Date;
}

export interface NewsletterContent {
  newsletterDraftId: number;
  contentId: number;
  featuredOrder: number | null;
  createdAt: Date;
}

export interface OTP {
  id: number;
  email: string;
  code: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}
