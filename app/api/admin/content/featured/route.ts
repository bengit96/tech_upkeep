import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/content/featured
 * Set featured order for articles (1, 2, 3 for top 3)
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { contentId, featuredOrder } = await request.json();

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // If featuredOrder is null, we're unfeaturing the article
    if (featuredOrder === null) {
      await db
        .update(content)
        .set({ featuredOrder: null })
        .where(eq(content.id, contentId));

      return NextResponse.json({
        success: true,
        message: "Article unfeatured"
      });
    }

    // Validate featuredOrder is 1, 2, or 3
    if (![1, 2, 3].includes(featuredOrder)) {
      return NextResponse.json(
        { error: "Featured order must be 1, 2, or 3" },
        { status: 400 }
      );
    }

    // Check if another article already has this featured order
    const [existing] = await db
      .select()
      .from(content)
      .where(eq(content.featuredOrder, featuredOrder))
      .limit(1);

    if (existing && existing.id !== contentId) {
      // Swap: remove featured order from existing article
      await db
        .update(content)
        .set({ featuredOrder: null })
        .where(eq(content.id, existing.id));
    }

    // Set the featured order for the target article
    await db
      .update(content)
      .set({ featuredOrder })
      .where(eq(content.id, contentId));

    return NextResponse.json({
      success: true,
      message: `Article set as featured #${featuredOrder}`
    });
  } catch (error) {
    console.error("Error setting featured article:", error);
    return NextResponse.json(
      { error: "Failed to set featured article" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/content/featured
 * Get currently featured articles
 */
export async function GET() {
  try {
    await requireAdmin();
    const featured = await db
      .select()
      .from(content)
      .where(isNotNull(content.featuredOrder))
      .orderBy(content.featuredOrder);

    return NextResponse.json({
      featured
    });
  } catch (error) {
    console.error("Error fetching featured articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured articles" },
      { status: 500 }
    );
  }
}
