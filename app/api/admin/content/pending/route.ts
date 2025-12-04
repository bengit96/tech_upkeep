import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/content/pending - Move content back to pending
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

    // Update content status to pending
    await db
      .update(content)
      .set({ status: "pending" })
      .where(eq(content.id, contentId));

    return NextResponse.json({
      success: true,
      message: "Content moved to pending successfully",
    });
  } catch (error) {
    console.error("Error moving content to pending:", error);
    return NextResponse.json(
      { error: "Failed to move content to pending" },
      { status: 500 }
    );
  }
}
