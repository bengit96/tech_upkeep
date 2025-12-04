// Outreach system types

export interface Campaign {
  id: number;
  name: string;
  target: string;
  targetLanguage: string | null;
  targetLevel: string | null;
  status: string;
  emailSubject: string;
  emailTemplate: string;
  totalProspects: number;
  totalContacted: number;
  totalResponded: number;
  totalConverted: number;
  createdAt: string;
}

export interface Prospect {
  id: number;
  name: string | null;
  email: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  bio: string | null;
  topRepo: string | null;
  stack: string | null;
  level: string | null;
  location: string | null;
  status: string;
  contactedAt: string | null;
  notes: string | null;
}

export interface ScrapeResult {
  success?: boolean;
  scraped?: number;
  inserted?: number;
  skipped?: number;
  totalProspects?: number;
  withEmails?: number;
  withoutEmails?: number;
  error?: string;
}

export interface SendEmailResult {
  success: boolean;
  sent: number;
  failed: number;
  errors?: string[];
}

export type PlatformType = "github" | "twitter" | "linkedin";
export type CampaignStatus = "draft" | "active" | "paused" | "completed";
export type ProspectStatus = "pending" | "contacted" | "responded" | "converted" | "bounced" | "unsubscribed";
export type ExperienceLevel = "junior" | "mid" | "senior" | "all";
