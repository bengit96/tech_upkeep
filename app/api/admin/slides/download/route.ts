import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateSlidesFromBlogPost, BlogPostData } from "@/lib/services/slide-generator";
import JSZip from "jszip";

/**
 * POST /api/admin/slides/download
 * Generate and download slides as a ZIP file
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blogPostId, keyPoints } = body;

    if (!blogPostId) {
      return NextResponse.json(
        { error: "Missing required field: blogPostId" },
        { status: 400 }
      );
    }

    // Fetch blog post from database
    const [blogPost] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, blogPostId))
      .limit(1);

    if (!blogPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Prepare blog post data for slide generation
    const blogPostData: BlogPostData = {
      title: blogPost.title,
      description: blogPost.description || undefined,
      keyPoints: keyPoints || [],
      category: blogPost.category || undefined,
      readTime: blogPost.readTime || undefined,
    };

    // Generate slides
    const slides = await generateSlidesFromBlogPost(blogPostData, {
      brandName: "Tech Upkeep",
      website: "techupkeep.dev",
      includeIntro: true,
      includeOutro: true,
      format: "png",
    });

    // Create ZIP file
    const zip = new JSZip();

    for (const slide of slides) {
      const filename = `slide-${String(slide.index + 1).padStart(2, "0")}-${slide.type}.png`;
      zip.file(filename, slide.buffer);
    }

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Return ZIP file
    return new NextResponse(zipBlob, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${blogPost.slug}-slides.zip"`,
      },
    });
  } catch (error: any) {
    console.error("Error downloading slides:", error);
    return NextResponse.json(
      {
        error: "Failed to generate slides for download",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
