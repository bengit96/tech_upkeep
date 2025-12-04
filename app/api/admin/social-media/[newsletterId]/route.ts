import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { socialMediaPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/admin/social-media/[newsletterId] - Get all social media posts for a newsletter
export async function GET(
  request: Request,
  { params }: { params: Promise<{ newsletterId: string }> }
) {
  try {
    // Check authentication
    await requireAdmin();

    const { newsletterId } = await params;
    const newsletterDraftId = parseInt(newsletterId);

    // Get all social media posts for this newsletter
    const posts = await db
      .select()
      .from(socialMediaPosts)
      .where(eq(socialMediaPosts.newsletterDraftId, newsletterDraftId))
      .orderBy(socialMediaPosts.createdAt);

    return NextResponse.json({
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error("Error fetching social media posts:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch social media posts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
