import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content as contentTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const newsletterDraftId = parseInt(
      searchParams.get("newsletterDraftId") || "0"
    );
    if (!newsletterDraftId) {
      return NextResponse.json(
        { error: "newsletterDraftId is required" },
        { status: 400 }
      );
    }

    const items = await db
      .select()
      .from(contentTable)
      .where(eq(contentTable.newsletterDraftId, newsletterDraftId))
      .limit(200);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error listing content:", error);
    return NextResponse.json(
      { error: "Failed to list content" },
      { status: 500 }
    );
  }
}
