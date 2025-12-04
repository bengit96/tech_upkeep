/**
 * Admin dashboard and management types
 */

export interface User {
  id: number;
  email: string;
  isActive: boolean;
  engagementScore: number | null;
}

export interface NewsletterDraft {
  id: number;
  name: string | null;
  subject: string;
  status: string;
  articleCount: number;
  createdAt: string;
}

export interface Stats {
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
}

export interface Settings {
  cronEnabled: boolean;
  scrapeSchedule: string;
  newsletterSchedule: string;
}

export interface NewsletterLog {
  sentAt: string;
  subject: string;
  recipientCount: number;
  articleCount: number;
  successCount: number;
  failureCount: number;
  openRate: number;
  articles: Array<{
    title: string;
    url: string;
  }>;
}

export interface NewsletterLogsData {
  batches: NewsletterLog[];
}
