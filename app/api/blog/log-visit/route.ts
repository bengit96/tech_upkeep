import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts, blogVisits } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

// Simple in-memory rate limiting (consider Redis for production)
const visitCache = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Max 3 requests per minute per IP
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up old entries every 5 minutes

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of visitCache.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW) {
      visitCache.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

// Bot user agents to filter out
const BOT_USER_AGENTS = [
  "bot",
  "crawler",
  "spider",
  "scraper",
  "slurp",
  "archive",
  "curl",
  "wget",
  "python-requests",
  "axios",
  "postman",
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  const lowerUA = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => lowerUA.includes(bot));
}

function getClientIP(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfIP = request.headers.get("cf-connecting-ip");

  return (
    cfIP || realIP || (forwarded ? forwarded.split(",")[0].trim() : "unknown")
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cached = visitCache.get(ip);

  if (!cached || now - cached.timestamp > RATE_LIMIT_WINDOW) {
    // Reset or create new entry
    visitCache.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (cached.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  // Increment count
  cached.count++;
  return false;
}

// Hash IP for privacy
function hashIP(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(ip + process.env.JWT_SECRET || "secret")
    .digest("hex")
    .substring(0, 16); // Use first 16 chars for storage efficiency
}

// Extract slug from page path
function extractSlug(page: string): string | null {
  const match = page.match(/^\/blog\/([^\/]+)/);
  return match ? match[1] : null;
}

// Get or create blog post record
async function getOrCreateBlogPost(slug: string, page: string) {
  // Try to find existing blog post
  const existingPosts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug));

  if (existingPosts.length > 0) {
    return existingPosts[0];
  }

  // Create new blog post entry (basic info - can be updated later)
  const newPost = await db
    .insert(blogPosts)
    .values({
      slug,
      title: slug.replace(/-/g, " "), // Temporary title from slug
      publishedAt: new Date(),
    })
    .returning();

  return newPost[0];
}

async function sendToDiscord(payload: {
  page: string;
  title?: string;
  slug?: string;
  referrer: string;
  userAgent: string;
  ip: string;
  timestamp: string;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_BLOG_VISITS || "";

  // Create a readable title
  const displayTitle =
    payload.title ||
    (payload.slug
      ? payload.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Blog Visit");

  const embed = {
    title: "📰 " + displayTitle,
    color: 0x3b82f6, // Blue color
    url: `https://techupkeep.dev${payload.page}`,
    fields: [
      {
        name: "🔗 Referrer",
        value: payload.referrer || "Direct",
        inline: false,
      },
      {
        name: "🌐 IP Address",
        value: `\`${payload.ip}\``,
        inline: true,
      },
      {
        name: "🕐 Time",
        value: payload.timestamp,
        inline: true,
      },
      {
        name: "💻 User Agent",
        value: `\`${payload.userAgent.substring(0, 100)}${payload.userAgent.length > 100 ? "..." : ""}\``,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      console.error(
        "Discord webhook failed:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.error("Failed to send to Discord:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const clientIP = getClientIP(request);

    // Check rate limiting
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Get user agent
    const userAgent = request.headers.get("user-agent") || "Unknown";

    // Filter out bots
    if (isBot(userAgent)) {
      return NextResponse.json(
        { success: true, message: "Bot detected, not logged" },
        { status: 200 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { page, referrer } = body;

    // Validate required fields
    if (!page || typeof page !== "string") {
      return NextResponse.json(
        { error: "Invalid page parameter" },
        { status: 400 }
      );
    }

    // Sanitize and validate page path
    const sanitizedPage = page.substring(0, 200); // Limit length
    if (!sanitizedPage.startsWith("/blog")) {
      return NextResponse.json({ error: "Invalid page path" }, { status: 400 });
    }

    // Extract slug from page path
    const slug = extractSlug(sanitizedPage);

    // Hash IP for privacy
    const hashedIP = hashIP(clientIP);

    // Save to database
    let blogPost = null;
    if (slug) {
      try {
        // Get or create blog post
        blogPost = await getOrCreateBlogPost(slug, sanitizedPage);

        // Save visit record
        await db.insert(blogVisits).values({
          blogPostId: blogPost.id,
          page: sanitizedPage,
          referrer: (referrer || "").substring(0, 200),
          userAgent: userAgent.substring(0, 200),
          ip: hashedIP,
        });

        // Update blog post stats
        // Increment total views
        await db
          .update(blogPosts)
          .set({
            totalViews: sql`${blogPosts.totalViews} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(blogPosts.id, blogPost.id));

        // Update unique visitors count (count distinct IPs for this post)
        const uniqueCount = await db
          .select({ count: sql<number>`count(distinct ${blogVisits.ip})` })
          .from(blogVisits)
          .where(eq(blogVisits.blogPostId, blogPost.id));

        if (uniqueCount.length > 0) {
          await db
            .update(blogPosts)
            .set({
              uniqueVisitors: uniqueCount[0].count,
            })
            .where(eq(blogPosts.id, blogPost.id));
        }
      } catch (dbError) {
        console.error("Database logging error:", dbError);
        // Continue even if DB fails - don't break the user experience
      }
    }

    // Prepare Discord payload
    const payload = {
      page: sanitizedPage,
      title: blogPost?.title,
      slug: slug || undefined,
      referrer: (referrer || "").substring(0, 200),
      userAgent,
      ip: clientIP,
      timestamp: new Date().toLocaleString("en-US", {
        timeZone: "UTC",
        dateStyle: "medium",
        timeStyle: "short",
      }),
    };

    // Send to Discord asynchronously (don't wait for response)
    sendToDiscord(payload).catch((err) => {
      console.error("Discord logging error:", err);
    });

    return NextResponse.json(
      {
        success: true,
        message: "Visit logged",
        slug,
        blogPostId: blogPost?.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Blog visit logging error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
