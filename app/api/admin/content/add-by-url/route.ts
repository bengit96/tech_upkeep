import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, sources } from "@/lib/db/schema";
import { categorizeContent } from "@/lib/services/categorizer";
import {
  normalizeURL,
  generateContentHash,
  isSimilarTitle,
} from "@/lib/utils/content-utils";
import { eq, or } from "drizzle-orm";
import axios from "axios";
import * as cheerio from "cheerio";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/content/add-by-url
 * Manually add an article by URL with metadata extraction
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Check for duplicates
    const normalizedUrl = normalizeURL(url);
    const existing = await db
      .select()
      .from(content)
      .where(
        or(
          eq(content.link, url),
          eq(content.normalizedUrl, normalizedUrl)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This article already exists in your content" },
        { status: 409 }
      );
    }

    // Fetch page metadata
    let pageData: {
      title: string;
      description: string;
      sourceType: string;
      sourceName: string;
    };

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TechUpkeep/1.0)",
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);

      // Extract metadata
      const title =
        $('meta[property="og:title"]').attr("content") ||
        $("title").text() ||
        parsedUrl.hostname;

      const description =
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        $("p").first().text().slice(0, 300) ||
        "No description available";

      // Determine source type based on URL
      const hostname = parsedUrl.hostname.toLowerCase();
      let sourceType = "article";
      let sourceName = parsedUrl.hostname;

      if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
        sourceType = "youtube";
        sourceName = "YouTube";
      } else if (hostname.includes("medium.com")) {
        sourceType = "medium";
        sourceName = "Medium";
      } else if (hostname.includes("substack.com")) {
        sourceType = "substack";
        sourceName = hostname.split(".")[0] || "Substack";
      } else if (hostname.includes("reddit.com")) {
        sourceType = "reddit";
        sourceName = "Reddit";
      } else if (hostname.includes("github.com")) {
        sourceType = "github";
        sourceName = "GitHub";
      } else {
        // Extract site name from various meta tags
        sourceName =
          $('meta[property="og:site_name"]').attr("content") ||
          $('meta[name="application-name"]').attr("content") ||
          parsedUrl.hostname.replace("www.", "");
      }

      pageData = {
        title: title.trim(),
        description: description.trim(),
        sourceType,
        sourceName,
      };
    } catch (error) {
      console.error("Error fetching page metadata:", error);
      // Fallback to basic URL info
      pageData = {
        title: parsedUrl.hostname,
        description: "Manually added article",
        sourceType: "article",
        sourceName: parsedUrl.hostname.replace("www.", ""),
      };
    }

    // Check for similar titles
    const recentContent = await db
      .select()
      .from(content)
      .orderBy(content.createdAt)
      .limit(100);

    for (const existingItem of recentContent) {
      if (isSimilarTitle(pageData.title, existingItem.title, 0.85)) {
        return NextResponse.json(
          { error: "A similar article already exists in your content" },
          { status: 409 }
        );
      }
    }

    // Check if source exists, if not create it
    let sourceId: number | null = null;
    const [existingSource] = await db
      .select()
      .from(sources)
      .where(eq(sources.url, url))
      .limit(1);

    if (existingSource) {
      sourceId = existingSource.id;
    } else {
      // Create new source
      const [newSource] = await db
        .insert(sources)
        .values({
          name: pageData.sourceName,
          slug: pageData.sourceName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          type: pageData.sourceType as any,
          url: url,
          isActive: true,
          description: `Manually added: ${pageData.sourceName}`,
        })
        .returning();
      sourceId = newSource.id;
    }

    // Categorize content
    const { categoryId } = await categorizeContent(
      pageData.title,
      pageData.description
    );

    // Generate content hash
    const contentHash = generateContentHash(pageData.title, pageData.description);

    // Insert content as pending
    const [inserted] = await db
      .insert(content)
      .values({
        title: pageData.title,
        summary: pageData.description.slice(0, 500),
        link: url,
        normalizedUrl,
        contentHash,
        sourceType: pageData.sourceType as any,
        sourceName: pageData.sourceName,
        sourceId,
        categoryId,
        publishedAt: new Date(), // Use current date for manually added articles
        engagementScore: 0,
        qualityScore: 75, // Give manually added articles a decent quality score
        status: "pending",
      })
      .returning();

    return NextResponse.json({
      success: true,
      content: inserted,
      message: `Article added: ${pageData.title}`,
    });
  } catch (error) {
    console.error("Error adding article by URL:", error);
    return NextResponse.json(
      { error: "Failed to add article. Please check the URL and try again." },
      { status: 500 }
    );
  }
}
