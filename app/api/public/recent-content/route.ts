import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, categories, tags, contentTags } from "@/lib/db/schema";
import { eq, desc, and, isNotNull, asc } from "drizzle-orm";
import { getReadingTime } from "@/lib/utils/enhanced-reading-time";

/**
 * GET /api/public/recent-content
 * Fetch recently sent newsletter content for landing page display
 */
export async function GET() {
  try {
    // First, get the most recent sentAt timestamp
    const mostRecentSent = await db
      .select({
        sentAt: content.sentAt,
      })
      .from(content)
      .where(and(eq(content.status, "accepted"), isNotNull(content.sentAt)))
      .orderBy(desc(content.sentAt))
      .limit(1);

    if (mostRecentSent.length === 0 || !mostRecentSent[0].sentAt) {
      return NextResponse.json({ content: [], hasContent: false });
    }

    const latestNewsletterDate = mostRecentSent[0].sentAt;

    // Get all content from the most recent newsletter, ordered by featuredOrder first
    const recentContent = await db
      .select({
        id: content.id,
        title: content.title,
        summary: content.summary,
        link: content.link,
        sourceType: content.sourceType,
        sourceName: content.sourceName,
        categoryId: content.categoryId,
        publishedAt: content.publishedAt,
        sentAt: content.sentAt,
        readingTime: content.readingTime,
        featuredOrder: content.featuredOrder,
      })
      .from(content)
      .where(
        and(
          eq(content.status, "accepted"),
          eq(content.sentAt, latestNewsletterDate)
        )
      )
      .orderBy(asc(content.featuredOrder), desc(content.publishedAt));

    if (recentContent.length === 0) {
      return NextResponse.json({ content: [], hasContent: false });
    }

    // Enrich with category and tags
    const enrichedContent = await Promise.all(
      recentContent.map(async (item) => {
        // Calculate and save reading time if not present
        let readingTimeMinutes = item.readingTime;

        if (!readingTimeMinutes && item.link && item.summary) {
          try {
            // Fetch reading time from actual article URL
            readingTimeMinutes = await getReadingTime(
              item.link,
              item.summary,
              item.readingTime
            );

            // Update the database with the calculated reading time
            await db
              .update(content)
              .set({ readingTime: readingTimeMinutes })
              .where(eq(content.id, item.id));
          } catch (error) {
            console.error(
              `Error calculating reading time for article ${item.id}:`,
              error
            );
            // Set a default value if calculation fails
            readingTimeMinutes = 5;
          }
        }

        // Get category
        const category = item.categoryId
          ? await db
              .select()
              .from(categories)
              .where(eq(categories.id, item.categoryId))
              .limit(1)
          : [];

        // Get tags (limit to 1)
        const itemTags = await db
          .select({ tag: tags })
          .from(contentTags)
          .leftJoin(tags, eq(contentTags.tagId, tags.id))
          .where(eq(contentTags.contentId, item.id))
          .limit(1); // Only show 1 tag

        // Format reading time from minutes
        const formatReadingTime = (minutes: number | null) => {
          if (!minutes || minutes < 1) return "< 1 min read";
          if (minutes === 1) return "1 min read";
          return `${minutes} min read`;
        };

        return {
          ...item,
          category: category[0] || null,
          tags: itemTags.map((t) => t.tag).filter(Boolean),
          readingTime: formatReadingTime(readingTimeMinutes),
          isFeatured: item.featuredOrder !== null,
          featuredOrder: item.featuredOrder,
        };
      })
    );

    return NextResponse.json({
      content: enrichedContent,
      hasContent: true,
    });
  } catch (error) {
    console.error("Error fetching recent content:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent content", hasContent: false },
      { status: 500 }
    );
  }
}
