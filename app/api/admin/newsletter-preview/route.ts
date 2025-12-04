import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { buildHtmlFromContent } from "@/lib/services/newsletter-builder";

// ContentWithDetails types are defined in the builder; inline interface removed.

/**
 * GET /api/admin/newsletter-preview
 * Generates newsletter preview HTML using accepted content
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    // Get only accepted content
    const acceptedContent = await db
      .select()
      .from(content)
      .where(eq(content.status, "accepted"))
      .orderBy(desc(content.publishedAt))
      .limit(100);

    if (acceptedContent.length === 0) {
      return NextResponse.json(
        { error: "No accepted content available" },
        { status: 404 }
      );
    }

    // Generate HTML using shared builder (no tracking for preview)
    const html = await buildHtmlFromContent(acceptedContent, {
      includeTracking: false,
    });

    // Return HTML as response
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error generating newsletter preview:", error);
    return NextResponse.json(
      { error: "Failed to generate newsletter preview" },
      { status: 500 }
    );
  }
}
