import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getReadingTime } from "@/lib/utils/enhanced-reading-time";

// POST /api/admin/content/accept - Accept a pending content item
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { contentId } = await request.json();

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Get the content item to check if reading time needs to be calculated
    const [contentItem] = await db
      .select()
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (!contentItem) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Calculate reading time if not already set
    // This will try to fetch from the article, then fall back to summary calculation
    let readingTime = contentItem.readingTime;

    if (!readingTime) {
      console.log(`Fetching reading time for: ${contentItem.title.substring(0, 50)}...`);
      readingTime = await getReadingTime(
        contentItem.link,
        contentItem.summary,
        contentItem.readingTime
      );
      console.log(`  → Reading time: ${readingTime} min`);
    }

    // Update content status to accepted and set reading time
    await db
      .update(content)
      .set({
        status: "accepted",
        readingTime: readingTime
      })
      .where(eq(content.id, contentId));

    return NextResponse.json({
      success: true,
      message: "Content accepted successfully",
    });
  } catch (error) {
    console.error("Error accepting content:", error);
    return NextResponse.json(
      { error: "Failed to accept content" },
      { status: 500 }
    );
  }
}
