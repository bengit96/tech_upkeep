import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/content/bulk-discard
 * Bulk discard multiple articles
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { contentIds } = body;

    if (!contentIds || !Array.isArray(contentIds)) {
      return NextResponse.json(
        { error: "contentIds array is required" },
        { status: 400 }
      );
    }

    if (contentIds.length === 0) {
      return NextResponse.json(
        { error: "No content IDs provided" },
        { status: 400 }
      );
    }

    // Bulk update all articles to discarded status
    await db
      .update(content)
      .set({
        status: "discarded",
      })
      .where(inArray(content.id, contentIds));

    return NextResponse.json({
      success: true,
      message: `Successfully discarded ${contentIds.length} articles`,
      discarded: contentIds.length,
    });
  } catch (error) {
    console.error("Error bulk discarding content:", error);
    return NextResponse.json(
      { error: "Failed to bulk discard content" },
      { status: 500 }
    );
  }
}
