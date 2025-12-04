import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/content/reject-all-pending
 * Reject all pending content items
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    // Update all pending items to discarded
    const result = await db
      .update(content)
      .set({ status: "discarded" })
      .where(eq(content.status, "pending"))
      .returning({ id: content.id });

    return NextResponse.json({
      success: true,
      count: result.length,
      message: `Rejected ${result.length} pending articles`
    });
  } catch (error) {
    console.error("Error rejecting all pending content:", error);
    return NextResponse.json(
      { error: "Failed to reject all pending content" },
      { status: 500 }
    );
  }
}
