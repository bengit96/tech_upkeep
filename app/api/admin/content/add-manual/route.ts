import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { content, categories, sources } from "@/lib/db/schema";
import { eq, or, like } from "drizzle-orm";
import axios from "axios";
import * as cheerio from "cheerio";
import { normalizeURL, generateContentHash } from "@/lib/utils/content-utils";
import { discoverRSSFeeds, getBestRSSFeed } from "@/lib/utils/rss-discovery";

interface ArticleMetadata {
  title: string;
  description: string;
  image?: string;
  siteName?: string;
}

async function fetchArticleMetadata(url: string): Promise<ArticleMetadata> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TechUpkeep/1.0; +https://techupkeep.dev)",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract Open Graph metadata (preferred)
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const ogDescription = $('meta[property="og:description"]').attr("content");
    const ogImage = $('meta[property="og:image"]').attr("content");
    const ogSiteName = $('meta[property="og:site_name"]').attr("content");

    // Fallback to Twitter Card metadata
    const twitterTitle = $('meta[name="twitter:title"]').attr("content");
    const twitterDescription = $('meta[name="twitter:description"]').attr(
      "content"
    );
    const twitterImage = $('meta[name="twitter:image"]').attr("content");

    // Fallback to standard HTML metadata
    const metaDescription = $('meta[name="description"]').attr("content");
    const htmlTitle = $("title").text();

    // Determine the best values
    const title =
      ogTitle || twitterTitle || htmlTitle || new URL(url).hostname;
    const description =
      ogDescription ||
      twitterDescription ||
      metaDescription ||
      "No description available";
    const image = ogImage || twitterImage;
    const siteName =
      ogSiteName || new URL(url).hostname.replace("www.", "");

    return {
      title: title.trim(),
      description: description.trim().substring(0, 500),
      image,
      siteName,
    };
  } catch (error) {
    console.error("Error fetching article metadata:", error);

    // Fallback: use URL hostname as basic metadata
    const urlObj = new URL(url);
    return {
      title: urlObj.hostname.replace("www.", ""),
      description: "Manually added article",
      siteName: urlObj.hostname.replace("www.", ""),
    };
  }
}

/**
 * Generate a URL-friendly slug from a source name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Check if a source exists for the given domain, and add it if not
 * Returns information about the source (existing or newly created)
 */
async function ensureSourceExists(
  websiteUrl: string
): Promise<{ source: any; isNew: boolean; feedUrl?: string }> {
  const urlObj = new URL(websiteUrl);
  const hostname = urlObj.hostname.replace("www.", "");

  // Check if source already exists (by URL or name matching the domain)
  const existingSources = await db
    .select()
    .from(sources)
    .where(
      or(
        like(sources.url, `%${hostname}%`),
        like(sources.name, `%${hostname}%`)
      )
    )
    .limit(5);

  if (existingSources.length > 0) {
    // Source exists - return the first match
    return { source: existingSources[0], isNew: false };
  }

  // Source doesn't exist - try to discover RSS feed
  console.log(`🔍 Discovering RSS feed for ${hostname}...`);
  const discoveredFeeds = await discoverRSSFeeds(websiteUrl);
  const bestFeed = getBestRSSFeed(discoveredFeeds);

  // Prepare source name and slug
  const sourceName = hostname.charAt(0).toUpperCase() + hostname.slice(1); // Capitalize first letter
  const sourceSlug = generateSlug(hostname);

  if (bestFeed) {
    // Found an RSS feed - add it as a new source
    console.log(`✅ Found RSS feed: ${bestFeed.url}`);

    const [newSource] = await db
      .insert(sources)
      .values({
        name: sourceName,
        slug: sourceSlug,
        url: bestFeed.url,
        type: "blog",
        category: "engineering", // Default category
        isActive: true,
      })
      .returning();

    return { source: newSource, isNew: true, feedUrl: bestFeed.url };
  } else {
    // No RSS feed found - still add as a source but mark as inactive
    console.log(`⚠️  No RSS feed found for ${hostname}, adding as inactive source`);

    const [newSource] = await db
      .insert(sources)
      .values({
        name: sourceName,
        slug: sourceSlug,
        url: `https://${hostname}`,
        type: "blog",
        category: "engineering",
        isActive: false, // Inactive since we don't have an RSS feed
      })
      .returning();

    return { source: newSource, isNew: true };
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { url, categorySlug } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Valid URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Check if article already exists
    const normalizedUrl = normalizeURL(url);
    const existing = await db
      .select()
      .from(content)
      .where(eq(content.normalizedUrl, normalizedUrl))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Article with this URL already exists", content: existing[0] },
        { status: 409 }
      );
    }

    // Fetch article metadata
    const metadata = await fetchArticleMetadata(url);

    // Ensure source exists (auto-discover and add RSS feed if needed)
    const sourceInfo = await ensureSourceExists(url);

    // Get category
    let categoryId: number | null = null;
    if (categorySlug) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, categorySlug))
        .limit(1);
      if (category) {
        categoryId = category.id;
      }
    }

    // If no category specified, default to "opinions-general"
    if (!categoryId) {
      const [defaultCategory] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, "opinions-general"))
        .limit(1);
      if (defaultCategory) {
        categoryId = defaultCategory.id;
      }
    }

    // Generate content hash for deduplication
    const contentHash = generateContentHash(metadata.title, metadata.description);

    // Create the content entry
    const [newContent] = await db
      .insert(content)
      .values({
        title: metadata.title,
        summary: metadata.description,
        link: url,
        normalizedUrl,
        contentHash,
        sourceType: "article",
        sourceName: metadata.siteName || parsedUrl.hostname,
        thumbnailUrl: metadata.image,
        categoryId,
        publishedAt: new Date(),
        engagementScore: 0,
        qualityScore: 50, // Default quality score for manual additions
        status: "accepted", // Manually added articles go straight to accepted
      })
      .returning();

    // Fetch the category information to return complete data
    let categoryData = null;
    if (newContent.categoryId) {
      const [cat] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, newContent.categoryId))
        .limit(1);
      if (cat) {
        categoryData = { name: cat.name, slug: cat.slug };
      }
    }

    console.log(`✅ Manually added article: ${metadata.title}`);

    // Prepare response message
    let message = "Article added successfully";
    if (sourceInfo.isNew && sourceInfo.feedUrl) {
      message += ` + New RSS source added: ${sourceInfo.source.name} (${sourceInfo.feedUrl})`;
    } else if (sourceInfo.isNew) {
      message += ` + Source added but no RSS feed found`;
    }

    return NextResponse.json({
      success: true,
      content: {
        ...newContent,
        category: categoryData,
      },
      message,
      sourceAdded: sourceInfo.isNew,
      sourceName: sourceInfo.source.name,
      sourceFeedUrl: sourceInfo.feedUrl,
    });
  } catch (error) {
    console.error("Error adding manual article:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to add article", details: message },
      { status: 500 }
    );
  }
}
