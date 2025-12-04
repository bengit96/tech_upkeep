import { config } from "dotenv";
config();

import axios from "axios";
import Parser from "rss-parser";
import { db } from "../lib/db";
import { sources } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const rssParser = new Parser();

interface DiagnosticResult {
  name: string;
  url: string;
  status: "success" | "error";
  error?: string;
  itemCount?: number;
  responseTime?: number;
}

async function testRSSFeed(
  name: string,
  url: string
): Promise<DiagnosticResult> {
  const startTime = Date.now();

  try {
    // Test fetch with timeout
    const response = await axios.get(url, {
      responseType: "text",
      timeout: 15000,
      validateStatus: () => true,
      headers: {
        "User-Agent": "TechUpkeep/1.0 (RSS Feed Validator)",
      },
    });

    const responseTime = Date.now() - startTime;

    // Check HTTP status
    if (response.status < 200 || response.status >= 300) {
      return {
        name,
        url,
        status: "error",
        error: `HTTP ${response.status}`,
        responseTime,
      };
    }

    // Try to parse XML
    const xml = response.data as string;
    const sanitizedXml = xml
      .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, "&amp;")
      .replace(/<\s*\/\s*>/g, "")
      .trim();

    const parsed = await rssParser.parseString(sanitizedXml);

    return {
      name,
      url,
      status: "success",
      itemCount: parsed.items.length,
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    let errorMsg = "Unknown error";
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        errorMsg = "Timeout (>15s)";
      } else if (error.code === "ENOTFOUND") {
        errorMsg = "DNS resolution failed";
      } else if (error.code === "ECONNREFUSED") {
        errorMsg = "Connection refused";
      } else if (error.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
        errorMsg = "SSL certificate error";
      } else if (error.response) {
        errorMsg = `HTTP ${error.response.status}`;
      } else if (error.message) {
        errorMsg = error.message;
      }
    } else if (error.message) {
      errorMsg = error.message;
    }

    return {
      name,
      url,
      status: "error",
      error: errorMsg,
      responseTime,
    };
  }
}

async function diagnoseAllRSS() {
  console.log("🔍 Starting RSS Feed Diagnostics...\n");

  // Fetch all active RSS/blog sources
  const allSources = await db
    .select()
    .from(sources)
    .where(eq(sources.isActive, true));

  const rssFeeds = allSources.filter(
    (s) => s.type === "blog" || s.type === "rss"
  );

  console.log(`Found ${rssFeeds.length} active RSS/blog sources\n`);

  const results: DiagnosticResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Test each feed
  for (let i = 0; i < rssFeeds.length; i++) {
    const feed = rssFeeds[i];
    process.stdout.write(
      `Testing [${i + 1}/${rssFeeds.length}] ${feed.name}... `
    );

    const result = await testRSSFeed(feed.name, feed.url);
    results.push(result);

    if (result.status === "success") {
      console.log(
        `✓ (${result.itemCount} items, ${result.responseTime}ms)`
      );
      successCount++;
    } else {
      console.log(`✗ ${result.error}`);
      errorCount++;
    }

    // Small delay to avoid overwhelming servers
    await new Promise((r) => setTimeout(r, 100));
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total feeds: ${rssFeeds.length}`);
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Errors: ${errorCount}\n`);

  // Group errors by type
  if (errorCount > 0) {
    console.log("ERRORS BY TYPE:");
    console.log("-".repeat(80));

    const errorsByType = results
      .filter((r) => r.status === "error")
      .reduce((acc, r) => {
        const errorType = r.error || "Unknown";
        if (!acc[errorType]) acc[errorType] = [];
        acc[errorType].push(r.name);
        return acc;
      }, {} as Record<string, string[]>);

    for (const [errorType, feedNames] of Object.entries(errorsByType)) {
      console.log(`\n${errorType} (${feedNames.length}):`);
      feedNames.forEach((name) => console.log(`  • ${name}`));
    }

    console.log("\n" + "=".repeat(80));
    console.log("DETAILED ERROR LIST:");
    console.log("=".repeat(80) + "\n");

    results
      .filter((r) => r.status === "error")
      .forEach((r) => {
        console.log(`❌ ${r.name}`);
        console.log(`   URL: ${r.url}`);
        console.log(`   Error: ${r.error}`);
        console.log();
      });
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

diagnoseAllRSS().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
