import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  generateSlidesFromBlogPost,
  BlogPostData,
} from "@/lib/services/slide-generator";
import { screenshotBlogSection } from "@/lib/services/screenshot-section";

/**
 * POST /api/admin/slides/generate
 * Generate TikTok slides from a blog post
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blogPostId, keyPoints, sections } = body;

    if (!blogPostId) {
      return NextResponse.json(
        { error: "Missing required field: blogPostId" },
        { status: 400 }
      );
    }
    if (
      (!sections || sections.length === 0) &&
      (!keyPoints || keyPoints.length === 0)
    ) {
      return NextResponse.json(
        { error: "Provide either sections or keyPoints" },
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

    // If sections are provided, capture screenshots to preserve design
    let sectionsWithScreenshots = undefined;
    if (Array.isArray(sections) && sections.length > 0) {
      sectionsWithScreenshots = await Promise.all(
        sections.map(async (s: any) => {
          try {
            // Capture screenshot of this section to preserve exact design
            const screenshot = await screenshotBlogSection({
              slug: blogPost.slug,
              sectionIndex: s.index ?? 0,
            });

            return {
              title: String(s.title || "").slice(0, 120),
              content: String(s.content || ""),
              screenshot: screenshot, // base64 screenshot preserving design
            };
          } catch (err) {
            console.error(`Failed to screenshot section ${s.index}:`, err);
            // Fallback to blocks if screenshot fails
            return {
              title: String(s.title || "").slice(0, 120),
              content: String(s.content || ""),
              blocks: Array.isArray(s.blocks) ? s.blocks : undefined,
            };
          }
        })
      );
    }

    // Prepare blog post data for slide generation
    const blogPostData: BlogPostData = {
      title: blogPost.title,
      description: blogPost.description || undefined,
      keyPoints: keyPoints || [],
      category: blogPost.category || undefined,
      readTime: blogPost.readTime || undefined,
      sections: sectionsWithScreenshots,
    };

    // Generate slides
    const slides = await generateSlidesFromBlogPost(blogPostData, {
      brandName: "Tech Upkeep",
      website: "techupkeep.dev",
      includeIntro: true,
      includeOutro: true,
      format: "png",
    });

    // Convert buffers to base64 for JSON response
    const slidesWithBase64 = slides.map((slide) => ({
      buffer: slide.buffer.toString("base64"),
      index: slide.index,
      type: slide.type,
    }));

    return NextResponse.json({
      slides: slidesWithBase64,
      count: slides.length,
      blogPost: {
        id: blogPost.id,
        title: blogPost.title,
        slug: blogPost.slug,
      },
    });
  } catch (error: any) {
    console.error("Error generating slides:", error);

    // Check if it's a font error
    if (error.message?.includes("Font file not found")) {
      return NextResponse.json(
        {
          error:
            "Font configuration error. Please ensure Inter Bold font is available.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate slides",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
