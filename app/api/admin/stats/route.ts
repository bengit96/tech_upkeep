import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, content, newsletterSends } from '@/lib/db/schema';
import { eq, gte, sql } from 'drizzle-orm';
import { requireAdmin } from "@/lib/auth";
import { calculateHealthScore } from "@/lib/services/analytics";

export async function GET() {
  try {
    await requireAdmin();
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    // Get total users
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const activeUsers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isActive, true));

    // Get content stats
    const totalContent = await db.select({ count: sql<number>`count(*)` }).from(content);
    const recentContent = await db.select({ count: sql<number>`count(*)` }).from(content).where(gte(content.publishedAt, yesterday));

    // Get newsletter stats
    const totalNewsletters = await db.select({ count: sql<number>`count(*)` }).from(newsletterSends);
    const recentNewsletters = await db.select({ count: sql<number>`count(*)` }).from(newsletterSends).where(gte(newsletterSends.sentAt, yesterday));

    // Get open rate stats (from tracking pixel)
    const totalOpened = await db.select({ count: sql<number>`count(*)` })
      .from(newsletterSends)
      .where(sql`${newsletterSends.openedAt} IS NOT NULL`);

    const openRate = totalNewsletters[0].count > 0
      ? ((totalOpened[0].count / totalNewsletters[0].count) * 100).toFixed(2)
      : '0.00';

    // Get health score
    const healthMetrics = await calculateHealthScore(30);

    // Get engagement score distribution
    const avgEngagement = await db
      .select({
        avg: sql<number>`AVG(${users.engagementScore})`,
      })
      .from(users)
      .where(eq(users.isActive, true));

    return NextResponse.json({
      users: {
        total: totalUsers[0].count,
        active: activeUsers[0].count,
      },
      content: {
        total: totalContent[0].count,
        last24Hours: recentContent[0].count,
      },
      newsletters: {
        total: totalNewsletters[0].count,
        last24Hours: recentNewsletters[0].count,
        opened: totalOpened[0].count,
        openRate: `${openRate}%`,
      },
      health: {
        score: healthMetrics.score,
        deliveryRate: healthMetrics.deliveryRate,
        openRate: healthMetrics.openRate,
        clickThroughRate: healthMetrics.clickThroughRate,
        bounceRate: healthMetrics.bounceRate,
      },
      engagement: {
        avgScore: Math.round(Number(avgEngagement[0]?.avg) || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
