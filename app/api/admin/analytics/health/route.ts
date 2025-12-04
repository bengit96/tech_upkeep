import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSends } from "@/lib/db/schema";
import { gte, and, eq, count, sql } from "drizzle-orm";
import { calculateHealthScore } from "@/lib/services/analytics";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get("timeRange") || "30");

    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);

    // Get overall health score
    const healthMetrics = await calculateHealthScore(timeRange);

    // Get bounce details
    const bouncesByReason = await db
      .select({
        status: newsletterSends.status,
        count: count(),
      })
      .from(newsletterSends)
      .where(
        and(
          gte(newsletterSends.sentAt, startDate),
          eq(newsletterSends.bounced, true)
        )
      )
      .groupBy(newsletterSends.status);

    // Get spam complaints
    const spamComplaints = await db
      .select({ count: count() })
      .from(newsletterSends)
      .where(
        and(
          gte(newsletterSends.sentAt, startDate),
          eq(newsletterSends.spamComplaint, true)
        )
      );

    // Get device/client breakdown
    const deviceBreakdown = await db
      .select({
        deviceType: newsletterSends.deviceType,
        count: count(),
      })
      .from(newsletterSends)
      .where(
        and(
          gte(newsletterSends.sentAt, startDate),
          sql`${newsletterSends.openedAt} IS NOT NULL`
        )
      )
      .groupBy(newsletterSends.deviceType);

    const emailClientBreakdown = await db
      .select({
        emailClient: newsletterSends.emailClient,
        count: count(),
      })
      .from(newsletterSends)
      .where(
        and(
          gte(newsletterSends.sentAt, startDate),
          sql`${newsletterSends.openedAt} IS NOT NULL`
        )
      )
      .groupBy(newsletterSends.emailClient);

    // Get daily health trends
    const dailyHealth = [];
    for (let i = 0; i < Math.min(timeRange, 30); i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dailyMetrics = await calculateHealthScore(1);
      dailyHealth.push({
        date: date.toISOString().split('T')[0],
        score: dailyMetrics.score,
      });
    }

    return NextResponse.json({
      healthScore: healthMetrics.score,
      deliveryRate: healthMetrics.deliveryRate,
      openRate: healthMetrics.openRate,
      clickThroughRate: healthMetrics.clickThroughRate,
      bounceRate: healthMetrics.bounceRate,
      spamComplaints: spamComplaints[0]?.count || 0,
      bouncesByReason: bouncesByReason.map((b) => ({
        reason: b.status,
        count: b.count,
      })),
      deviceBreakdown: deviceBreakdown.map((d) => ({
        device: d.deviceType || "unknown",
        count: d.count,
      })),
      emailClientBreakdown: emailClientBreakdown.map((c) => ({
        client: c.emailClient || "unknown",
        count: c.count,
      })),
      dailyTrend: dailyHealth.reverse(),
      timeRange,
    });
  } catch (error) {
    console.error("Error fetching health metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch health metrics" },
      { status: 500 }
    );
  }
}
