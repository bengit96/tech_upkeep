import { db } from "@/lib/db";
import { outreachCampaigns, outreachProspects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface TwitterUser {
  id: string;
  username: string;
  name: string;
  bio?: string;
  location?: string;
  url?: string;
  followers_count?: number;
  following_count?: number;
  tweet_count?: number;
}

/**
 * Scrape Twitter/X users who talk about specific programming topics
 * Uses Twitter API v2 (requires Bearer Token)
 */
async function fetchTwitterDevelopers(
  language: string,
  level: string,
  limit: number = 50
) {
  const prospects: Array<{
    name: string | null;
    email: string | null;
    twitterUrl: string | null;
    bio: string | null;
    stack: string | null;
    level: string | null;
    location: string | null;
  }> = [];

  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;

    if (!bearerToken) {
      throw new Error(
        "Twitter API credentials not configured. Please set TWITTER_BEARER_TOKEN in your .env file."
      );
    }

    // Build search query based on language and level
    let query = `${language} developer -is:retweet lang:en`;

    // Add level-specific keywords
    if (level === "junior") {
      query += " (junior OR beginner OR learning OR started)";
    } else if (level === "mid") {
      query += " (mid-level OR intermediate OR engineer)";
    } else if (level === "senior") {
      query += " (senior OR lead OR principal OR staff OR architect)";
    }

    // Twitter API v2 - Search recent tweets
    const searchUrl = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(
      query
    )}&max_results=100&tweet.fields=author_id&expansions=author_id&user.fields=id,username,name,description,location,public_metrics,url`;

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twitter API error:", response.status, errorText);

      if (response.status === 401) {
        throw new Error(
          "Twitter API authentication failed. Please check your TWITTER_BEARER_TOKEN."
        );
      } else if (response.status === 429) {
        throw new Error(
          "Twitter API rate limit exceeded. Please try again later."
        );
      }

      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.includes?.users || data.includes.users.length === 0) {
      console.log("No Twitter users found for query:", query);
      return prospects;
    }

    // Extract unique users
    const users = data.includes.users as TwitterUser[];
    const uniqueUsers = Array.from(
      new Map(users.map((user) => [user.id, user])).values()
    );

    // Process users
    for (const user of uniqueUsers.slice(0, limit)) {
      // Infer level from bio and followers
      let inferredLevel = level !== "all" ? level : null;
      if (level === "all") {
        const bioLower = (user.bio || "").toLowerCase();
        if (
          bioLower.includes("senior") ||
          bioLower.includes("lead") ||
          bioLower.includes("principal") ||
          (user.followers_count && user.followers_count > 1000)
        ) {
          inferredLevel = "senior";
        } else if (
          bioLower.includes("junior") ||
          bioLower.includes("beginner") ||
          bioLower.includes("learning") ||
          (user.followers_count && user.followers_count < 100)
        ) {
          inferredLevel = "junior";
        } else {
          inferredLevel = "mid";
        }
      }

      prospects.push({
        name: user.name || user.username,
        email: null, // Twitter doesn't expose emails
        twitterUrl: `https://twitter.com/${user.username}`,
        bio: user.bio || null,
        stack: language,
        level: inferredLevel,
        location: user.location || null,
      });
    }

    return prospects;
  } catch (error) {
    console.error("Error fetching Twitter users:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, limit = 50 } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Get campaign details
    const [campaign] = await db
      .select()
      .from(outreachCampaigns)
      .where(eq(outreachCampaigns.id, campaignId));

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.target !== "twitter") {
      return NextResponse.json(
        { error: "This endpoint only supports Twitter campaigns" },
        { status: 400 }
      );
    }

    // Scrape Twitter users
    const prospects = await fetchTwitterDevelopers(
      campaign.targetLanguage || "javascript",
      campaign.targetLevel || "all",
      limit
    );

    // Insert prospects into database with GLOBAL duplicate prevention
    let insertedCount = 0;
    let skippedDuplicates = 0;
    let skippedAlreadyContacted = 0;

    for (const prospect of prospects) {
      try {
        // CRITICAL: Check if prospect already exists GLOBALLY (across ALL campaigns)
        // This prevents contacting the same person multiple times

        let isDuplicate = false;
        let duplicateReason = "";

        // Check by Twitter URL (primary identifier for Twitter prospects)
        if (prospect.twitterUrl) {
          const existingByTwitter = await db
            .select()
            .from(outreachProspects)
            .where(eq(outreachProspects.twitterUrl, prospect.twitterUrl))
            .limit(1);

          if (existingByTwitter.length > 0) {
            isDuplicate = true;
            duplicateReason = `Twitter URL ${prospect.twitterUrl} already exists`;

            // Check if already contacted
            if (existingByTwitter[0].status === "contacted" ||
                existingByTwitter[0].status === "responded" ||
                existingByTwitter[0].status === "converted") {
              skippedAlreadyContacted++;
              console.log(`⚠️  SKIP: ${prospect.name} (@${prospect.twitterUrl?.split('/').pop()}) - Already contacted in another campaign`);
            } else {
              skippedDuplicates++;
              console.log(`⚠️  SKIP: ${prospect.name} - Duplicate Twitter profile`);
            }
          }
        }

        // Only insert if NOT a duplicate
        if (!isDuplicate && prospect.twitterUrl) {
          await db.insert(outreachProspects).values({
            campaignId,
            ...prospect,
            status: "pending",
          });
          insertedCount++;
          console.log(`✓ Added: ${prospect.name} (@${prospect.twitterUrl?.split('/').pop()})`);
        }
      } catch (err) {
        console.error("Error inserting prospect:", err);
      }
    }

    // Update campaign stats
    const totalProspects = await db
      .select()
      .from(outreachProspects)
      .where(eq(outreachProspects.campaignId, campaignId));

    await db
      .update(outreachCampaigns)
      .set({ totalProspects: totalProspects.length })
      .where(eq(outreachCampaigns.id, campaignId));

    return NextResponse.json({
      success: true,
      scraped: prospects.length,
      inserted: insertedCount,
      skipped: prospects.length - insertedCount,
      skippedDuplicates: skippedDuplicates,
      skippedAlreadyContacted: skippedAlreadyContacted,
      totalProspects: totalProspects.length,
    });
  } catch (error) {
    console.error("Error scraping Twitter:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to scrape Twitter",
      },
      { status: 500 }
    );
  }
}
