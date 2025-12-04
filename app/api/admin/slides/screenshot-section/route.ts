import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/admin/slides/screenshot-section
 * Takes screenshots of blog sections for use in slides
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blogPostId, sectionIndex } = body;

    if (!blogPostId || sectionIndex === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: blogPostId and sectionIndex" },
        { status: 400 }
      );
    }

    // Get blog post
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, blogPostId))
      .limit(1);

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set viewport for content (slightly wider for better text rendering)
    await page.setViewport({ width: 1200, height: 1600 });

    // Navigate to blog post
    const blogUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3030"}/blog/${post.slug}`;
    await page.goto(blogUrl, { waitUntil: "networkidle0" });

    // Find all h2 sections
    const sections = await page.$$eval(".prose h2", (headers) =>
      headers.map((h, idx) => ({
        index: idx,
        text: h.textContent?.trim() || "",
      }))
    );

    if (sectionIndex >= sections.length) {
      await browser.close();
      return NextResponse.json(
        { error: "Section index out of range" },
        { status: 400 }
      );
    }

    // Screenshot the section
    // Strategy: Find the h2, then capture from h2 to next h2 (or end)
    const screenshotBuffer = await page.evaluate(async (idx) => {
      const headers = Array.from(document.querySelectorAll(".prose h2"));
      const currentH2 = headers[idx];
      if (!currentH2) return null;

      // Create a temporary container
      const container = document.createElement("div");
      container.style.cssText = `
          width: 1080px;
          padding: 60px;
          background: #111827;
          color: #f9fafb;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        `;

      // Clone h2 and following elements until next h2
      let current = currentH2;
      const nextH2 = headers[idx + 1];

      while (current && current !== nextH2) {
        const clone = current.cloneNode(true) as HTMLElement;

        // Ensure proper styling for cloned elements
        if (clone.tagName === "H2") {
          clone.style.cssText =
            "font-size: 48px; font-weight: 700; color: #f9fafb; margin-bottom: 24px;";
        } else if (clone.tagName === "P") {
          clone.style.cssText =
            "font-size: 32px; line-height: 1.6; color: #d1d5db; margin-bottom: 16px;";
        } else if (clone.tagName === "UL" || clone.tagName === "OL") {
          clone.style.cssText =
            "font-size: 32px; line-height: 1.6; color: #d1d5db; margin-bottom: 16px; padding-left: 40px;";
        }

        container.appendChild(clone);
        current = current.nextElementSibling as HTMLElement;
      }

      // Append to body temporarily
      document.body.appendChild(container);

      // Get bounding box
      const rect = container.getBoundingClientRect();

      // Clean up
      document.body.removeChild(container);

      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    }, sectionIndex);

    if (!screenshotBuffer) {
      await browser.close();
      return NextResponse.json(
        { error: "Failed to capture section" },
        { status: 500 }
      );
    }

    // Instead of cloning, screenshot the actual section in place
    const screenshot = await page.screenshot({
      encoding: "base64",
      type: "png",
      clip: {
        x: 0,
        y: 0,
        width: 1080,
        height: 1920,
      },
    });

    await browser.close();

    return NextResponse.json({
      screenshot,
      sectionTitle: sections[sectionIndex].text,
    });
  } catch (err: any) {
    console.error("Screenshot error:", err);
    return NextResponse.json(
      {
        error: "Failed to capture screenshot",
        details: err.message || String(err),
      },
      { status: 500 }
    );
  }
}
