import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

/**
 * GET /api/admin/blog-posts
 * Fetch all blog posts for slide generation
 */
export async function GET(req: NextRequest) {
  try {
    // Fetch all blog posts ordered by publish date
    const posts = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        description: blogPosts.description,
        category: blogPosts.category,
        readTime: blogPosts.readTime,
      })
      .from(blogPosts)
      .orderBy(desc(blogPosts.publishedAt));

    return NextResponse.json({
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}
