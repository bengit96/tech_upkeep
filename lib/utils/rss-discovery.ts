import axios from "axios";
import * as cheerio from "cheerio";

interface RSSFeedInfo {
  url: string;
  title?: string;
  type: "rss" | "atom";
}

/**
 * Discovers RSS/Atom feeds from a website
 * Checks <link> tags and common feed URLs
 */
export async function discoverRSSFeeds(websiteUrl: string): Promise<RSSFeedInfo[]> {
  const feeds: RSSFeedInfo[] = [];
  const urlObj = new URL(websiteUrl);
  const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

  try {
    // Fetch the homepage
    const response = await axios.get(baseUrl, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TechUpkeep/1.0; +https://techupkeep.dev)",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Look for RSS/Atom feed links in <link> tags
    $('link[type="application/rss+xml"], link[type="application/atom+xml"]').each((_, elem) => {
      const href = $(elem).attr("href");
      const title = $(elem).attr("title");
      const type = $(elem).attr("type");

      if (href) {
        const feedUrl = href.startsWith("http") ? href : new URL(href, baseUrl).toString();
        feeds.push({
          url: feedUrl,
          title: title || undefined,
          type: type?.includes("atom") ? "atom" : "rss",
        });
      }
    });

    // If no feeds found in <link> tags, try common RSS feed paths
    if (feeds.length === 0) {
      const commonPaths = [
        "/feed",
        "/rss",
        "/feed.xml",
        "/rss.xml",
        "/atom.xml",
        "/feed/",
        "/rss/",
        "/blog/feed",
        "/blog/rss",
        "/blog/feed.xml",
        "/index.xml",
      ];

      for (const path of commonPaths) {
        try {
          const feedUrl = `${baseUrl}${path}`;
          const feedResponse = await axios.head(feedUrl, {
            timeout: 5000,
            validateStatus: (status) => status === 200,
          });

          if (feedResponse.status === 200) {
            const contentType = feedResponse.headers["content-type"] || "";
            if (
              contentType.includes("xml") ||
              contentType.includes("rss") ||
              contentType.includes("atom")
            ) {
              feeds.push({
                url: feedUrl,
                type: contentType.includes("atom") ? "atom" : "rss",
              });
              break; // Found one, that's enough
            }
          }
        } catch {
          // Try next path
          continue;
        }
      }
    }
  } catch (error) {
    console.error(`Error discovering RSS feeds for ${baseUrl}:`, error);
  }

  return feeds;
}

/**
 * Get the best RSS feed URL from discovered feeds
 * Prefers feeds with "feed" or "rss" in the title/URL
 */
export function getBestRSSFeed(feeds: RSSFeedInfo[]): RSSFeedInfo | null {
  if (feeds.length === 0) return null;
  if (feeds.length === 1) return feeds[0];

  // Prefer feeds with "main", "blog", or similar in title
  const preferred = feeds.find(
    (f) =>
      f.title?.toLowerCase().includes("main") ||
      f.title?.toLowerCase().includes("blog") ||
      f.title?.toLowerCase().includes("posts") ||
      f.url.includes("/feed") ||
      f.url.includes("/rss")
  );

  return preferred || feeds[0];
}
