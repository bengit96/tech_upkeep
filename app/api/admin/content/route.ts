import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { content, categories, tags, contentTags } from "@/lib/db/schema";
import { eq, desc, and, isNull, not } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/content - Fetch content with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const unassigned = searchParams.get("unassigned") === "true";
    const newsletterDraftId = searchParams.get("newsletterDraftId");

    // Build where conditions
    const conditions = [];

    // Status filter (only if explicitly provided)
    if (status) {
      conditions.push(eq(content.status, status));
    }

    // Unassigned filter (not tagged to any newsletter)
    if (unassigned) {
      conditions.push(isNull(content.newsletterDraftId));
    }

    // Newsletter filter (tagged to specific newsletter)
    if (newsletterDraftId) {
      conditions.push(
        eq(content.newsletterDraftId, parseInt(newsletterDraftId))
      );
    }
    conditions.push(not(eq(content.status, "discarded")));

    // Get content with filters
    const items = await db
      .select()
      .from(content)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(content.publishedAt));

    // Enrich with categories and tags
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const category = item.categoryId
          ? (
              await db
                .select()
                .from(categories)
                .where(eq(categories.id, item.categoryId))
                .limit(1)
            )[0]
          : null;

        const itemTags = await db
          .select({ tag: tags })
          .from(contentTags)
          .leftJoin(tags, eq(contentTags.tagId, tags.id))
          .where(eq(contentTags.contentId, item.id));

        return {
          ...item,
          category,
          tags: itemTags.map((t) => t.tag).filter(Boolean),
        };
      })
    );

    return NextResponse.json({
      items: enrichedItems,
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
