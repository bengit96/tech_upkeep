import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { socialMediaPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PUT /api/admin/social-media/post/[id] - Update a social media post
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    await requireAdmin();

    const { id } = await params;
    const postId = parseInt(id);

    const { content, hashtags, title } = await request.json();

    // Update the post
    await db
      .update(socialMediaPosts)
      .set({
        content,
        hashtags,
        title,
        updatedAt: new Date(),
      })
      .where(eq(socialMediaPosts.id, postId));

    // Get updated post
    const [updatedPost] = await db
      .select()
      .from(socialMediaPosts)
      .where(eq(socialMediaPosts.id, postId))
      .limit(1);

    return NextResponse.json({
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error updating social media post:", error);
    return NextResponse.json(
      {
        error: "Failed to update post",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/social-media/post/[id] - Delete a social media post
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    await requireAdmin();

    const { id } = await params;
    const postId = parseInt(id);

    // Delete the post
    await db.delete(socialMediaPosts).where(eq(socialMediaPosts.id, postId));

    return NextResponse.json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting social media post:", error);
    return NextResponse.json(
      {
        error: "Failed to delete post",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
