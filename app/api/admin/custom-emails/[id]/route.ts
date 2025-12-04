import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customEmailDrafts } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/admin/custom-emails/[id] - Get specific draft
export async function GET(
  request: Request,
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
      .from(customEmailDrafts)
      .where(eq(customEmailDrafts.id, draftId))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Error fetching custom email draft:", error);
    return NextResponse.json(
      { error: "Failed to fetch email draft" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/custom-emails/[id] - Update draft
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const draftId = parseInt(params.id);
    if (isNaN(draftId)) {
      return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, subject, preheaderText, htmlContent, targetAudience, includeTracking } = body;

    if (!name || !subject || !htmlContent) {
      return NextResponse.json(
        { error: "Name, subject, and content are required" },
        { status: 400 }
      );
    }

    const [updatedDraft] = await db
      .update(customEmailDrafts)
      .set({
        name,
        subject,
        preheaderText: preheaderText || null,
        htmlContent,
        targetAudience: targetAudience ? JSON.stringify(targetAudience) : null,
        includeTracking: includeTracking ?? true,
        updatedAt: new Date(),
      })
      .where(eq(customEmailDrafts.id, draftId))
      .returning();

    if (!updatedDraft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json(updatedDraft);
  } catch (error) {
    console.error("Error updating custom email draft:", error);
    return NextResponse.json(
      { error: "Failed to update email draft" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/custom-emails/[id] - Delete draft
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const draftId = parseInt(params.id);
    if (isNaN(draftId)) {
      return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
    }

    const [deletedDraft] = await db
      .delete(customEmailDrafts)
      .where(eq(customEmailDrafts.id, draftId))
      .returning();

    if (!deletedDraft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom email draft:", error);
    return NextResponse.json(
      { error: "Failed to delete email draft" },
      { status: 500 }
    );
  }
}
