import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customEmailDrafts } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

// GET /api/admin/custom-emails - List all email drafts
export async function GET() {
  try {
    await requireAdmin();

    const drafts = await db
      .select()
      .from(customEmailDrafts)
      .orderBy(desc(customEmailDrafts.updatedAt));

    return NextResponse.json(drafts);
  } catch (error) {
    console.error("Error fetching custom email drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch email drafts" },
      { status: 500 }
    );
  }
}

// POST /api/admin/custom-emails - Create new email draft
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, subject, preheaderText, htmlContent, targetAudience, includeTracking } = body;

    if (!name || !subject || !htmlContent) {
      return NextResponse.json(
        { error: "Name, subject, and content are required" },
        { status: 400 }
      );
    }

    const [draft] = await db
      .insert(customEmailDrafts)
      .values({
        name,
        subject,
        preheaderText: preheaderText || null,
        htmlContent,
        targetAudience: targetAudience ? JSON.stringify(targetAudience) : null,
        includeTracking: includeTracking ?? true,
        status: "draft",
      })
      .returning();

    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    console.error("Error creating custom email draft:", error);
    return NextResponse.json(
      { error: "Failed to create email draft" },
      { status: 500 }
    );
  }
}
