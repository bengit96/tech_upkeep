import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { APP_NAME } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/newsletter-subject
 * Generates the subject line that would be used for the newsletter
 */
export async function GET() {
  try {
    await requireAdmin();
    // Get accepted content with featured articles
    const acceptedContent = await db
      .select()
      .from(content)
      .where(eq(content.status, "accepted"))
      .orderBy(desc(content.publishedAt))
      .limit(100);

    if (acceptedContent.length === 0) {
      return NextResponse.json(
        { error: "No accepted content" },
        { status: 404 }
      );
    }

    // Get featured articles (featuredOrder 1, 2, 3) for subject line
    const featuredArticles = acceptedContent
      .filter((item) => item.featuredOrder && [1, 2, 3].includes(item.featuredOrder))
      .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));

    // Build subject line with featured article titles
    let subject = "";
    if (featuredArticles.length > 0) {
      const titles = featuredArticles.map((item) => {
        // Truncate long titles
        const maxLength = 40;
        return item.title.length > maxLength
          ? item.title.substring(0, maxLength) + "..."
          : item.title;
      });
      subject = titles.join(", ");
    } else {
      // Fallback to date if no featured articles
      subject = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    // Create preheader text
    const topItems = acceptedContent.slice(0, 3);
    const preheaderText =
      topItems.length > 0
        ? `${topItems[0].title.substring(0, 80)}... + ${acceptedContent.length - 1} more curated articles`
        : `${acceptedContent.length} hand-picked tech articles`;

    return NextResponse.json({
      subject,
      preheaderText,
      contentCount: acceptedContent.length,
      featuredCount: featuredArticles.length,
    });
  } catch (error) {
    console.error("Error generating newsletter subject:", error);
    return NextResponse.json(
      { error: "Failed to generate newsletter subject" },
      { status: 500 }
    );
  }
}
