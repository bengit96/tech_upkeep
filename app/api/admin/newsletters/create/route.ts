import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterDrafts } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/newsletters/create
 * Create a new newsletter draft
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, subject, preheaderText } = body;

    if (!name || !subject) {
      return NextResponse.json(
        { error: "Name and subject are required" },
        { status: 400 }
      );
    }

    const [draft] = await db
      .insert(newsletterDrafts)
      .values({
        name,
        subject,
        preheaderText: preheaderText || null,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      draft,
      message: "Newsletter created successfully"
    });
  } catch (error) {
    console.error("Error creating newsletter:", error);
    return NextResponse.json(
      { error: "Failed to create newsletter" },
      { status: 500 }
    );
  }
}
