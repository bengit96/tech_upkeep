/**
 * TikTok Slide Generator Service
 *
 * Converts blog posts into attractive TikTok slides (1080x1920)
 * using Satori for JSX-to-image conversion
 */

import React from "react";
import satori from "satori";
import sharp from "sharp";
import { readFile, readdir } from "fs/promises";
import path from "path";
import {
  TitleSlide,
  ContentSlide,
  ListSlide,
  QuoteSlide,
  CTASlide,
  SLIDE_WIDTH,
  SLIDE_HEIGHT,
} from "./slide-templates";

// Helper to suppress Satori's z-index warnings
function suppressSatoriWarnings<T>(fn: () => T): T {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('z-index')) return; // Suppress z-index warnings
    originalWarn(...args);
  };
  try {
    return fn();
  } finally {
    console.warn = originalWarn;
  }
}

// Type definitions
export interface BlogPostData {
  title: string;
  description?: string;
  keyPoints: string[]; // 3-5 key takeaways
  category?: string;
  readTime?: string;
  sections?: Array<{
    title: string;
    content: string;
    screenshot?: string; // base64 screenshot of section
    blocks?: Array<
      | { type: "p"; content: string }
      | { type: "ul"; items: string[] }
      | { type: "ol"; items: string[] }
      | { type: "code"; content: string }
    >;
  }>; // Optional explicit sections (with screenshot or block structure)
}

export interface SlideGenerationOptions {
  brandName?: string;
  website?: string;
  includeIntro?: boolean;
  includeOutro?: boolean;
  format?: "png" | "jpeg";
  quality?: number; // 1-100 for JPEG
}

export interface GeneratedSlide {
  buffer: Buffer;
  index: number;
  type: "title" | "content" | "list" | "quote" | "cta";
}

/**
 * Extracts key points from blog post content
 * In a real implementation, this could use AI to intelligently extract points
 */
export function extractKeyPoints(content: string, count: number = 5): string[] {
  // For now, this is a simple implementation
  // You can enhance this with AI (OpenAI) to intelligently extract key points
  const paragraphs = content
    .split("\n")
    .filter((p) => p.trim().length > 50)
    .slice(0, count);

  return paragraphs.map((p) => p.trim().substring(0, 200)); // Limit to 200 chars
}

/**
 * Generates TikTok slides from a blog post
 */
export async function generateSlidesFromBlogPost(
  blogPost: BlogPostData,
  options: SlideGenerationOptions = {}
): Promise<GeneratedSlide[]> {
  const {
    brandName = "Tech Upkeep",
    website = "techupkeep.dev",
    includeIntro = true,
    includeOutro = true,
    format = "png",
    quality = 90,
  } = options;

  const slides: GeneratedSlide[] = [];
  let slideIndex = 0;

  // Load font for Satori
  const fontPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "inter-bold.ttf"
  );
  let fontData: Buffer;

  try {
    fontData = await readFile(fontPath);
  } catch (error) {
    // Fallback: use a system font or throw error
    throw new Error(
      `Font file not found at ${fontPath}. Please add Inter Bold font to public/fonts/`
    );
  }

  // Load all images in public/content and derive titles from filenames
  async function listContentImages(): Promise<
    Array<{ src: string; title: string }>
  > {
    const dirPath = path.join(process.cwd(), "public", "content");
    let files: string[] = [];
    try {
      files = (await readdir(dirPath)).filter((f) =>
        /\.(png|jpg|jpeg|webp)$/i.test(f)
      );
    } catch (_e) {
      return [];
    }

    files.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

    const results: Array<{ src: string; title: string }> = [];
    for (const filename of files) {
      try {
        const fullPath = path.join(dirPath, filename);
        const fileBuffer = await readFile(fullPath);
        const ext = filename.split(".").pop()!.toLowerCase();
        const mime =
          ext === "png"
            ? "image/png"
            : ext === "webp"
              ? "image/webp"
              : "image/jpeg";
        const src = `data:${mime};base64,${fileBuffer.toString("base64")}`;
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
        const title = decodeURIComponent(nameWithoutExt);
        results.push({ src, title });
      } catch (_err) {
        // skip unreadable files
      }
    }
    return results;
  }

  // Helper function to render slide JSX to image buffer
  async function renderSlide(
    jsx: JSX.Element,
    type: string
  ): Promise<GeneratedSlide> {
    const svg = await suppressSatoriWarnings(() =>
      satori(jsx, {
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        fonts: [
          {
            name: "Inter",
            data: fontData,
            weight: 700,
            style: "normal",
          },
        ],
      })
    );

    // Convert SVG to PNG/JPEG using Sharp
    let sharpInstance = sharp(Buffer.from(svg));

    const buffer =
      format === "jpeg"
        ? await sharpInstance.jpeg({ quality }).toBuffer()
        : await sharpInstance.png().toBuffer();

    return {
      buffer,
      index: slideIndex++,
      type: type as any,
    };
  }

  // 1. Title slide (if enabled)
  if (includeIntro) {
    const titleSlide = (
      <TitleSlide
        title={blogPost.title}
        subtitle={
          blogPost.description || `${blogPost.readTime} • ${blogPost.category}`
        }
        brandName={brandName}
      />
    );
    slides.push(await renderSlide(titleSlide, "title"));
  }

  // 2. Content slides - priority: sections with screenshots (preserves design) > images > blocks > key points
  if (blogPost.sections && blogPost.sections.length > 0) {
    for (let i = 0; i < blogPost.sections.length; i++) {
      const section = blogPost.sections[i];

      const contentSlide = (
        <ContentSlide
          title={section.title}
          content={section.content}
          number={i + 1}
          brandName={brandName}
          blocks={section.blocks}
        />
      );
      slides.push(await renderSlide(contentSlide, "content"));
    }
  } else {
    // Fallback 1: images in public/content
    const contentImages = await listContentImages();
    if (contentImages.length > 0) {
      for (let i = 0; i < contentImages.length; i++) {
        const { src, title } = contentImages[i];
        const contentSlide = (
          <ContentSlide
            title={title}
            content={""}
            number={i + 1}
            brandName={brandName}
            imageSrc={src}
          />
        );
        slides.push(await renderSlide(contentSlide, "content"));
      }
    } else {
      // Fallback 2: textual key points if no images found
      const keyPoints = blogPost.keyPoints;
      for (let i = 0; i < keyPoints.length; i++) {
        const contentSlide = (
          <ContentSlide
            title={`Key Insight ${i + 1}`}
            content={keyPoints[i]}
            number={i + 1}
            brandName={brandName}
          />
        );
        slides.push(await renderSlide(contentSlide, "content"));
      }
    }
  }

  // 3. CTA slide (if enabled)
  if (includeOutro) {
    const ctaSlide = (
      <CTASlide
        title="Subscribe for more tech insights"
        subtitle={`Visit ${website} to get our bi-weekly newsletter`}
        ctaText={`${website}`}
        brandName={brandName}
        website={website}
      />
    );
    slides.push(await renderSlide(ctaSlide, "cta"));
  }

  return slides;
}

/**
 * Generate a single custom slide (for advanced use cases)
 */
export async function generateCustomSlide(
  jsx: JSX.Element,
  options: { format?: "png" | "jpeg"; quality?: number } = {}
): Promise<Buffer> {
  const { format = "png", quality = 90 } = options;

  // Load font
  const fontPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "inter-bold.ttf"
  );
  const fontData = await readFile(fontPath);

  const svg = await suppressSatoriWarnings(() =>
    satori(jsx, {
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      fonts: [
        {
          name: "Inter",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
    })
  );

  // Convert to image
  let sharpInstance = sharp(Buffer.from(svg));

  return format === "jpeg"
    ? await sharpInstance.jpeg({ quality }).toBuffer()
    : await sharpInstance.png().toBuffer();
}

/**
 * Save slides to filesystem (for testing/download)
 */
export async function saveSlidesToDisk(
  slides: GeneratedSlide[],
  outputDir: string
): Promise<string[]> {
  const { writeFile, mkdir } = await import("fs/promises");

  // Create output directory if it doesn't exist
  await mkdir(outputDir, { recursive: true });

  const filePaths: string[] = [];

  for (const slide of slides) {
    const filename = `slide-${String(slide.index + 1).padStart(2, "0")}-${slide.type}.png`;
    const filepath = path.join(outputDir, filename);

    await writeFile(filepath, slide.buffer);
    filePaths.push(filepath);
  }

  return filePaths;
}
