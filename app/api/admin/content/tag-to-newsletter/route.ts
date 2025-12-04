import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/content/tag-to-newsletter
 * Tag a content item to a newsletter (sets newsletterDraftId and status to 'accepted')
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { contentId, newsletterDraftId } = body;

    if (!contentId || !newsletterDraftId) {
      return NextResponse.json(
        { error: "contentId and newsletterDraftId are required" },
        { status: 400 }
      );
    }

    // Check if content is already tagged to another newsletter
    const [existingContent] = await db
      .select()
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (!existingContent) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    if (
      existingContent.newsletterDraftId &&
      existingContent.newsletterDraftId !== newsletterDraftId
    ) {
      return NextResponse.json(
        {
          error:
            "This article is already tagged to another newsletter and cannot be reassigned",
        },
        { status: 400 }
      );
    }

    // Tag the content to the newsletter
    const [updated] = await db
      .update(content)
      .set({
        newsletterDraftId,
        status: "accepted",
      })
      .where(eq(content.id, contentId))
      .returning();

    return NextResponse.json({
      success: true,
      content: updated,
    });
  } catch (error) {
    console.error("Error tagging content to newsletter:", error);
    return NextResponse.json(
      { error: "Failed to tag content to newsletter" },
      { status: 500 }
    );
  }
}
