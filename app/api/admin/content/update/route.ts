import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * Update content item (summary, title, etc.)
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { contentId, summary, title } = await request.json();

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (summary !== undefined) updates.summary = summary;
    if (title !== undefined) updates.title = title;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update content
    await db
      .update(content)
      .set(updates)
      .where(eq(content.id, contentId));

    return NextResponse.json({
      message: "Content updated successfully",
    });
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}
