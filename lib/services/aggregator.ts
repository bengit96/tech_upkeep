import axios from "axios";
import Parser from "rss-parser";
import { db } from "../db";
import {
  content,
  tags,
  contentTags,
  sources,
  scrapeBatches,
} from "../db/schema";
import { eq, or } from "drizzle-orm";
import { categorizeContent } from "./categorizer";
import {
  normalizeURL,
  generateContentHash,
  isSimilarTitle,
  calculateQualityScore,
  meetsQualityThreshold,
  isRecentEnough,
} from "../utils/content-utils";

const rssParser = new Parser();

interface AggregatedContent {
  title: string;
  summary: string;
  link: string;
  sourceType:
    | "youtube"
    | "twitter"
    | "article"
    | "reddit"
    | "substack"
    | "podcast"
    | "github"
    | "medium";
  sourceName: string;
  thumbnailUrl?: string;
  publishedAt: Date;
  engagementScore: number; // Raw engagement (upvotes, views, etc.)
}

interface AggregationStats {
  totalFetched: number;
  afterTimeFilter: number;
  afterPopularityFilter: number;
  afterDeduplication: number;
  afterQualityFilter: number;
  saved: number;
  bySource: Record<string, number>;
  apiQuotaUsed: number;
  duplicatesSkipped?: number;
  similarTitleSkipped?: number;
  lowQualitySkipped?: number;
  removedByTimeFilter?: number;
  removedByPopularityFilter?: number;
}

export class ContentAggregator {
  private stats: AggregationStats = {
    totalFetched: 0,
    afterTimeFilter: 0,
    afterPopularityFilter: 0,
    afterDeduplication: 0,
    afterQualityFilter: 0,
    saved: 0,
    bySource: {},
    apiQuotaUsed: 0,
  };

  private currentBatchId: number | null = null;
  private maxAgeHours: number = 120; // default 5 days
  private minRedditScore: number = 100;
  private minRedditUpvoteRatio: number = 0.8;
  private debug: boolean = false;

  constructor(options?: {
    maxAgeHours?: number;
    minRedditScore?: number;
    minRedditUpvoteRatio?: number;
    debug?: boolean;
  }) {
    if (options?.maxAgeHours !== undefined)
      this.maxAgeHours = options.maxAgeHours;
    if (options?.minRedditScore !== undefined)
      this.minRedditScore = options.minRedditScore;
    if (options?.minRedditUpvoteRatio !== undefined)
      this.minRedditUpvoteRatio = options.minRedditUpvoteRatio;
    if (options?.debug !== undefined) this.debug = options.debug;
  }

  private async fetchWithRetry(
    url: string,
    options?: { timeoutMs?: number; maxRetries?: number }
  ): Promise<string> {
    const timeoutMs = options?.timeoutMs ?? 15000;
    const maxRetries = options?.maxRetries ?? 2;
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          responseType: "text",
          timeout: timeoutMs,
          validateStatus: () => true,
        });
        if (response.status >= 200 && response.status < 300) {
          return response.data as string;
        }
        throw new Error(`Status code ${response.status}`);
      } catch (error) {
        lastError = error;
        // Exponential backoff: 300ms, 900ms, ...
        if (attempt < maxRetries) {
          const backoff = 300 * Math.pow(3, attempt);
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }
    throw lastError;
  }

  private sanitizeXml(xml: string): string {
    // Replace common malformed XML entities
    return xml
      .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, "&amp;")
      .replace(/<\s*\/\s*>/g, "") // remove stray close tags
      .trim();
  }

  async aggregateAll(): Promise<AggregationStats> {
    console.log("🔍 Starting enhanced content aggregation...");
    this.stats = {
      totalFetched: 0,
      afterTimeFilter: 0,
      afterPopularityFilter: 0,
      afterDeduplication: 0,
      afterQualityFilter: 0,
      saved: 0,
      bySource: {},
      apiQuotaUsed: 0,
    };

    // Create a new scrape batch
    const batchName = `Scrape ${new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    const [batch] = await db
      .insert(scrapeBatches)
      .values({
        name: batchName,
        status: "pending",
        totalItems: 0,
      })
      .returning();

    this.currentBatchId = batch.id;
    console.log(`📦 Created batch: ${batchName} (ID: ${batch.id})`);

    const allContent: AggregatedContent[] = [];

    // Aggregate from all sources in parallel
    const [
      rssContent,
      substackContent,
      podcastContent,
      redditContent,
      youtubeContent,
      githubContent,
    ] = await Promise.all([
      this.aggregateFromRSS(),
      this.aggregateFromSubstack(),
      this.aggregateFromPodcasts(),
      this.aggregateFromReddit(),
      this.aggregateFromYouTube(),
      this.aggregateFromGitHubTrending(),
    ]);

    allContent.push(
      ...rssContent,
      ...substackContent,
      ...podcastContent,
      ...redditContent,
      ...youtubeContent,
      ...githubContent
    );
    if (this.debug) {
      console.log("📦 Raw fetched sample:", allContent.slice(0, 3));
    }
    this.stats.totalFetched = allContent.length;

    console.log(`📊 Total fetched: ${allContent.length} items`);

    const countByType = (items: AggregatedContent[]) =>
      items.reduce<Record<string, number>>((acc, i) => {
        acc[i.sourceType] = (acc[i.sourceType] || 0) + 1;
        return acc;
      }, {});
    console.log("   - By type (raw):", countByType(allContent));

    // Apply filters
    const timeFiltered = this.applyTimeFilter(allContent);
    this.stats.afterTimeFilter = timeFiltered.length;
    console.log(`⏰ After time filter: ${timeFiltered.length} items`);
    this.stats.removedByTimeFilter = allContent.length - timeFiltered.length;
    console.log("   - Removed by time filter:", this.stats.removedByTimeFilter);
    console.log("   - By type (after time):", countByType(timeFiltered));

    const popularityFiltered = this.applyPopularityFilter(timeFiltered);
    this.stats.afterPopularityFilter = popularityFiltered.length;
    console.log(
      `⭐ After popularity filter: ${popularityFiltered.length} items`
    );
    this.stats.removedByPopularityFilter =
      timeFiltered.length - popularityFiltered.length;
    console.log(
      "   - Removed by popularity filter:",
      this.stats.removedByPopularityFilter
    );
    console.log(
      "   - By type (after popularity):",
      countByType(popularityFiltered)
    );

    // Deduplicate and save
    let savedCount = 0;
    this.stats.duplicatesSkipped = 0;
    this.stats.similarTitleSkipped = 0;
    this.stats.lowQualitySkipped = 0;
    for (const item of popularityFiltered) {
      try {
        const saved = await this.saveContentWithDeduplication(item);
        if (saved) {
          savedCount++;
          this.stats.bySource[item.sourceType] =
            (this.stats.bySource[item.sourceType] || 0) + 1;
        }
      } catch (error) {
        console.error(`Error saving content: ${item.title}`, error);
      }
    }

    this.stats.saved = savedCount;

    // Update batch with total items
    if (this.currentBatchId) {
      await db
        .update(scrapeBatches)
        .set({ totalItems: savedCount })
        .where(eq(scrapeBatches.id, this.currentBatchId));
    }

    console.log(`✅ Aggregation complete!`);
    console.log(`   - Batch ID: ${this.currentBatchId}`);
    console.log(`   - Saved: ${this.stats.saved} items`);
    console.log(`   - By source:`, this.stats.bySource);
    console.log(
      `   - YouTube API quota used: ${this.stats.apiQuotaUsed} units`
    );
    console.log("   - Skipped (duplicates):", this.stats.duplicatesSkipped);
    console.log(
      "   - Skipped (similar titles):",
      this.stats.similarTitleSkipped
    );
    console.log("   - Skipped (low quality):", this.stats.lowQualitySkipped);

    return this.stats;
  }

  /**
   * Aggregate from traditional RSS feeds (blogs and RSS sources)
   */
  private async aggregateFromRSS(): Promise<AggregatedContent[]> {
    console.log("📰 Fetching RSS feeds...");
    const results: AggregatedContent[] = [];
    let failures = 0;

    // Fetch active blog and RSS sources from database
    const rssFeeds = await db
      .select()
      .from(sources)
      .where(eq(sources.isActive, true));

    const blogSources = rssFeeds.filter(
      (s) => s.type === "blog" || s.type === "rss"
    );

    for (const feed of blogSources) {
      try {
        console.log(feed.url);
        // Fetch raw XML with timeout/retry, then parse
        const xml = await this.fetchWithRetry(feed.url, {
          timeoutMs: 15000,
          maxRetries: 2,
        });
        const parsed = await rssParser.parseString(this.sanitizeXml(xml));

        for (const item of parsed.items.slice(0, 10)) {
          if (!item.link || !item.title) continue;

          // Try multiple date fields in order of preference
          let publishedAt: Date;
          if (item.isoDate) {
            publishedAt = new Date(item.isoDate);
          } else if (item.pubDate) {
            publishedAt = new Date(item.pubDate);
          } else {
            const maybeItem = item as unknown as {
              published?: string;
              updated?: string;
            };
            if (maybeItem.published) {
              publishedAt = new Date(maybeItem.published);
            } else if (maybeItem.updated) {
              publishedAt = new Date(maybeItem.updated);
            } else {
              // Log warning when falling back to current time
              console.warn(
                `  ⚠️  No date found for article from ${feed.name}: ${item.title.substring(0, 50)}...`
              );
              publishedAt = new Date();
            }
          }

          // Detect Medium articles
          const isMedium =
            item.link.includes("medium.com") || item.link.includes("/@");

          results.push({
            title: item.title,
            summary: item.contentSnippet || item.summary || item.title,
            link: item.link,
            sourceType: isMedium ? "medium" : "article",
            sourceName: feed.name,
            publishedAt,
            engagementScore: 0, // Will be enhanced for HN later
          });
        }

        console.log(
          `  ✓ ${feed.name}: ${Math.min(parsed.items.length, 10)} items`
        );
      } catch (error) {
        failures++;
        console.warn(`  ⚠️  RSS issue for ${feed.name}:`, error);
      }
    }

    // Summary logging
    const bySourceName = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.sourceName] = (acc[r.sourceName] || 0) + 1;
      return acc;
    }, {});
    console.log("📰 RSS total:", results.length, "items");
    if (failures > 0) console.log(`  ⚠️  RSS failures: ${failures}`);
    if (this.debug) console.log("📰 RSS by source:", bySourceName);

    // Enhance Hacker News items with scores
    await this.enhanceHackerNewsScores(results);

    return results;
  }

  /**
   * Enhance Hacker News items with actual scores from HN API
   */
  private async enhanceHackerNewsScores(
    items: AggregatedContent[]
  ): Promise<void> {
    const hnItems = items.filter((item) => item.sourceName === "Hacker News");

    for (const item of hnItems) {
      try {
        // Extract HN item ID from URL
        const match = item.link.match(/id=(\d+)/);
        if (match) {
          const itemId = match[1];
          const response = await axios.get(
            `https://hacker-news.firebaseio.com/v0/item/${itemId}.json`
          );
          if (response.data && response.data.score) {
            item.engagementScore = response.data.score;
          }
        }
      } catch (error) {
        console.error(`  ✗ Error enhancing HN score for ${item.title}:`, error);
        // Silently fail, keep default score
      }
    }
  }

  /**
   * Aggregate from Substack newsletters
   */
  private async aggregateFromSubstack(): Promise<AggregatedContent[]> {
    console.log("📮 Fetching Substack newsletters...");
    const results: AggregatedContent[] = [];
    let failures = 0;

    // Fetch active substack sources from database
    const allSources = await db
      .select()
      .from(sources)
      .where(eq(sources.isActive, true));

    const substackFeeds = allSources.filter((s) => s.type === "substack");

    for (const feed of substackFeeds) {
      console.log(feed.url);
      try {
        const xml = await this.fetchWithRetry(feed.url, {
          timeoutMs: 15000,
          maxRetries: 2,
        });
        const parsed = await rssParser.parseString(this.sanitizeXml(xml));

        for (const item of parsed.items.slice(0, 5)) {
          if (!item.link || !item.title) continue;

          results.push({
            title: item.title,
            summary: item.contentSnippet || item.summary || item.title,
            link: item.link,
            sourceType: "substack",
            sourceName: feed.name,
            publishedAt: item.isoDate
              ? new Date(item.isoDate)
              : item.pubDate
                ? new Date(item.pubDate)
                : new Date(),
            engagementScore: 0, // Substack doesn't expose metrics via RSS
          });
        }

        console.log(
          `  ✓ ${feed.name}: ${Math.min(parsed.items.length, 5)} posts`
        );
      } catch (error) {
        failures++;
        console.warn(`  ⚠️  Substack issue for ${feed.name}:`, error);
      }
    }

    // Summary logging
    const bySourceName = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.sourceName] = (acc[r.sourceName] || 0) + 1;
      return acc;
    }, {});
    console.log("📮 Substack total:", results.length, "posts");
    if (failures > 0) console.log(`  ⚠️  Substack failures: ${failures}`);
    if (this.debug) console.log("📮 Substack by source:", bySourceName);

    return results;
  }

  /**
   * Aggregate from podcast RSS feeds
   */
  private async aggregateFromPodcasts(): Promise<AggregatedContent[]> {
    console.log("🎙️ Fetching podcasts...");
    const results: AggregatedContent[] = [];
    let failures = 0;

    // Fetch active podcast sources from database
    const allSources = await db
      .select()
      .from(sources)
      .where(eq(sources.isActive, true));

    const podcastFeeds = allSources.filter((s) => s.type === "podcast");

    for (const feed of podcastFeeds) {
      try {
        const xml = await this.fetchWithRetry(feed.url, {
          timeoutMs: 15000,
          maxRetries: 2,
        });
        const parsed = await rssParser.parseString(this.sanitizeXml(xml));

        for (const item of parsed.items.slice(0, 3)) {
          if (!item.link || !item.title) continue;

          // Try to get thumbnail from iTunes image or enclosure
          let thumbnailUrl: string | undefined;
          if (parsed.itunes?.image) {
            thumbnailUrl = parsed.itunes.image;
          } else if (item.itunes?.image) {
            thumbnailUrl = item.itunes.image;
          }

          results.push({
            title: item.title,
            summary: item.contentSnippet || item.summary || item.title,
            link: item.link,
            sourceType: "podcast",
            sourceName: feed.name,
            thumbnailUrl,
            publishedAt: item.isoDate
              ? new Date(item.isoDate)
              : item.pubDate
                ? new Date(item.pubDate)
                : new Date(),
            engagementScore: 0, // Podcasts don't expose metrics via RSS
          });
        }

        console.log(
          `  ✓ ${feed.name}: ${Math.min(parsed.items.length, 3)} episodes`
        );
      } catch (error) {
        failures++;
        console.warn(`  ⚠️  Podcast issue for ${feed.name}:`, error);
      }
    }

    console.log("🎙️ Podcasts total:", results.length, "episodes");
    if (failures > 0) console.log(`  ⚠️  Podcast failures: ${failures}`);
    return results;
  }

  /**
   * Aggregate from Reddit using JSON API with popularity filtering
   */
  private async aggregateFromReddit(): Promise<AggregatedContent[]> {
    console.log("🤖 Fetching Reddit posts...");
    const results: AggregatedContent[] = [];

    // Fetch active reddit sources from database
    const allSources = await db
      .select()
      .from(sources)
      .where(eq(sources.isActive, true));

    const redditSources = allSources.filter((s) => s.type === "reddit");

    for (const source of redditSources) {
      try {
        // Parse metadata to get subreddit name
        const metadata = source.metadata ? JSON.parse(source.metadata) : {};
        const sub = metadata.subreddit || source.name.replace("r/", "");

        const response = await axios.get(
          `https://www.reddit.com/r/${sub}/hot.json?limit=25`,
          {
            headers: { "User-Agent": "TechUpkeep/1.0" },
          }
        );

        const posts = response.data.data.children;
        let postCount = 0;

        for (const post of posts) {
          const data = post.data;

          // Filter by engagement
          if (data.score < this.minRedditScore) continue;
          if (data.upvote_ratio < this.minRedditUpvoteRatio) continue;

          // Skip stickied posts
          if (data.stickied) continue;

          // Determine final link
          const finalLink = data.url.startsWith("http")
            ? data.url
            : `https://reddit.com${data.permalink}`;

          // Check if link actually goes to reddit.com or is an external redirect
          const isActualRedditLink =
            finalLink.includes("reddit.com") || finalLink.includes("redd.it");

          // Extract domain from external links
          let sourceName = source.name;
          let sourceType: "reddit" | "article" | "medium" = "reddit";

          if (!isActualRedditLink) {
            try {
              const url = new URL(finalLink);
              const hostname = url.hostname.replace("www.", "");

              // Detect Medium articles
              if (hostname.includes("medium.com") || finalLink.includes("/@")) {
                sourceType = "medium";
                sourceName = hostname;
              } else {
                sourceType = "article";
                sourceName = hostname;
              }
            } catch {
              // If URL parsing fails, fallback to article with domain extraction
              sourceType = "article";
              sourceName =
                finalLink.split("/")[2]?.replace("www.", "") || `Reddit/${sub}`;
            }
          }

          results.push({
            title: data.title,
            summary: data.selftext?.slice(0, 500) || data.title,
            link: finalLink,
            sourceType: sourceType,
            sourceName: sourceName,
            thumbnailUrl:
              data.thumbnail && data.thumbnail.startsWith("http")
                ? data.thumbnail
                : undefined,
            publishedAt: new Date(data.created_utc * 1000),
            engagementScore: data.score,
          });
          postCount++;
        }

        console.log(`  ✓ ${source.name}: ${postCount} posts`);
      } catch (error) {
        console.error(`  ✗ Error fetching ${source.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Aggregate from YouTube using curated technical channels
   */
  private async aggregateFromYouTube(): Promise<AggregatedContent[]> {
    console.log("🎥 Fetching YouTube videos...");
    const results: AggregatedContent[] = [];

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.log("  ⚠️  YouTube API key not configured, skipping...");
      return results;
    }

    // Fetch active YouTube sources from database
    const allSources = await db
      .select()
      .from(sources)
      .where(eq(sources.isActive, true));

    const youtubeChannels = allSources.filter((s) => s.type === "youtube");

    // Fetch latest videos from technical channels
    for (const channel of youtubeChannels) {
      try {
        // Parse metadata to get channelId
        const metadata = channel.metadata ? JSON.parse(channel.metadata) : {};
        const channelId = metadata.channelId;

        if (!channelId) {
          console.error(`  ✗ No channelId in metadata for ${channel.name}`);
          continue;
        }

        const response = await axios.get(
          "https://www.googleapis.com/youtube/v3/search",
          {
            params: {
              key: apiKey,
              channelId: channelId,
              part: "snippet",
              order: "date",
              maxResults: 3,
              type: "video",
            },
          }
        );

        this.stats.apiQuotaUsed += 100; // Each search costs 100 units

        for (const item of response.data.items) {
          // Get video statistics
          const statsResponse = await axios.get(
            "https://www.googleapis.com/youtube/v3/videos",
            {
              params: {
                key: apiKey,
                id: item.id.videoId,
                part: "statistics",
              },
            }
          );

          this.stats.apiQuotaUsed += 1;

          const stats = statsResponse.data.items[0]?.statistics;
          const viewCount = stats ? parseInt(stats.viewCount) : 0;

          results.push({
            title: item.snippet.title,
            summary: item.snippet.description.slice(0, 500),
            link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            sourceType: "youtube",
            sourceName: channel.name,
            thumbnailUrl: item.snippet.thumbnails?.medium?.url,
            publishedAt: new Date(item.snippet.publishedAt),
            engagementScore: viewCount,
          });
        }

        console.log(
          `  ✓ ${channel.name}: ${response.data.items.length} videos`
        );
      } catch (error) {
        console.error(
          `  ✗ Error fetching YouTube channel ${channel.name}:`,
          error
        );
      }
    }

    console.log(
      `  ✓ YouTube total: ${results.length} videos (${this.stats.apiQuotaUsed} quota units)`
    );

    return results;
  }

  /**
   * Aggregate from GitHub Trending repositories
   */
  private async aggregateFromGitHubTrending(): Promise<AggregatedContent[]> {
    console.log("⭐ Fetching GitHub Trending repos...");
    const results: AggregatedContent[] = [];

    try {
      // Using GitHub trending scraper API (no auth required)
      const response = await axios.get(
        "https://api.github.com/search/repositories",
        {
          params: {
            q: `created:>${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}`,
            sort: "stars",
            order: "desc",
            per_page: 10,
          },
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "TechUpkeep/1.0",
          },
        }
      );

      const repos = response.data.items;

      for (const repo of repos) {
        // Only include repos with significant traction
        if (repo.stargazers_count < 50) continue;

        results.push({
          title: `${repo.full_name}: ${repo.description || repo.name}`,
          summary: `${repo.description || "No description provided"}. ${repo.language ? `Written in ${repo.language}.` : ""} ⭐ ${repo.stargazers_count.toLocaleString()} stars, 🍴 ${repo.forks_count.toLocaleString()} forks.`,
          link: repo.html_url,
          sourceType: "github",
          sourceName: "GitHub Trending",
          publishedAt: new Date(repo.created_at),
          engagementScore: repo.stargazers_count,
        });
      }

      console.log(`  ✓ GitHub Trending: ${results.length} repositories`);
    } catch (error) {
      console.error("  ✗ Error fetching GitHub trending:", error);
    }

    return results;
  }

  /**
   * Filter content by time (last 5 days for Tuesday/Friday newsletter schedule)
   */
  private applyTimeFilter(items: AggregatedContent[]): AggregatedContent[] {
    return items.filter((item) =>
      isRecentEnough(item.publishedAt, this.maxAgeHours)
    );
  }

  /**
   * Filter content by popularity thresholds
   */
  private applyPopularityFilter(
    items: AggregatedContent[]
  ): AggregatedContent[] {
    return items.filter((item) => {
      switch (item.sourceType) {
        case "reddit":
          return item.engagementScore >= 100;
        case "article":
          // For Hacker News, require 30+ points
          if (item.sourceName === "Hacker News") {
            return item.engagementScore >= 30;
          }
          // Other articles from reputable sources pass by default
          return true;
        case "substack":
        case "podcast":
          // Curated sources, all pass
          return true;
        default:
          return true;
      }
    });
  }

  /**
   * Save content with multi-layer deduplication and quality scoring
   * Skips articles that are already tagged to newsletters
   */
  private async saveContentWithDeduplication(
    item: AggregatedContent
  ): Promise<boolean> {
    // Generate deduplication identifiers
    const normalizedUrl = normalizeURL(item.link);
    const contentHash = generateContentHash(item.title, item.summary);

    // Check for duplicates (including articles already in newsletters)
    const existing = await db
      .select()
      .from(content)
      .where(
        or(
          eq(content.link, item.link),
          eq(content.normalizedUrl, normalizedUrl),
          eq(content.contentHash, contentHash)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // If article exists and is already tagged to a newsletter, skip it
      if (existing[0].newsletterDraftId !== null) {
        console.log(
          `  ⏭️  Skipping (already in newsletter): ${item.title.slice(0, 60)}...`
        );
        return false;
      }
      // Otherwise it's a duplicate by URL/hash
      return false; // Duplicate found
    }

    // Check for similar titles in recent content
    const recentContent = await db
      .select()
      .from(content)
      .orderBy(content.createdAt)
      .limit(100);

    for (const existingItem of recentContent) {
      if (isSimilarTitle(item.title, existingItem.title, 0.85)) {
        return false; // Similar title found
      }
    }

    // Calculate quality score
    const qualityScore = calculateQualityScore({
      sourceType: item.sourceType,
      sourceName: item.sourceName,
      engagementScore: item.engagementScore,
      publishedAt: item.publishedAt,
      title: item.title,
      summary: item.summary,
    });

    // Check if meets quality threshold
    if (!meetsQualityThreshold(qualityScore, 50)) {
      return false; // Quality too low
    }

    this.stats.afterQualityFilter++;

    // Categorize and tag the content
    const { categoryId, tagNames } = await categorizeContent(
      item.title,
      item.summary
    );

    // Insert content with status = pending (for manual curation)
    const [inserted] = await db
      .insert(content)
      .values({
        title: item.title,
        summary: item.summary.slice(0, 500),
        link: item.link,
        normalizedUrl,
        contentHash,
        sourceType: item.sourceType,
        sourceName: item.sourceName,
        thumbnailUrl: item.thumbnailUrl,
        categoryId,
        batchId: this.currentBatchId,
        publishedAt: item.publishedAt,
        engagementScore: item.engagementScore,
        qualityScore,
        status: "pending", // All new content starts as pending
      })
      .returning();

    // Add tags
    if (tagNames.length > 0) {
      for (const tagName of tagNames) {
        let [tag] = await db
          .select()
          .from(tags)
          .where(eq(tags.name, tagName))
          .limit(1);

        if (!tag) {
          [tag] = await db
            .insert(tags)
            .values({
              name: tagName,
              slug: tagName.toLowerCase().replace(/\s+/g, "-"),
            })
            .returning();
        }

        await db.insert(contentTags).values({
          contentId: inserted.id,
          tagId: tag.id,
        });
      }
    }

    return true;
  }

  /**
   * Get aggregation statistics
   */
  getStats(): AggregationStats {
    return this.stats;
  }
}
