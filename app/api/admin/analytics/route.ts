import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import {
  clickTracking,
  content,
  users,
  categories,
  newsletterSends,
} from "@/lib/db/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "7"; // Default to last 7 days

    const daysAgo = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get top clicked content
    const topClicked = await db
      .select({
        contentId: clickTracking.contentId,
        title: content.title,
        link: content.link,
        sourceType: content.sourceType,
        sourceName: content.sourceName,
        categoryName: categories.name,
        clickCount: sql<number>`count(*)`.as("click_count"),
      })
      .from(clickTracking)
      .leftJoin(content, eq(clickTracking.contentId, content.id))
      .leftJoin(categories, eq(content.categoryId, categories.id))
      .where(gte(clickTracking.clickedAt, startDate))
      .groupBy(
        clickTracking.contentId,
        content.title,
        content.link,
        content.sourceType,
        content.sourceName,
        categories.name
      )
      .orderBy(desc(sql`count(*)`))
      .limit(20);

    // Get clicks by category
    const clicksByCategory = await db
      .select({
        categoryName: categories.name,
        clickCount: sql<number>`count(*)`.as("click_count"),
      })
      .from(clickTracking)
      .leftJoin(content, eq(clickTracking.contentId, content.id))
      .leftJoin(categories, eq(content.categoryId, categories.id))
      .where(gte(clickTracking.clickedAt, startDate))
      .groupBy(categories.name)
      .orderBy(desc(sql`count(*)`));

    // Get clicks by source type
    const clicksBySource = await db
      .select({
        sourceType: content.sourceType,
        clickCount: sql<number>`count(*)`.as("click_count"),
      })
      .from(clickTracking)
      .leftJoin(content, eq(clickTracking.contentId, content.id))
      .where(gte(clickTracking.clickedAt, startDate))
      .groupBy(content.sourceType)
      .orderBy(desc(sql`count(*)`));

    // Get total clicks
    const [totalClicksResult] = await db
      .select({
        total: sql<number>`count(*)`.as("total"),
      })
      .from(clickTracking)
      .where(gte(clickTracking.clickedAt, startDate));

    // Get unique users who clicked
    const [uniqueUsersResult] = await db
      .select({
        uniqueUsers: sql<number>`count(distinct ${clickTracking.userId})`.as(
          "unique_users"
        ),
      })
      .from(clickTracking)
      .where(gte(clickTracking.clickedAt, startDate));

    // Get clicks over time (daily) - Postgres compatible
    const clicksOverTime = await db
      .select({
        date: sql<string>`to_char(date_trunc('day', ${clickTracking.clickedAt}), 'YYYY-MM-DD')`.as(
          "date"
        ),
        clickCount: sql<number>`count(*)`.as("click_count"),
      })
      .from(clickTracking)
      .where(gte(clickTracking.clickedAt, startDate))
      .groupBy(sql`date_trunc('day', ${clickTracking.clickedAt})`)
      .orderBy(sql`date_trunc('day', ${clickTracking.clickedAt})`);

    // Get email statistics (sent vs opened)
    const [emailStatsResult] = await db
      .select({
        totalSent: sql<number>`count(*)`.as("total_sent"),
        totalOpened:
          sql<number>`count(case when ${newsletterSends.openedAt} is not null then 1 end)`.as(
            "total_opened"
          ),
      })
      .from(newsletterSends)
      .where(gte(newsletterSends.sentAt, startDate));

    // Get clicks from emails (clicks with newsletterSendId)
    const [emailClicksResult] = await db
      .select({
        totalClicks: sql<number>`count(*)`.as("total_clicks"),
        uniqueClickers: sql<number>`count(distinct ${clickTracking.userId})`.as(
          "unique_clickers"
        ),
      })
      .from(clickTracking)
      .where(
        and(
          gte(clickTracking.clickedAt, startDate),
          sql`${clickTracking.newsletterSendId} is not null`
        )
      );

    const emailOpenRate =
      emailStatsResult?.totalSent > 0
        ? (
            (emailStatsResult.totalOpened / emailStatsResult.totalSent) *
            100
          ).toFixed(1)
        : "0.0";

    const clickThroughRate =
      emailStatsResult?.totalSent > 0
        ? (
            ((emailClicksResult?.totalClicks || 0) /
              emailStatsResult.totalSent) *
            100
          ).toFixed(1)
        : "0.0";

    const clickToOpenRate =
      emailStatsResult?.totalOpened > 0
        ? (
            ((emailClicksResult?.totalClicks || 0) /
              emailStatsResult.totalOpened) *
            100
          ).toFixed(1)
        : "0.0";

    return NextResponse.json({
      topClicked,
      clicksByCategory,
      clicksBySource,
      totalClicks: totalClicksResult?.total || 0,
      uniqueUsers: uniqueUsersResult?.uniqueUsers || 0,
      clicksOverTime,
      emailStats: {
        totalSent: emailStatsResult?.totalSent || 0,
        totalOpened: emailStatsResult?.totalOpened || 0,
        totalClicks: emailClicksResult?.totalClicks || 0,
        uniqueClickers: emailClicksResult?.uniqueClickers || 0,
        openRate: emailOpenRate,
        clickThroughRate: clickThroughRate,
        clickToOpenRate: clickToOpenRate,
      },
      timeRange: daysAgo,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
