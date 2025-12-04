import { db } from "@/lib/db";
import {
  users,
  newsletterSends,
  clickTracking,
  content,
  categories,
  sources,
  newsletterDrafts,
  subscriberEvents,
  sourcePerformance,
  newsletterPerformance,
} from "@/lib/db/schema";
import { eq, sql, and, gte, lte, desc, count, avg, sum } from "drizzle-orm";

/**
 * Calculate engagement score for a user
 * Formula: (Opens × 1) + (Clicks × 3) + (Multiple clicks × 5)
 */
export async function calculateUserEngagementScore(userId: number): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Count opens
  const opens = await db
    .select({ count: count() })
    .from(newsletterSends)
    .where(
      and(
        eq(newsletterSends.userId, userId),
        sql`${newsletterSends.openedAt} IS NOT NULL`,
        gte(newsletterSends.sentAt, thirtyDaysAgo)
      )
    );

  // Count total clicks
  const clicks = await db
    .select({ count: count() })
    .from(clickTracking)
    .where(
      and(
        eq(clickTracking.userId, userId),
        gte(clickTracking.clickedAt, thirtyDaysAgo)
      )
    );

  // Count unique content clicked (multiple clicks on same content = higher engagement)
  const uniqueClicks = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${clickTracking.contentId})` })
    .from(clickTracking)
    .where(
      and(
        eq(clickTracking.userId, userId),
        gte(clickTracking.clickedAt, thirtyDaysAgo)
      )
    );

  const openCount = opens[0]?.count || 0;
  const clickCount = clicks[0]?.count || 0;
  const uniqueClickCount = Number(uniqueClicks[0]?.count) || 0;
  const multipleClicks = Math.max(0, clickCount - uniqueClickCount);

  // Calculate score
  const score = (openCount * 1) + (uniqueClickCount * 3) + (multipleClicks * 5);
  return Math.min(100, score); // Cap at 100
}

/**
 * Calculate health score for newsletter system
 * Formula: (Delivery Rate × 40) + (Open Rate × 30) + (CTR × 20) + (Low Bounce × 10)
 */
export async function calculateHealthScore(timeRangeDays: number = 30): Promise<{
  score: number;
  deliveryRate: number;
  openRate: number;
  clickThroughRate: number;
  bounceRate: number;
}> {
  const startDate = new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000);

  // Get total sends
  const totalSends = await db
    .select({ count: count() })
    .from(newsletterSends)
    .where(gte(newsletterSends.sentAt, startDate));

  const total = totalSends[0]?.count || 0;
  if (total === 0) {
    return { score: 0, deliveryRate: 0, openRate: 0, clickThroughRate: 0, bounceRate: 0 };
  }

  // Get successful deliveries
  const successful = await db
    .select({ count: count() })
    .from(newsletterSends)
    .where(
      and(
        gte(newsletterSends.sentAt, startDate),
        eq(newsletterSends.status, "sent")
      )
    );

  // Get bounced emails
  const bounced = await db
    .select({ count: count() })
    .from(newsletterSends)
    .where(
      and(
        gte(newsletterSends.sentAt, startDate),
        eq(newsletterSends.bounced, true)
      )
    );

  // Get opened emails
  const opened = await db
    .select({ count: count() })
    .from(newsletterSends)
    .where(
      and(
        gte(newsletterSends.sentAt, startDate),
        sql`${newsletterSends.openedAt} IS NOT NULL`
      )
    );

  // Get UNIQUE users who clicked (not total clicks)
  const uniqueClickers = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${clickTracking.userId})` })
    .from(clickTracking)
    .innerJoin(newsletterSends, eq(clickTracking.newsletterSendId, newsletterSends.id))
    .where(gte(newsletterSends.sentAt, startDate));

  const deliveredCount = successful[0]?.count || 0;
  const bouncedCount = bounced[0]?.count || 0;
  const openedCount = opened[0]?.count || 0;
  const uniqueClickersCount = Number(uniqueClickers[0]?.count) || 0;

  const deliveryRate = (deliveredCount / total) * 100;
  const openRate = deliveredCount > 0 ? (openedCount / deliveredCount) * 100 : 0;
  // CTR = unique users who clicked / total delivered (not total clicks!)
  const clickThroughRate = deliveredCount > 0 ? (uniqueClickersCount / deliveredCount) * 100 : 0;
  const bounceRate = (bouncedCount / total) * 100;

  // Calculate health score
  const score = Math.round(
    (deliveryRate * 0.4) +
    (openRate * 0.3) +
    (clickThroughRate * 0.2) +
    ((100 - bounceRate) * 0.1)
  );

  return {
    score: Math.min(100, score),
    deliveryRate: Math.round(deliveryRate * 100) / 100,
    openRate: Math.round(openRate * 100) / 100,
    clickThroughRate: Math.round(clickThroughRate * 100) / 100,
    bounceRate: Math.round(bounceRate * 100) / 100,
  };
}

/**
 * Update user risk level based on engagement
 */
export async function updateUserRiskLevels(): Promise<void> {
  const allUsers = await db.select().from(users).where(eq(users.isActive, true));

  for (const user of allUsers) {
    const score = await calculateUserEngagementScore(user.id);

    let riskLevel = "active";
    if (score === 0) {
      riskLevel = "dormant";
    } else if (score < 10) {
      riskLevel = "churned";
    } else if (score < 30) {
      riskLevel = "at_risk";
    }

    await db
      .update(users)
      .set({
        engagementScore: score,
        riskLevel,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  }
}

/**
 * Calculate source reliability score
 * Based on acceptance rate and engagement metrics
 */
export async function calculateSourceReliability(sourceId: number): Promise<number> {
  // Get total articles from source
  const totalArticles = await db
    .select({ count: count() })
    .from(content)
    .where(eq(content.sourceId, sourceId));

  const total = totalArticles[0]?.count || 0;
  if (total === 0) return 0;

  // Get accepted articles
  const acceptedArticles = await db
    .select({ count: count() })
    .from(content)
    .where(
      and(
        eq(content.sourceId, sourceId),
        eq(content.status, "accepted")
      )
    );

  const accepted = acceptedArticles[0]?.count || 0;
  const acceptanceRate = (accepted / total) * 100;

  // Get click engagement for accepted articles
  const clickStats = await db
    .select({
      totalClicks: count(),
      avgClicks: avg(sql<number>`click_count`)
    })
    .from(
      db
        .select({
          contentId: content.id,
          clickCount: count(clickTracking.id).as('click_count')
        })
        .from(content)
        .leftJoin(clickTracking, eq(content.id, clickTracking.contentId))
        .where(
          and(
            eq(content.sourceId, sourceId),
            eq(content.status, "accepted")
          )
        )
        .groupBy(content.id)
        .as("click_stats")
    );

  const avgEngagement = Number(clickStats[0]?.avgClicks) || 0;

  // Score: 60% acceptance rate + 40% engagement
  const score = Math.round((acceptanceRate * 0.6) + (avgEngagement * 4)); // Normalize engagement to ~0-40 range
  return Math.min(100, score);
}

/**
 * Get subscriber growth data
 */
export async function getSubscriberGrowth(days: number = 30): Promise<Array<{
  date: string;
  newSubscribers: number;
  unsubscribed: number;
  netGrowth: number;
}>> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const dailyStats = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    // New subscribers
    const newSubs = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          gte(users.createdAt, date),
          lte(users.createdAt, nextDate)
        )
      );

    // Unsubscribed (isActive = false)
    const unsubs = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.isActive, false),
          gte(users.updatedAt, date),
          lte(users.updatedAt, nextDate)
        )
      );

    const newCount = newSubs[0]?.count || 0;
    const unsubCount = unsubs[0]?.count || 0;

    dailyStats.push({
      date: date.toISOString().split('T')[0],
      newSubscribers: newCount,
      unsubscribed: unsubCount,
      netGrowth: newCount - unsubCount,
    });
  }

  return dailyStats;
}

/**
 * Get content performance metrics
 */
export async function getContentIntelligence(timeRangeDays: number = 30): Promise<{
  topSources: Array<{ name: string; clicks: number; articles: number; reliability: number }>;
  categoryTrends: Array<{ category: string; clicks: number; growth: number }>;
  contentFreshness: number; // Average age of sent content in days
}> {
  const startDate = new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000);

  // Top sources by clicks
  const topSourcesQuery = await db
    .select({
      sourceId: content.sourceId,
      sourceName: sources.name,
      clicks: count(clickTracking.id),
      articles: sql<number>`COUNT(DISTINCT ${content.id})`,
    })
    .from(content)
    .leftJoin(clickTracking, eq(content.id, clickTracking.contentId))
    .leftJoin(sources, eq(content.sourceId, sources.id))
    .where(
      and(
        sql`${content.sentAt} IS NOT NULL`,
        gte(content.sentAt, startDate)
      )
    )
    .groupBy(content.sourceId, sources.name)
    .orderBy(desc(count(clickTracking.id)))
    .limit(10);

  const topSources = await Promise.all(
    topSourcesQuery.map(async (source) => ({
      name: source.sourceName || "Unknown",
      clicks: source.clicks,
      articles: Number(source.articles),
      reliability: source.sourceId ? await calculateSourceReliability(source.sourceId) : 0,
    }))
  );

  // Category performance trends
  const categoryTrends = await db
    .select({
      categoryName: categories.name,
      clicks: count(clickTracking.id),
    })
    .from(content)
    .leftJoin(clickTracking, eq(content.id, clickTracking.contentId))
    .leftJoin(categories, eq(content.categoryId, categories.id))
    .where(
      and(
        sql`${content.sentAt} IS NOT NULL`,
        gte(content.sentAt, startDate)
      )
    )
    .groupBy(categories.name)
    .orderBy(desc(count(clickTracking.id)));

  // Content freshness (average age when sent)
  const freshnessQuery = await db
    .select({
      avgAge: sql<number>`AVG(EXTRACT(EPOCH FROM (${content.sentAt} - ${content.publishedAt})) / 86400)`,
    })
    .from(content)
    .where(
      and(
        sql`${content.sentAt} IS NOT NULL`,
        gte(content.sentAt, startDate)
      )
    );

  const contentFreshness = Math.round(Number(freshnessQuery[0]?.avgAge) || 0);

  return {
    topSources,
    categoryTrends: categoryTrends.map((ct) => ({
      category: ct.categoryName || "Uncategorized",
      clicks: ct.clicks,
      growth: 0, // TODO: Calculate vs previous period
    })),
    contentFreshness,
  };
}

/**
 * Get newsletter performance comparison
 */
export async function getNewsletterComparison(limit: number = 10): Promise<Array<{
  id: number;
  subject: string;
  sentAt: Date | null;
  openRate: number;
  clickRate: number;
  engagementScore: number;
}>> {
  const newsletters = await db
    .select({
      id: newsletterDrafts.id,
      subject: newsletterDrafts.subject,
      sentAt: newsletterDrafts.sentAt,
    })
    .from(newsletterDrafts)
    .where(eq(newsletterDrafts.status, "sent"))
    .orderBy(desc(newsletterDrafts.sentAt))
    .limit(limit);

  const results = [];
  for (const newsletter of newsletters) {
    // Get total recipients
    const totalRecipients = await db
      .select({ count: count() })
      .from(newsletterSends)
      .where(eq(newsletterSends.newsletterDraftId, newsletter.id));

    // Get opens
    const opens = await db
      .select({ count: count() })
      .from(newsletterSends)
      .where(
        and(
          eq(newsletterSends.newsletterDraftId, newsletter.id),
          sql`${newsletterSends.openedAt} IS NOT NULL`
        )
      );

    // Get clicks
    const clicks = await db
      .select({ count: count() })
      .from(clickTracking)
      .innerJoin(newsletterSends, eq(clickTracking.newsletterSendId, newsletterSends.id))
      .where(eq(newsletterSends.newsletterDraftId, newsletter.id));

    const total = totalRecipients[0]?.count || 0;
    const openCount = opens[0]?.count || 0;
    const clickCount = clicks[0]?.count || 0;

    const openRate = total > 0 ? (openCount / total) * 100 : 0;
    const clickRate = total > 0 ? (clickCount / total) * 100 : 0;
    const engagementScore = Math.round((openRate * 0.5) + (clickRate * 2));

    results.push({
      id: newsletter.id,
      subject: newsletter.subject,
      sentAt: newsletter.sentAt,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      engagementScore,
    });
  }

  return results;
}

/**
 * Track subscriber event
 */
export async function trackSubscriberEvent(
  userId: number,
  eventType: string,
  newsletterSendId?: number | null,
  metadata?: Record<string, any>
): Promise<void> {
  await db.insert(subscriberEvents).values({
    userId,
    eventType,
    newsletterSendId: newsletterSendId || null,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });

  // Update user's last engaged timestamp
  if (eventType === 'opened' || eventType === 'clicked') {
    await db
      .update(users)
      .set({ lastEngagedAt: new Date() })
      .where(eq(users.id, userId));
  }
}

/**
 * Get comprehensive analytics overview with meaningful metrics
 */
export async function getComprehensiveOverview(timeRangeDays: number = 30): Promise<{
  userEngagement: {
    totalSubscribers: number;
    usersWhoOpened: number;
    usersWhoClicked: number;
    openPercentage: number;
    clickPercentage: number;
  };
  articleEngagement: {
    totalArticlesSent: number;
    uniqueArticlesClicked: number;
    totalClicks: number;
    clickedPercentage: number;
    avgClicksPerArticle: number;
  };
  categoryPerformance: Array<{
    category: string;
    articlesSent: number;
    uniqueArticlesClicked: number;
    totalClicks: number;
    clickRate: number;
  }>;
  newsletterMetrics: {
    totalNewslettersSent: number;
    avgOpenRate: number;
    avgClickRate: number;
  };
}> {
  const startDate = new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000);

  // === USER ENGAGEMENT ===
  // Total active subscribers
  const totalSubs = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.isActive, true));

  // Unique users who opened at least one newsletter
  const usersWhoOpened = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${newsletterSends.userId})` })
    .from(newsletterSends)
    .where(
      and(
        gte(newsletterSends.sentAt, startDate),
        sql`${newsletterSends.openedAt} IS NOT NULL`
      )
    );

  // Unique users who clicked at least one article
  const usersWhoClicked = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${clickTracking.userId})` })
    .from(clickTracking)
    .innerJoin(newsletterSends, eq(clickTracking.newsletterSendId, newsletterSends.id))
    .where(gte(newsletterSends.sentAt, startDate));

  const totalSubscribers = totalSubs[0]?.count || 0;
  const openedUsers = Number(usersWhoOpened[0]?.count) || 0;
  const clickedUsers = Number(usersWhoClicked[0]?.count) || 0;

  // === ARTICLE ENGAGEMENT ===
  // Total articles sent in newsletters
  const totalArticles = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${content.id})` })
    .from(content)
    .where(
      and(
        sql`${content.sentAt} IS NOT NULL`,
        gte(content.sentAt, startDate)
      )
    );

  // Unique articles that were clicked
  const clickedArticles = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${clickTracking.contentId})` })
    .from(clickTracking)
    .innerJoin(newsletterSends, eq(clickTracking.newsletterSendId, newsletterSends.id))
    .where(gte(newsletterSends.sentAt, startDate));

  // Total clicks
  const totalClicks = await db
    .select({ count: count() })
    .from(clickTracking)
    .innerJoin(newsletterSends, eq(clickTracking.newsletterSendId, newsletterSends.id))
    .where(gte(newsletterSends.sentAt, startDate));

  const totalArticlesSent = Number(totalArticles[0]?.count) || 0;
  const uniqueArticlesClicked = Number(clickedArticles[0]?.count) || 0;
  const totalClickCount = totalClicks[0]?.count || 0;

  // === CATEGORY PERFORMANCE ===
  const categoryStats = await db
    .select({
      categoryName: categories.name,
      categoryId: categories.id,
      articlesSent: sql<number>`COUNT(DISTINCT ${content.id})`,
      totalClicks: count(clickTracking.id),
      uniqueArticlesClicked: sql<number>`COUNT(DISTINCT ${clickTracking.contentId})`,
    })
    .from(content)
    .leftJoin(categories, eq(content.categoryId, categories.id))
    .leftJoin(clickTracking, eq(content.id, clickTracking.contentId))
    .where(
      and(
        sql`${content.sentAt} IS NOT NULL`,
        gte(content.sentAt, startDate)
      )
    )
    .groupBy(categories.id, categories.name)
    .orderBy(desc(count(clickTracking.id)));

  const categoryPerformance = categoryStats.map((cat) => {
    const articlesSent = Number(cat.articlesSent) || 0;
    const clicked = Number(cat.uniqueArticlesClicked) || 0;
    return {
      category: cat.categoryName || "Uncategorized",
      articlesSent,
      uniqueArticlesClicked: clicked,
      totalClicks: cat.totalClicks,
      clickRate: articlesSent > 0 ? (clicked / articlesSent) * 100 : 0,
    };
  });

  // === NEWSLETTER METRICS ===
  const newsletterStats = await db
    .select({
      totalSent: count(),
    })
    .from(newsletterDrafts)
    .where(
      and(
        eq(newsletterDrafts.status, "sent"),
        gte(newsletterDrafts.sentAt, startDate)
      )
    );

  const newsletterComparisons = await getNewsletterComparison(100); // Get all recent newsletters
  const recentNewsletters = newsletterComparisons.filter(
    (n) => n.sentAt && new Date(n.sentAt) >= startDate
  );

  const avgOpenRate = recentNewsletters.length > 0
    ? recentNewsletters.reduce((sum, n) => sum + n.openRate, 0) / recentNewsletters.length
    : 0;

  const avgClickRate = recentNewsletters.length > 0
    ? recentNewsletters.reduce((sum, n) => sum + n.clickRate, 0) / recentNewsletters.length
    : 0;

  return {
    userEngagement: {
      totalSubscribers,
      usersWhoOpened: openedUsers,
      usersWhoClicked: clickedUsers,
      openPercentage: totalSubscribers > 0 ? (openedUsers / totalSubscribers) * 100 : 0,
      clickPercentage: totalSubscribers > 0 ? (clickedUsers / totalSubscribers) * 100 : 0,
    },
    articleEngagement: {
      totalArticlesSent,
      uniqueArticlesClicked,
      totalClicks: totalClickCount,
      clickedPercentage: totalArticlesSent > 0 ? (uniqueArticlesClicked / totalArticlesSent) * 100 : 0,
      avgClicksPerArticle: totalArticlesSent > 0 ? totalClickCount / totalArticlesSent : 0,
    },
    categoryPerformance,
    newsletterMetrics: {
      totalNewslettersSent: newsletterStats[0]?.totalSent || 0,
      avgOpenRate: Math.round(avgOpenRate * 100) / 100,
      avgClickRate: Math.round(avgClickRate * 100) / 100,
    },
  };
}

/**
 * Get location and audience analytics
 */
export async function getLocationAudienceAnalytics(timeRangeDays: number = 30): Promise<{
  geographicDistribution: Array<{
    country: string;
    countryName: string | null;
    subscriberCount: number;
    openRate: number;
    clickRate: number;
  }>;
  topCities: Array<{
    city: string;
    country: string | null;
    subscriberCount: number;
    engagementScore: number;
  }>;
  audienceSegments: Array<{
    audience: string;
    count: number;
    percentage: number;
    avgEngagementScore: number;
  }>;
  companySizeBreakdown: Array<{
    companySize: string;
    count: number;
    percentage: number;
  }>;
}> {
  const startDate = new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000);

  // === GEOGRAPHIC DISTRIBUTION ===
  // Get subscriber count by country
  const countryStats = await db
    .select({
      country: users.country,
      countryName: users.countryName,
      subscriberCount: count(),
    })
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        sql`${users.country} IS NOT NULL`
      )
    )
    .groupBy(users.country, users.countryName)
    .orderBy(desc(count()));

  // Calculate open and click rates per country
  // Filter out nulls since they shouldn't exist (we filtered in the query)
  const geographicDistribution = await Promise.all(
    countryStats
      .filter(stat => stat.country !== null)
      .map(async (stat) => {
        const countryCode = stat.country!; // Assert non-null since we filtered

        // Get total newsletter sends to users in this country
        const totalSends = await db
          .select({ count: count() })
          .from(newsletterSends)
          .innerJoin(users, eq(newsletterSends.userId, users.id))
          .where(
            and(
              eq(users.country, countryCode),
              gte(newsletterSends.sentAt, startDate)
            )
          );

        // Get opens
        const opens = await db
          .select({ count: count() })
          .from(newsletterSends)
          .innerJoin(users, eq(newsletterSends.userId, users.id))
          .where(
            and(
              eq(users.country, countryCode),
              gte(newsletterSends.sentAt, startDate),
              sql`${newsletterSends.openedAt} IS NOT NULL`
            )
          );

        // Get unique clickers
        const clicks = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${newsletterSends.userId})` })
          .from(newsletterSends)
          .innerJoin(users, eq(newsletterSends.userId, users.id))
          .innerJoin(clickTracking, eq(clickTracking.newsletterSendId, newsletterSends.id))
          .where(
            and(
              eq(users.country, countryCode),
              gte(newsletterSends.sentAt, startDate)
            )
          );

        const total = totalSends[0]?.count || 0;
        const openCount = opens[0]?.count || 0;
        const clickCount = Number(clicks[0]?.count) || 0;

        return {
          country: countryCode,
          countryName: stat.countryName,
          subscriberCount: stat.subscriberCount,
          openRate: total > 0 ? Math.round((openCount / total) * 100 * 100) / 100 : 0,
          clickRate: total > 0 ? Math.round((clickCount / total) * 100 * 100) / 100 : 0,
        };
      })
  );

  // === TOP CITIES ===
  const cityStats = await db
    .select({
      city: users.city,
      country: users.country,
      subscriberCount: count(),
      avgEngagement: avg(users.engagementScore),
    })
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        sql`${users.city} IS NOT NULL`
      )
    )
    .groupBy(users.city, users.country)
    .orderBy(desc(count()))
    .limit(20);

  const topCities = cityStats.map((stat) => ({
    city: stat.city || "Unknown",
    country: stat.country,
    subscriberCount: stat.subscriberCount,
    engagementScore: Math.round(Number(stat.avgEngagement) || 0),
  }));

  // === AUDIENCE SEGMENTS ===
  const totalUsers = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.isActive, true));

  const totalCount = totalUsers[0]?.count || 1;

  const audienceStats = await db
    .select({
      audience: users.audience,
      count: count(),
      avgEngagement: avg(users.engagementScore),
    })
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        sql`${users.audience} IS NOT NULL`
      )
    )
    .groupBy(users.audience)
    .orderBy(desc(count()));

  const audienceSegments = audienceStats.map((stat) => ({
    audience: stat.audience || "unknown",
    count: stat.count,
    percentage: Math.round((stat.count / totalCount) * 100 * 100) / 100,
    avgEngagementScore: Math.round(Number(stat.avgEngagement) || 0),
  }));

  // === COMPANY SIZE BREAKDOWN ===
  const companySizeStats = await db
    .select({
      companySize: users.companySize,
      count: count(),
    })
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        sql`${users.companySize} IS NOT NULL`
      )
    )
    .groupBy(users.companySize)
    .orderBy(desc(count()));

  const companySizeBreakdown = companySizeStats.map((stat) => ({
    companySize: stat.companySize || "unknown",
    count: stat.count,
    percentage: Math.round((stat.count / totalCount) * 100 * 100) / 100,
  }));

  return {
    geographicDistribution,
    topCities,
    audienceSegments,
    companySizeBreakdown,
  };
}
