import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, subscriberEvents } from "@/lib/db/schema";
import { eq, gte, and, count, sql, desc } from "drizzle-orm";
import {
  getSubscriberGrowth,
  calculateUserEngagementScore,
} from "@/lib/services/analytics";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get("timeRange") || "30");

    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);

    // Get subscriber growth data
    const growthData = await getSubscriberGrowth(timeRange);

    // Get total subscribers
    const totalSubscribers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));

    // Get churn rate
    const totalChurned = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.isActive, false),
          gte(users.updatedAt, startDate)
        )
      );

    // Get subscriber by risk level
    const riskDistribution = await db
      .select({
        riskLevel: users.riskLevel,
        count: count(),
      })
      .from(users)
      .where(eq(users.isActive, true))
      .groupBy(users.riskLevel);

    // Get engagement score distribution
    const engagementDistribution = await db
      .select({
        score: users.engagementScore,
        count: count(),
      })
      .from(users)
      .where(eq(users.isActive, true))
      .groupBy(users.engagementScore)
      .orderBy(users.engagementScore);

    // Calculate average engagement score
    const avgEngagement = await db
      .select({
        avg: sql<number>`AVG(${users.engagementScore})`,
      })
      .from(users)
      .where(eq(users.isActive, true));

    // Get cohort data (subscribers grouped by signup month)
    const cohortData = await db
      .select({
        month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
        count: count(),
        avgEngagement: sql<number>`AVG(${users.engagementScore})`,
      })
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          gte(users.createdAt, startDate)
        )
      )
      .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`);

    // Get top engaged subscribers
    const topEngaged = await db
      .select({
        email: users.email,
        engagementScore: users.engagementScore,
        lastEngagedAt: users.lastEngagedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(desc(users.engagementScore))
      .limit(20);

    // Get at-risk subscribers
    const atRisk = await db
      .select({
        email: users.email,
        engagementScore: users.engagementScore,
        lastEngagedAt: users.lastEngagedAt,
        riskLevel: users.riskLevel,
      })
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          sql`${users.riskLevel} IN ('at_risk', 'dormant')`
        )
      )
      .orderBy(users.lastEngagedAt)
      .limit(20);

    // Calculate churn rate
    const totalAtStart = totalSubscribers[0].count + (totalChurned[0]?.count || 0);
    const churnRate = totalAtStart > 0
      ? ((totalChurned[0]?.count || 0) / totalAtStart) * 100
      : 0;

    return NextResponse.json({
      growthData,
      totalSubscribers: totalSubscribers[0].count,
      churnRate: Math.round(churnRate * 100) / 100,
      avgEngagementScore: Math.round(Number(avgEngagement[0]?.avg) || 0),
      riskDistribution: riskDistribution.map((r) => ({
        riskLevel: r.riskLevel || "active",
        count: r.count,
      })),
      engagementDistribution: engagementDistribution.map((e) => ({
        score: e.score || 0,
        count: e.count,
      })),
      cohortData: cohortData.map((c) => ({
        month: c.month,
        count: c.count,
        avgEngagement: Math.round(Number(c.avgEngagement) || 0),
      })),
      topEngaged: topEngaged.map((u) => ({
        email: u.email,
        engagementScore: u.engagementScore,
        lastEngagedAt: u.lastEngagedAt,
        createdAt: u.createdAt,
      })),
      atRisk: atRisk.map((u) => ({
        email: u.email,
        engagementScore: u.engagementScore,
        lastEngagedAt: u.lastEngagedAt,
        riskLevel: u.riskLevel,
      })),
      timeRange,
    });
  } catch (error) {
    console.error("Error fetching subscriber analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriber analytics" },
      { status: 500 }
    );
  }
}
