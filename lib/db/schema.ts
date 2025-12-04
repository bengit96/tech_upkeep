import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  index,
} from "drizzle-orm/pg-core";
// no-op

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("subscriber"), // 'subscriber' or 'admin'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  // Engagement tracking
  lastEngagedAt: timestamp("last_engaged_at", { withTimezone: false }), // Last time user opened/clicked
  engagementScore: integer("engagement_score").default(0), // Calculated engagement score
  riskLevel: text("risk_level").default("active"), // 'active', 'at_risk', 'dormant', 'churned'
  // Location & Audience tracking
  country: text("country"), // ISO country code (e.g., 'US', 'GB', 'SG')
  countryName: text("country_name"), // Full country name (e.g., 'United States')
  region: text("region"), // State/province (e.g., 'California', 'England')
  city: text("city"), // City name
  timezone: text("timezone"), // IANA timezone (e.g., 'America/Los_Angeles')
  registrationIp: text("registration_ip"), // IP address at registration
  audience: text("audience"), // Audience segment: 'developer', 'engineering-leader', 'product-manager', 'data-scientist', 'other'
  companySize: text("company_size"), // 'startup', 'small', 'medium', 'enterprise', 'unknown'
  seniority: text("seniority"), // 'junior', 'mid', 'senior', 'lead', 'executive', 'unknown'
  registrationSource: text("registration_source"), // Where user subscribed: 'landing-page', 'blog', etc.
  registrationSourcePage: text("registration_source_page"), // Specific page: '/blog/aws-outage-...'
});

// OTP tokens for admin login
export const otpTokens = pgTable("otp_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: false }).notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

// Sources table - tracks all content sources we aggregate from
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., "Netflix Tech Blog", "Fireship YouTube"
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(), // 'blog', 'youtube', 'reddit', 'substack', 'podcast', 'rss'
  url: text("url").notNull(), // Main URL or RSS feed URL
  isActive: boolean("is_active").notNull().default(true),
  metadata: text("metadata"), // JSON string for extra config (API keys, channel IDs, subreddit names, etc.)
  description: text("description"),
  category: text("category"), // 'engineering', 'ai-ml', 'product', 'devops', 'career', 'news', 'tools'
  subcategory: text("subcategory"), // 'frontend', 'backend', 'infra', 'company-blog', 'personal-blog', etc.
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

// Scrape batches - each scrape creates a new batch for review
export const scrapeBatches = pgTable("scrape_batches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Scrape Jan 15, 2025 10:30 AM"
  status: text("status").notNull().default("pending"), // 'pending', 'reviewed', 'merged'
  totalItems: integer("total_items").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

// Content table - stores all aggregated content
export const content = pgTable(
  "content",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    description: text("description"), // AI-generated description for newsletter
    readingTime: integer("reading_time"), // Reading time in minutes
    link: text("link").notNull().unique(),
    sourceId: integer("source_id").references(() => sources.id), // Reference to sources table
    sourceType: text("source_type").notNull(), // 'youtube', 'twitter', 'article', 'reddit', 'substack', 'podcast'
    sourceName: text("source_name"), // Channel name, site name, etc.
    thumbnailUrl: text("thumbnail_url"),
    categoryId: integer("category_id").references(() => categories.id),
    batchId: integer("batch_id").references(() => scrapeBatches.id), // Which scrape batch this belongs to
    publishedAt: timestamp("published_at", { withTimezone: false }).notNull(),
    scrapedAt: timestamp("scraped_at", { withTimezone: false }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
    // NEW: Deduplication fields
    contentHash: text("content_hash"), // MD5 hash of title+summary
    normalizedUrl: text("normalized_url"), // Cleaned URL for better duplicate detection
    // NEW: Quality scoring fields
    engagementScore: integer("engagement_score"), // Raw engagement metrics (upvotes, views, etc.)
    qualityScore: integer("quality_score"), // Calculated quality score (0-100)
    // NEW: Manual curation fields
    status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'discarded', 'saved-for-next'
    newsletterDraftId: integer("newsletter_draft_id").references(() => newsletterDrafts.id), // Which newsletter this content belongs to (null if not assigned)
    sentAt: timestamp("sent_at", { withTimezone: false }), // When email was sent (null if not sent)
    featuredOrder: integer("featured_order"), // 1, 2, or 3 for top featured articles (null = not featured)
  },
  (table) => ({
    sourceIdIdx: index("source_id_idx").on(table.sourceId),
    sourceTypeIdx: index("source_type_idx").on(table.sourceType),
    publishedAtIdx: index("published_at_idx").on(table.publishedAt),
    categoryIdx: index("category_idx").on(table.categoryId),
    batchIdIdx: index("batch_id_idx").on(table.batchId),
    contentHashIdx: index("content_hash_idx").on(table.contentHash),
    normalizedUrlIdx: index("normalized_url_idx").on(table.normalizedUrl),
    qualityScoreIdx: index("quality_score_idx").on(table.qualityScore),
  })
);

// Content-Tags junction table (many-to-many)
export const contentTags = pgTable(
  "content_tags",
  {
    id: serial("id").primaryKey(),
    contentId: integer("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    contentIdx: index("content_tags_content_idx").on(table.contentId),
    tagIdx: index("content_tags_tag_idx").on(table.tagId),
  })
);

// User preferences for categories
export const userCategoryPreferences = pgTable(
  "user_category_preferences",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  }
);

// User preferences for tags
export const userTagPreferences = pgTable("user_tag_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

// Newsletter sends tracking
export const newsletterSends = pgTable("newsletter_sends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  newsletterDraftId: integer("newsletter_draft_id").references(() => newsletterDrafts.id), // Link to the newsletter draft
  sentAt: timestamp("sent_at", { withTimezone: false }).notNull().defaultNow(),
  openedAt: timestamp("opened_at", { withTimezone: false }), // When email was opened (null if not opened)
  contentCount: integer("content_count").notNull(),
  status: text("status").notNull(), // 'sent', 'failed', 'bounced'
  resendEmailId: text("resend_email_id"), // Resend email ID for tracking via API
  // Enhanced tracking
  subject: text("subject"), // Email subject line
  previewText: text("preview_text"), // Preview text
  bounced: boolean("bounced").default(false), // Email bounced
  spamComplaint: boolean("spam_complaint").default(false), // Marked as spam
  deviceType: text("device_type"), // 'desktop', 'mobile', 'tablet', 'unknown'
  emailClient: text("email_client"), // 'gmail', 'outlook', 'apple', 'yahoo', etc.
  // Location tracking (captured on email open)
  openIpAddress: text("open_ip_address"), // IP address when email was opened
  openCountry: text("open_country"), // Country code where email was opened
  openCity: text("open_city"), // City where email was opened
});

// Click tracking table for newsletter analytics
export const clickTracking = pgTable(
  "click_tracking",
  {
    id: serial("id").primaryKey(),
    contentId: integer("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }), // Can be null for anonymous tracking
    newsletterSendId: integer("newsletter_send_id").references(() => newsletterSends.id, { onDelete: "set null" }),
    clickedAt: timestamp("clicked_at", { withTimezone: false }).notNull().defaultNow(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    // Enhanced tracking
    timeToClick: integer("time_to_click"), // Seconds from email open to click
    deviceType: text("device_type"), // 'desktop', 'mobile', 'tablet', 'unknown'
    emailClient: text("email_client"), // 'gmail', 'outlook', 'apple', 'yahoo', etc.
    // Location tracking
    country: text("country"), // Country code where click occurred
    city: text("city"), // City where click occurred
  },
  (table) => ({
    contentIdx: index("click_tracking_content_idx").on(table.contentId),
    userIdx: index("click_tracking_user_idx").on(table.userId),
    clickedAtIdx: index("click_tracking_clicked_at_idx").on(table.clickedAt),
  })
);

// Newsletter configuration table
export const newsletterConfig = pgTable("newsletter_config", {
  id: serial("id").primaryKey(),
  headerContent: text("header_content"), // Custom header text/HTML for newsletter
  footerContent: text("footer_content"), // Custom footer text/HTML for newsletter
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

// Newsletter drafts table - stores created newsletters before sending
export const newsletterDrafts = pgTable("newsletter_drafts", {
  id: serial("id").primaryKey(),
  name: text("name"), // Internal name for the newsletter (e.g., "Newsletter Jan 15, 2025")
  subject: text("subject").notNull(), // Newsletter subject line
  preheaderText: text("preheader_text"), // Preview text
  htmlContent: text("html_content"), // Full HTML content (generated when finalized)
  contentIds: text("content_ids"), // Keeping for backward compatibility temporarily
  contentCount: integer("content_count"), // Keeping for backward compatibility temporarily
  status: text("status").notNull().default("draft"), // 'draft', 'finalized', 'sent'
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: false }), // When sent (null if draft)
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

// Newsletter schedules table
export const newsletterSchedules = pgTable("newsletter_schedules", {
  id: serial("id").primaryKey(),
  scheduledFor: timestamp("scheduled_for", { withTimezone: false }).notNull(), // When to send the newsletter
  status: text("status").notNull().default("pending"), // 'pending', 'sent', 'cancelled'
  contentSnapshot: text("content_snapshot"), // JSON snapshot of accepted content IDs at time of scheduling
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: false }), // When actually sent (null if pending)
  cancelledAt: timestamp("cancelled_at", { withTimezone: false }), // When cancelled (null if not cancelled)
});

// Subscriber lifecycle events table - track key subscriber events
export const subscriberEvents = pgTable(
  "subscriber_events",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(), // 'subscribed', 'opened', 'clicked', 'unsubscribed', 'bounced', 'spam_complaint'
    newsletterSendId: integer("newsletter_send_id").references(() => newsletterSends.id, { onDelete: "set null" }),
    metadata: text("metadata"), // JSON for additional event data
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("subscriber_events_user_idx").on(table.userId),
    eventTypeIdx: index("subscriber_events_type_idx").on(table.eventType),
    createdAtIdx: index("subscriber_events_created_at_idx").on(table.createdAt),
  })
);

// Source performance tracking - aggregated metrics per source
export const sourcePerformance = pgTable(
  "source_performance",
  {
    id: serial("id").primaryKey(),
    sourceId: integer("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    period: text("period").notNull(), // 'weekly', 'monthly', 'all_time'
    periodStart: timestamp("period_start", { withTimezone: false }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: false }).notNull(),
    articlesPublished: integer("articles_published").default(0),
    articlesAccepted: integer("articles_accepted").default(0),
    totalClicks: integer("total_clicks").default(0),
    totalOpens: integer("total_opens").default(0),
    avgQualityScore: integer("avg_quality_score").default(0),
    reliabilityScore: integer("reliability_score").default(0), // 0-100 based on acceptance rate and engagement
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (table) => ({
    sourceIdx: index("source_performance_source_idx").on(table.sourceId),
    periodIdx: index("source_performance_period_idx").on(table.period),
  })
);

// Newsletter performance snapshot - aggregated metrics per newsletter
export const newsletterPerformance = pgTable(
  "newsletter_performance",
  {
    id: serial("id").primaryKey(),
    newsletterDraftId: integer("newsletter_draft_id")
      .notNull()
      .references(() => newsletterDrafts.id, { onDelete: "cascade" }),
    totalRecipients: integer("total_recipients").default(0),
    totalOpened: integer("total_opened").default(0),
    totalClicked: integer("total_clicked").default(0),
    totalBounced: integer("total_bounced").default(0),
    totalSpamComplaints: integer("total_spam_complaints").default(0),
    uniqueOpeners: integer("unique_openers").default(0),
    uniqueClickers: integer("unique_clickers").default(0),
    avgTimeToOpen: integer("avg_time_to_open"), // Average seconds from send to open
    avgTimeToClick: integer("avg_time_to_click"), // Average seconds from open to click
    engagementScore: integer("engagement_score").default(0), // Calculated composite score
    openRate: integer("open_rate").default(0), // Stored as percentage * 100 (e.g., 4567 = 45.67%)
    clickThroughRate: integer("click_through_rate").default(0),
    clickToOpenRate: integer("click_to_open_rate").default(0),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (table) => ({
    newsletterIdx: index("newsletter_performance_newsletter_idx").on(table.newsletterDraftId),
  })
);

// Outreach campaigns table - manages outreach campaigns
export const outreachCampaigns = pgTable("outreach_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "JS Developers Q1 2025"
  target: text("target").notNull(), // 'github', 'linkedin', 'twitter'
  targetLanguage: text("target_language"), // 'javascript', 'python', 'go', etc.
  targetLevel: text("target_level"), // 'junior', 'mid', 'senior', 'all'
  status: text("status").notNull().default("draft"), // 'draft', 'active', 'paused', 'completed'
  emailTemplate: text("email_template"), // Email template content
  emailSubject: text("email_subject"), // Email subject line
  totalProspects: integer("total_prospects").default(0),
  totalContacted: integer("total_contacted").default(0),
  totalResponded: integer("total_responded").default(0),
  totalConverted: integer("total_converted").default(0), // Signed up for newsletter
  scrapingOffset: integer("scraping_offset").default(0), // Track pagination offset for API calls
  scrapedUserIds: text("scraped_user_ids"), // JSON array of already scraped user IDs to avoid duplicates
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

// Outreach prospects table - stores individual prospects
export const outreachProspects = pgTable(
  "outreach_prospects",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id")
      .notNull()
      .references(() => outreachCampaigns.id, { onDelete: "cascade" }),
    name: text("name"), // Developer name
    email: text("email"), // Email address (if available)
    githubUrl: text("github_url"), // GitHub profile URL
    linkedinUrl: text("linkedin_url"), // LinkedIn profile URL
    twitterUrl: text("twitter_url"), // Twitter profile URL
    redditUrl: text("reddit_url"), // Reddit profile URL
    stackoverflowUrl: text("stackoverflow_url"), // Stack Overflow profile URL
    bio: text("bio"), // Bio/description
    topRepo: text("top_repo"), // Top repository
    stack: text("stack"), // Tech stack (e.g., "JavaScript, React, Node.js")
    level: text("level"), // 'junior', 'mid', 'senior' (inferred)
    location: text("location"), // Location (if available)
    status: text("status").notNull().default("pending"), // 'pending', 'contacted', 'responded', 'converted', 'bounced', 'unsubscribed'
    contactedAt: timestamp("contacted_at", { withTimezone: false }), // When outreach email was sent
    respondedAt: timestamp("responded_at", { withTimezone: false }), // When prospect responded
    convertedAt: timestamp("converted_at", { withTimezone: false }), // When prospect signed up
    bouncedAt: timestamp("bounced_at", { withTimezone: false }), // When email bounced
    notes: text("notes"), // Admin notes
    metadata: text("metadata"), // JSON for additional data
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (table) => ({
    campaignIdx: index("outreach_prospects_campaign_idx").on(table.campaignId),
    statusIdx: index("outreach_prospects_status_idx").on(table.status),
    emailIdx: index("outreach_prospects_email_idx").on(table.email),
  })
);

// Outreach emails table - tracks individual email sends
export const outreachEmails = pgTable(
  "outreach_emails",
  {
    id: serial("id").primaryKey(),
    prospectId: integer("prospect_id")
      .notNull()
      .references(() => outreachProspects.id, { onDelete: "cascade" }),
    campaignId: integer("campaign_id")
      .notNull()
      .references(() => outreachCampaigns.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: false }).notNull().defaultNow(),
    openedAt: timestamp("opened_at", { withTimezone: false }), // When email was opened
    clickedAt: timestamp("clicked_at", { withTimezone: false }), // When link was clicked
    respondedAt: timestamp("responded_at", { withTimezone: false }), // When prospect responded
    bounced: boolean("bounced").default(false),
    resendEmailId: text("resend_email_id"), // Resend email ID for tracking
    status: text("status").notNull().default("sent"), // 'sent', 'opened', 'clicked', 'responded', 'bounced'
  },
  (table) => ({
    prospectIdx: index("outreach_emails_prospect_idx").on(table.prospectId),
    campaignIdx: index("outreach_emails_campaign_idx").on(table.campaignId),
    statusIdx: index("outreach_emails_status_idx").on(table.status),
  })
);

// Social media posts table - stores generated social media content from newsletters
export const socialMediaPosts = pgTable(
  "social_media_posts",
  {
    id: serial("id").primaryKey(),
    newsletterDraftId: integer("newsletter_draft_id")
      .notNull()
      .references(() => newsletterDrafts.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(), // 'tiktok', 'instagram-feed', 'instagram-stories', 'instagram-reels', 'twitter-thread', 'twitter-single'
    contentType: text("content_type").notNull(), // 'script', 'caption', 'thread', 'tweet'
    title: text("title"), // Internal title for organization
    content: text("content").notNull(), // Main post content/script
    hashtags: text("hashtags"), // Comma-separated hashtags
    metadata: text("metadata"), // JSON for platform-specific data (slide count, video length, etc.)
    status: text("status").notNull().default("draft"), // 'draft', 'published', 'archived'
    publishedAt: timestamp("published_at", { withTimezone: false }), // When posted (null if not posted)
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (table) => ({
    newsletterIdx: index("social_media_posts_newsletter_idx").on(table.newsletterDraftId),
    platformIdx: index("social_media_posts_platform_idx").on(table.platform),
    statusIdx: index("social_media_posts_status_idx").on(table.status),
  })
);

// Video generations table - tracks AI-generated videos for outreach
export const videoGenerations = pgTable(
  "video_generations",
  {
    id: serial("id").primaryKey(),
    contentId: integer("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    visualPrompt: text("visual_prompt").notNull(), // Prompt for Google Veo visual generation
    narrationScript: text("narration_script").notNull(), // Voiceover script
    style: text("style").notNull().default("tech-news"), // 'tech-news', 'tutorial', 'promotional', 'explainer'
    duration: integer("duration").notNull().default(15), // Video duration in seconds
    status: text("status").notNull().default("pending"), // 'pending', 'generating', 'completed', 'failed'
    veoJobId: text("veo_job_id"), // Google Veo job ID for tracking
    videoUrl: text("video_url"), // URL to generated video (when completed)
    thumbnailUrl: text("thumbnail_url"), // Video thumbnail URL
    metadata: text("metadata"), // JSON for additional data (file size, resolution, etc.)
    errorMessage: text("error_message"), // Error message if generation failed
    completedAt: timestamp("completed_at", { withTimezone: false }), // When video generation completed
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (table) => ({
    contentIdx: index("video_generations_content_idx").on(table.contentId),
    statusIdx: index("video_generations_status_idx").on(table.status),
  })
);

// Blog posts table - tracks blog post metadata
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(), // URL slug (e.g., "best-tech-newsletters-for-junior-developers")
    title: text("title").notNull(),
    description: text("description"),
    category: text("category"), // e.g., "Learning", "Career Growth", "Developer Tools"
    publishedAt: timestamp("published_at", { withTimezone: false }).notNull(),
    readTime: text("read_time"), // e.g., "8 min read"
    totalViews: integer("total_views").notNull().default(0), // Aggregated view count
    uniqueVisitors: integer("unique_visitors").notNull().default(0), // Unique IPs/visitors
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: index("blog_posts_slug_idx").on(table.slug),
    viewsIdx: index("blog_posts_views_idx").on(table.totalViews),
  })
);

// Blog visits table - tracks individual visits for analytics
export const blogVisits = pgTable(
  "blog_visits",
  {
    id: serial("id").primaryKey(),
    blogPostId: integer("blog_post_id").references(() => blogPosts.id, { onDelete: "cascade" }),
    page: text("page").notNull(), // Full path (e.g., "/blog/best-tech-newsletters-for-junior-developers")
    referrer: text("referrer"), // Where the visitor came from
    userAgent: text("user_agent"), // Browser/device info
    ip: text("ip"), // Visitor IP address (hashed for privacy)
    country: text("country"), // Country code
    city: text("city"), // City name
    visitedAt: timestamp("visited_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (table) => ({
    blogPostIdx: index("blog_visits_blog_post_idx").on(table.blogPostId),
    dateIdx: index("blog_visits_date_idx").on(table.visitedAt),
    pageIdx: index("blog_visits_page_idx").on(table.page),
  })
);

// Custom email drafts table - stores custom email drafts for sending to users
export const customEmailDrafts = pgTable(
  "custom_email_drafts",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(), // Internal name (e.g., "Product Launch Announcement")
    subject: text("subject").notNull(), // Email subject line
    preheaderText: text("preheader_text"), // Preview text shown in inbox
    htmlContent: text("html_content").notNull(), // Custom HTML email content
    status: text("status").notNull().default("draft"), // 'draft', 'sent', 'scheduled'
    targetAudience: text("target_audience"), // JSON string with filters (audience, seniority, country, etc.)
    sentCount: integer("sent_count").default(0), // Number of users email was sent to
    includeTracking: boolean("include_tracking").default(true), // Whether to include open/click tracking
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: false }), // When sent (null if draft)
    updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("custom_email_drafts_status_idx").on(table.status),
  })
);

// Custom email sends tracking - tracks individual sends from custom emails
export const customEmailSends = pgTable(
  "custom_email_sends",
  {
    id: serial("id").primaryKey(),
    customEmailDraftId: integer("custom_email_draft_id")
      .notNull()
      .references(() => customEmailDrafts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sentAt: timestamp("sent_at", { withTimezone: false }).notNull().defaultNow(),
    openedAt: timestamp("opened_at", { withTimezone: false }), // When email was opened
    status: text("status").notNull(), // 'sent', 'failed', 'bounced'
    resendEmailId: text("resend_email_id"), // Resend's email ID for tracking
    // Tracking metadata
    deviceType: text("device_type"), // 'desktop', 'mobile', 'tablet', 'unknown'
    emailClient: text("email_client"), // 'gmail', 'outlook', 'apple', 'yahoo', etc.
    openIpAddress: text("open_ip_address"),
    openCountry: text("open_country"),
    openCity: text("open_city"),
  },
  (table) => ({
    draftIdx: index("custom_email_sends_draft_idx").on(table.customEmailDraftId),
    userIdx: index("custom_email_sends_user_idx").on(table.userId),
  })
);

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type ScrapeBatch = typeof scrapeBatches.$inferSelect;
export type NewScrapeBatch = typeof scrapeBatches.$inferInsert;
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
export type ClickTracking = typeof clickTracking.$inferSelect;
export type NewClickTracking = typeof clickTracking.$inferInsert;
export type NewsletterConfig = typeof newsletterConfig.$inferSelect;
export type NewNewsletterConfig = typeof newsletterConfig.$inferInsert;
export type NewsletterDraft = typeof newsletterDrafts.$inferSelect;
export type NewNewsletterDraft = typeof newsletterDrafts.$inferInsert;
export type NewsletterSchedule = typeof newsletterSchedules.$inferSelect;
export type NewNewsletterSchedule = typeof newsletterSchedules.$inferInsert;
export type NewsletterSend = typeof newsletterSends.$inferSelect;
export type NewNewsletterSend = typeof newsletterSends.$inferInsert;
export type SubscriberEvent = typeof subscriberEvents.$inferSelect;
export type NewSubscriberEvent = typeof subscriberEvents.$inferInsert;
export type SourcePerformance = typeof sourcePerformance.$inferSelect;
export type NewSourcePerformance = typeof sourcePerformance.$inferInsert;
export type NewsletterPerformance = typeof newsletterPerformance.$inferSelect;
export type NewNewsletterPerformance = typeof newsletterPerformance.$inferInsert;
export type OutreachCampaign = typeof outreachCampaigns.$inferSelect;
export type NewOutreachCampaign = typeof outreachCampaigns.$inferInsert;
export type OutreachProspect = typeof outreachProspects.$inferSelect;
export type NewOutreachProspect = typeof outreachProspects.$inferInsert;
export type OutreachEmail = typeof outreachEmails.$inferSelect;
export type NewOutreachEmail = typeof outreachEmails.$inferInsert;
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type NewSocialMediaPost = typeof socialMediaPosts.$inferInsert;
export type VideoGeneration = typeof videoGenerations.$inferSelect;
export type NewVideoGeneration = typeof videoGenerations.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type BlogVisit = typeof blogVisits.$inferSelect;
export type NewBlogVisit = typeof blogVisits.$inferInsert;
export type CustomEmailDraft = typeof customEmailDrafts.$inferSelect;
export type NewCustomEmailDraft = typeof customEmailDrafts.$inferInsert;
export type CustomEmailSend = typeof customEmailSends.$inferSelect;
export type NewCustomEmailSend = typeof customEmailSends.$inferInsert;

// Export schema object for tooling and migration generation
export const schema = {
  users,
  otpTokens,
  categories,
  tags,
  sources,
  scrapeBatches,
  content,
  contentTags,
  userCategoryPreferences,
  userTagPreferences,
  newsletterSends,
  clickTracking,
  newsletterConfig,
  newsletterDrafts,
  newsletterSchedules,
  subscriberEvents,
  sourcePerformance,
  newsletterPerformance,
  outreachCampaigns,
  outreachProspects,
  outreachEmails,
  socialMediaPosts,
  videoGenerations,
  blogPosts,
  blogVisits,
  customEmailDrafts,
  customEmailSends,
};
