import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterDrafts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const draftId = parseInt(params.id);
    if (isNaN(draftId)) {
      return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
    }

    const [draft] = await db
      .select()
      .from(newsletterDrafts)
      .where(eq(newsletterDrafts.id, draftId))
      .limit(1);

    if (!draft) {
      return NextResponse.json(
        { error: "Newsletter draft not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Error fetching newsletter draft:", error);
    return NextResponse.json(
      { error: "Failed to fetch newsletter draft" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/newsletters/[id]
 * Update a newsletter draft (subject, preheader, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const draftId = parseInt(params.id);

    if (isNaN(draftId)) {
      return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
    }

    const body = await request.json();
    const { subject, preheaderText } = body;

    // Check if draft exists and is not sent
    const [draft] = await db
      .select()
      .from(newsletterDrafts)
      .where(eq(newsletterDrafts.id, draftId))
      .limit(1);

    if (!draft) {
      return NextResponse.json(
        { error: "Newsletter draft not found" },
        { status: 404 }
      );
    }

    if (draft.status === "sent") {
      return NextResponse.json(
        { error: "Cannot edit a sent newsletter" },
        { status: 400 }
      );
    }

    // Update the draft
    const updates: any = { updatedAt: new Date() };
    if (subject !== undefined) updates.subject = subject;
    if (preheaderText !== undefined) updates.preheaderText = preheaderText;

    const [updated] = await db
      .update(newsletterDrafts)
      .set(updates)
      .where(eq(newsletterDrafts.id, draftId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Newsletter draft updated",
      draft: updated,
    });
  } catch (error) {
    console.error("Error updating newsletter draft:", error);
    return NextResponse.json(
      { error: "Failed to update newsletter draft" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/newsletters/[id]
 * Delete a newsletter draft
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const draftId = parseInt(params.id);

    if (isNaN(draftId)) {
      return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
    }

    // Check if draft exists and is not sent
    const [draft] = await db
      .select()
      .from(newsletterDrafts)
      .where(eq(newsletterDrafts.id, draftId))
      .limit(1);

    if (!draft) {
      return NextResponse.json(
        { error: "Newsletter draft not found" },
        { status: 404 }
      );
    }

    if (draft.status === "sent") {
      return NextResponse.json(
        { error: "Cannot delete a sent newsletter" },
        { status: 400 }
      );
    }

    // Delete the draft
    await db.delete(newsletterDrafts).where(eq(newsletterDrafts.id, draftId));

    return NextResponse.json({
      success: true,
      message: "Newsletter draft deleted",
    });
  } catch (error) {
    console.error("Error deleting newsletter draft:", error);
    return NextResponse.json(
      { error: "Failed to delete newsletter draft" },
      { status: 500 }
    );
  }
}
