import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Enhanced reading time calculator that:
 * 1. Tries to fetch reading time from the actual article
 * 2. Falls back to calculating from summary
 */

/**
 * Extract reading time from article webpage
 * Looks for common reading time patterns in HTML
 */
export async function fetchReadingTimeFromArticle(
  url: string
): Promise<number | null> {
  try {
    // Fetch the article HTML
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TechUpkeepBot/1.0; +https://techupkeep.dev)",
      },
      validateStatus: (status) => status < 500, // Accept redirects
    });

    if (response.status !== 200) {
      return null;
    }

    const html = response.data;
    const $ = cheerio.load(html);

    // Common patterns for reading time in HTML
    const patterns = [
      // Meta tags
      () => $('meta[property="article:reading_time"]').attr("content"),
      () => $('meta[name="twitter:data1"]').attr("content"), // Medium uses this
      () => $('meta[name="read-time"]').attr("content"),

      // Common class names and selectors
      () => $(".reading-time").text(),
      () => $(".read-time").text(),
      () => $('[class*="reading-time"]').text(),
      () => $('[class*="read-time"]').text(),
      () => $('[class*="readTime"]').text(),
      () => $('[data-reading-time]').attr("data-reading-time"),

      // Text-based search (less reliable but catches many cases)
      () => {
        const text = $("body").text();
        const match = text.match(/(\d+)\s*min(?:ute)?s?\s*read/i);
        return match ? match[1] : null;
      },
    ];

    // Try each pattern
    for (const pattern of patterns) {
      try {
        const result = pattern();
        if (result) {
          // Extract number from result
          const match = String(result).match(/(\d+)/);
          if (match) {
            const minutes = parseInt(match[1]);
            // Sanity check: reading time should be between 1 and 120 minutes
            if (minutes >= 1 && minutes <= 120) {
              console.log(`  ✓ Found reading time in article: ${minutes} min`);
              return minutes;
            }
          }
        }
      } catch (err) {
        // Continue to next pattern
        continue;
      }
    }

    // If no reading time found, try to calculate from article word count
    const articleText = $("article").text() || $("main").text() || $("body").text();
    if (articleText) {
      const words = articleText
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      const wordCount = words.length;

      // Only use this if we have substantial content (more than summary)
      if (wordCount > 300) {
        const minutes = Math.ceil(wordCount / 200);
        console.log(`  ✓ Calculated from article content: ${minutes} min (${wordCount} words)`);
        return minutes;
      }
    }

    return null;
  } catch (error) {
    // Silently fail and return null
    console.log(`  ⚠️  Could not fetch reading time from ${new URL(url).hostname}`);
    return null;
  }
}

/**
 * Calculate reading time from text (fallback)
 */
export function calculateReadingTimeMinutes(text: string): number {
  const cleanText = text.replace(/<[^>]*>/g, "");
  const words = cleanText.trim().split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Get reading time with smart fallbacks
 * 1. Try from provided metadata
 * 2. Try fetching from article
 * 3. Calculate from summary
 */
export async function getReadingTime(
  url: string,
  summary: string,
  metadataReadingTime?: number | null
): Promise<number> {
  // If we already have reading time from metadata, use it
  if (metadataReadingTime && metadataReadingTime > 0) {
    return metadataReadingTime;
  }

  // Try fetching from article
  const fetchedTime = await fetchReadingTimeFromArticle(url);
  if (fetchedTime) {
    return fetchedTime;
  }

  // Fallback to calculating from summary
  console.log(`  ℹ️  Using summary for reading time estimation`);
  return calculateReadingTimeMinutes(summary);
}
