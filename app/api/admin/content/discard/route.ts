import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/content/discard - Discard a pending content item
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

    // Update content status to discarded
    await db
      .update(content)
      .set({ status: "discarded" })
      .where(eq(content.id, contentId));

    return NextResponse.json({
      success: true,
      message: "Content discarded successfully",
    });
  } catch (error) {
    console.error("Error discarding content:", error);
    return NextResponse.json(
      { error: "Failed to discard content" },
      { status: 500 }
    );
  }
}
