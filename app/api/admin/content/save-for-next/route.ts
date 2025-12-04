import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/content/save-for-next
 * Mark content as saved for next newsletter
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { contentId } = await request.json();

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    await db
      .update(content)
      .set({ status: "saved-for-next" })
      .where(eq(content.id, contentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving content for next newsletter:", error);
    return NextResponse.json(
      { error: "Failed to save content for next newsletter" },
      { status: 500 }
    );
  }
}
