import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  generateSlidesFromBlogPost,
  generateCustomSlide,
  type BlogPostData,
} from "@/lib/services/slide-generator";
import {
  TitleSlide,
  ContentSlide,
  CTASlide,
  ListSlide,
} from "@/lib/services/slide-templates";

interface SlideConfig {
  id: string;
  header: string;
  points: string[];
  colorTheme: string;
  imageUrl?: string;
}

/**
 * POST /api/admin/slides/generate-custom
 * Generate TikTok slides from custom configuration
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blogPostId, slides } = body as {
      blogPostId: number;
      slides: SlideConfig[];
    };

    if (!blogPostId || !slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: "Missing required fields: blogPostId and slides" },
        { status: 400 }
      );
    }

    // Fetch blog post
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

    // Generate slides using Satori
    const generatedSlides = await generateSlidesWithSatori(
      slides,
      blogPost.title
    );

    return NextResponse.json({
      slides: generatedSlides.map((slide, index) => ({
        buffer: slide.toString("base64"),
        index,
        type: index === 0 ? "hook" : index === generatedSlides.length - 1 ? "cta" : "content",
      })),
      count: generatedSlides.length,
      blogPost: {
        id: blogPost.id,
        title: blogPost.title,
        slug: blogPost.slug,
      },
    });
  } catch (error: any) {
    console.error("Error generating custom slides:", error);

    return NextResponse.json(
      {
        error: "Failed to generate slides",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Generate slide images using Satori (much faster than Puppeteer!)
 */
async function generateSlidesWithSatori(
  slides: SlideConfig[],
  blogTitle: string
): Promise<Buffer[]> {
  const generatedSlides: Buffer[] = [];

  // 1. Generate hook slide (Title slide with emoji style)
  const hookSlide = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "1080px",
        height: "1920px",
        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        padding: "100px 80px",
        color: "#ffffff",
      }}
    >
      <div style={{ display: "flex", fontSize: "140px", marginBottom: "60px" }}>👀</div>
      <div
        style={{
          display: "flex",
          fontSize: "80px",
          fontWeight: 900,
          lineHeight: 1.1,
          textAlign: "center",
          marginBottom: "40px",
        }}
      >
        Want to learn about...
      </div>
      <div
        style={{
          display: "flex",
          fontSize: "56px",
          fontWeight: 600,
          textAlign: "center",
          opacity: 0.9,
        }}
      >
        {blogTitle}?
      </div>
    </div>
  );

  const hookBuffer = await generateCustomSlide(hookSlide);
  generatedSlides.push(hookBuffer);

  // 2. Generate content slides
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const validPoints = slide.points.filter((p) => p.trim().length > 0);

    if (!slide.header.trim() || validPoints.length === 0) continue;

    // Use ListSlide for bullet points
    const contentSlide = (
      <ListSlide
        title={slide.header}
        items={validPoints}
        number={i + 1}
        brandName="Tech Upkeep"
        colorTheme={slide.colorTheme}
        imageUrl={slide.imageUrl}
      />
    );

    const buffer = await generateCustomSlide(contentSlide);
    generatedSlides.push(buffer);
  }

  // 3. Generate CTA slide
  const ctaSlide = (
    <CTASlide
      title="Stay ahead of the curve"
      subtitle="Weekly tech insights delivered"
      ctaText="techupkeep.dev"
      brandName="Tech Upkeep"
      website="techupkeep.dev"
    />
  );

  const ctaBuffer = await generateCustomSlide(ctaSlide);
  generatedSlides.push(ctaBuffer);

  return generatedSlides;
}
