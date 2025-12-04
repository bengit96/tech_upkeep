import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogPosts, blogVisits } from '@/lib/db/schema';
import { desc, eq, sql, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Get date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Get all blog posts with their stats
    const posts = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        category: blogPosts.category,
        totalViews: blogPosts.totalViews,
        uniqueVisitors: blogPosts.uniqueVisitors,
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .orderBy(desc(blogPosts.totalViews));

    // Get recent visits for each post
    const postsWithRecentStats = await Promise.all(
      posts.map(async (post) => {
        const recentVisits = await db
          .select({ count: sql<number>`count(*)` })
          .from(blogVisits)
          .where(
            and(
              eq(blogVisits.blogPostId, post.id),
              gte(blogVisits.visitedAt, dateThreshold)
            )
          );

        const recentUniqueVisitors = await db
          .select({ count: sql<number>`count(distinct ${blogVisits.ip})` })
          .from(blogVisits)
          .where(
            and(
              eq(blogVisits.blogPostId, post.id),
              gte(blogVisits.visitedAt, dateThreshold)
            )
          );

        return {
          ...post,
          recentViews: recentVisits[0]?.count || 0,
          recentUniqueVisitors: recentUniqueVisitors[0]?.count || 0,
        };
      })
    );

    // Get total stats
    const totalStats = await db
      .select({
        totalViews: sql<number>`sum(${blogPosts.totalViews})`,
        totalUnique: sql<number>`sum(${blogPosts.uniqueVisitors})`,
      })
      .from(blogPosts);

    // Get recent total visits
    const recentTotalVisits = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogVisits)
      .where(gte(blogVisits.visitedAt, dateThreshold));

    // Get visits over time (daily breakdown)
    const visitsOverTime = await db
      .select({
        date: sql<string>`DATE(${blogVisits.visitedAt})`,
        visits: sql<number>`count(*)`,
        uniqueVisitors: sql<number>`count(distinct ${blogVisits.ip})`,
      })
      .from(blogVisits)
      .where(gte(blogVisits.visitedAt, dateThreshold))
      .groupBy(sql`DATE(${blogVisits.visitedAt})`)
      .orderBy(sql`DATE(${blogVisits.visitedAt})`);

    // Get top referrers
    const topReferrers = await db
      .select({
        referrer: blogVisits.referrer,
        count: sql<number>`count(*)`,
      })
      .from(blogVisits)
      .where(
        and(
          gte(blogVisits.visitedAt, dateThreshold),
          sql`${blogVisits.referrer} != '' AND ${blogVisits.referrer} IS NOT NULL`
        )
      )
      .groupBy(blogVisits.referrer)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return NextResponse.json({
      posts: postsWithRecentStats,
      totalStats: {
        allTimeViews: totalStats[0]?.totalViews || 0,
        allTimeUnique: totalStats[0]?.totalUnique || 0,
        recentViews: recentTotalVisits[0]?.count || 0,
      },
      visitsOverTime,
      topReferrers,
      period: `${days} days`,
    });
  } catch (error) {
    console.error('Blog analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog analytics' },
      { status: 500 }
    );
  }
}
