import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/content/untag-from-newsletter
 * Remove a content item from a newsletter (sets newsletterDraftId to null and status back to 'pending')
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { contentId } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: "contentId is required" },
        { status: 400 }
      );
    }

    // Untag the content from the newsletter
    const [updated] = await db
      .update(content)
      .set({
        newsletterDraftId: null,
        status: "pending",
      })
      .where(eq(content.id, contentId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      content: updated,
    });
  } catch (error) {
    console.error("Error untagging content from newsletter:", error);
    return NextResponse.json(
      { error: "Failed to untag content from newsletter" },
      { status: 500 }
    );
  }
}
