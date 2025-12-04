import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { newsletterDrafts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildHtmlForDraft } from "@/lib/services/newsletter-builder";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/newsletter-draft-preview
 * Get HTML preview of a specific newsletter draft
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const draftId = parseInt(searchParams.get("draftId") || "");

    if (isNaN(draftId)) {
      return new NextResponse("Invalid draft ID", { status: 400 });
    }

    // Build fresh HTML from current tagged content for preview
    const html = await buildHtmlForDraft(draftId, { includeTracking: false });
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error getting newsletter draft preview:", error);
    return new NextResponse("Failed to load newsletter preview", {
      status: 500,
    });
  }
}
