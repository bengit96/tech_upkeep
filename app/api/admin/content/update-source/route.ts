import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/content/update-source
 * Update the source name (author) for a content item
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { contentId, sourceName } = await request.json();

    if (!contentId || !sourceName) {
      return NextResponse.json(
        { error: "contentId and sourceName are required" },
        { status: 400 }
      );
    }

    await db
      .update(content)
      .set({ sourceName })
      .where(eq(content.id, contentId));

    return NextResponse.json({ success: true, sourceName });
  } catch (error) {
    console.error("Error updating source name:", error);
    return NextResponse.json(
      { error: "Failed to update source name" },
      { status: 500 }
    );
  }
}
