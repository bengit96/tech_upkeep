import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq, ne, inArray, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/content/bulk-tag
 * Bulk tag multiple articles to a newsletter
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { newsletterDraftId, contentIds, featuredOrders } = body;

    if (!newsletterDraftId || !contentIds || !Array.isArray(contentIds)) {
      return NextResponse.json(
        { error: "newsletterDraftId and contentIds array are required" },
        { status: 400 }
      );
    }

    if (contentIds.length === 0) {
      return NextResponse.json(
        { error: "No content IDs provided" },
        { status: 400 }
      );
    }

    // Check if any articles are already tagged to another newsletter
    const existingContent = await db
      .select()
      .from(content)
      .where(inArray(content.id, contentIds));

    const alreadyTagged = existingContent.filter(
      (item) =>
        item.newsletterDraftId && item.newsletterDraftId !== newsletterDraftId
    );

    if (alreadyTagged.length > 0) {
      return NextResponse.json(
        {
          error: `${alreadyTagged.length} article(s) are already tagged to another newsletter`,
          alreadyTagged: alreadyTagged.map((item) => ({
            id: item.id,
            title: item.title,
            newsletterDraftId: item.newsletterDraftId,
          })),
        },
        { status: 400 }
      );
    }

    // Bulk update with a transaction: set accepted + draft id
    const updated = await db.transaction(async (tx) => {
      // First, assign newsletterDraftId and status in one statement
      const res = await tx
        .update(content)
        .set({ newsletterDraftId, status: "accepted" })
        .where(inArray(content.id, contentIds));

      // Then, set featuredOrder for the provided mapping
      if (featuredOrders) {
        // Persist provided featured orders
        for (const [idStr, order] of Object.entries(
          featuredOrders as Record<string, number>
        )) {
          const id = Number(idStr);
          if (!contentIds.includes(id)) continue;
          // Set this row's featured order
          await tx
            .update(content)
            .set({ featuredOrder: order })
            .where(eq(content.id, id));

          // Clear conflicting featured order on OTHER rows in the same newsletter
          await tx
            .update(content)
            .set({ featuredOrder: null })
            .where(
              and(
                eq(content.newsletterDraftId, newsletterDraftId),
                eq(content.featuredOrder, order as any),
                ne(content.id, id)
              )
            );
        }

        // Clear featuredOrder for items in this save that are not in the featured map
        const featuredIds = new Set(
          Object.keys(featuredOrders as Record<string, number>).map((k) =>
            Number(k)
          )
        );
        const idsToClear = contentIds.filter(
          (id: number) => !featuredIds.has(id)
        );
        if (idsToClear.length > 0) {
          await tx
            .update(content)
            .set({ featuredOrder: null })
            .where(inArray(content.id, idsToClear));
        }
      } else {
        // No featured mapping provided: ensure all provided contentIds are unfeatured
        await tx
          .update(content)
          .set({ featuredOrder: null })
          .where(inArray(content.id, contentIds));
      }
      return Array.isArray(res) ? res.length : contentIds.length;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully tagged ${updated} articles to newsletter`,
      updated,
    });
  } catch (error) {
    console.error("Error bulk tagging content:", error);
    return NextResponse.json(
      { error: "Failed to bulk tag content" },
      { status: 500 }
    );
  }
}
