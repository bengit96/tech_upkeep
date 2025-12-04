import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterDrafts, content } from "@/lib/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/newsletters
 * Get all newsletter drafts with article counts
 */
export async function GET() {
  try {
    await requireAdmin();
    const drafts = await db
      .select()
      .from(newsletterDrafts)
      .orderBy(desc(newsletterDrafts.createdAt));

    // Get article count for each newsletter
    const draftsWithCounts = await Promise.all(
      drafts.map(async (draft) => {
        const [result] = await db
          .select({ count: count() })
          .from(content)
          .where(eq(content.newsletterDraftId, draft.id));

        return {
          ...draft,
          articleCount: result.count,
        };
      })
    );

    return NextResponse.json({ newsletters: draftsWithCounts });
  } catch (error) {
    console.error("Error fetching newsletter drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch newsletter drafts" },
      { status: 500 }
    );
  }
}
