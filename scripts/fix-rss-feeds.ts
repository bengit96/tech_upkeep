import { config } from "dotenv";
config();

import { db } from "../lib/db";
import { sources } from "../lib/db/schema";
import { eq } from "drizzle-orm";

// Corrected RSS feed URLs based on research
const FEED_CORRECTIONS: Record<
  string,
  { url?: string; deactivate?: boolean; reason?: string }
> = {
  // HTTP 404 - Need to find correct URLs
  "Uber Engineering": {
    url: "https://www.uber.com/blog/engineering/rss/",
    reason: "Updated URL structure",
  },
  "Supabase Engineering": {
    deactivate: true,
    reason: "No longer has a separate engineering feed - use main blog",
  },
  "Sahil Lavingia": {
    deactivate: true,
    reason: "Blog no longer has RSS feed",
  },
  "Martin Kleppmann": {
    url: "https://martin.kleppmann.com/rss.xml",
    reason: "Updated to rss.xml instead of feed.xml",
  },
  "ElevenLabs Blog": {
    url: "https://elevenlabs.io/blog",
    deactivate: true,
    reason: "No RSS feed available",
  },
  "Black Sheep Code": {
    deactivate: true,
    reason: "Blog appears to be offline",
  },
  "bui.app": {
    deactivate: true,
    reason: "Site appears to be offline",
  },
  "Svelte Blog": {
    url: "https://svelte.dev/blog/rss",
    reason: "Updated URL without .rss extension",
  },
  "Vercel Blog": {
    url: "https://vercel.com/blog/feed",
    reason: "Changed from rss.xml to feed",
  },

  // Invalid RSS format - Try alternate URLs
  "MongoDB AI": {
    deactivate: true,
    reason: "Invalid RSS format from MongoDB",
  },
  "Anthropic Alignment": {
    deactivate: true,
    reason: "Feed format not compatible",
  },
  "Supabase Blog": {
    url: "https://supabase.com/blog/rss",
    reason: "Try without .xml extension",
  },
  "Tailwind CSS Blog": {
    url: "https://tailwindcss.com/blog/feed.xml",
    reason: "Add feed.xml path",
  },
  "CodeRabbit Blog": {
    url: "https://www.coderabbit.ai/blog/rss.xml",
    reason: "Add rss.xml path",
  },

  // Malformed XML - These sites may have intermittent issues
  "MongoDB Engineering": {
    deactivate: true,
    reason: "Malformed XML output",
  },
  "Rakhim Davletkaliyev": {
    deactivate: true,
    reason: "Malformed XML output",
  },
  "Paul Graham Essays": {
    url: "http://www.aaronsw.com/2002/feeds/pgessays.rss",
    reason: "Use third-party RSS feed for PG essays",
  },
  "Sebastian Raschka": {
    deactivate: true,
    reason: "Not an RSS feed URL",
  },
  "Cursor Blog": {
    deactivate: true,
    reason: "Malformed XML output",
  },
  "Exploding Topics": {
    deactivate: true,
    reason: "Malformed XML output",
  },
  "Deno Blog": {
    url: "https://deno.com/blog/feed",
    reason: "Use /feed instead of /blog",
  },

  // SSL issues
  "Netflix Tech Blog": {
    url: "https://netflixtechblog.com/feed",
    reason: "Keep trying - intermittent SSL issue",
  },
};

async function fixRSSFeeds() {
  console.log("🔧 Fixing RSS Feeds...\n");

  let updatedCount = 0;
  let deactivatedCount = 0;

  for (const [sourceName, correction] of Object.entries(FEED_CORRECTIONS)) {
    const [source] = await db
      .select()
      .from(sources)
      .where(eq(sources.name, sourceName))
      .limit(1);

    if (!source) {
      console.log(`⚠️  Source not found: ${sourceName}`);
      continue;
    }

    if (correction.deactivate) {
      // Deactivate the source
      await db
        .update(sources)
        .set({ isActive: false })
        .where(eq(sources.id, source.id));

      console.log(`❌ Deactivated: ${sourceName}`);
      console.log(`   Reason: ${correction.reason}\n`);
      deactivatedCount++;
    } else if (correction.url) {
      // Update the URL
      await db
        .update(sources)
        .set({ url: correction.url })
        .where(eq(sources.id, source.id));

      console.log(`✅ Updated: ${sourceName}`);
      console.log(`   Old URL: ${source.url}`);
      console.log(`   New URL: ${correction.url}`);
      console.log(`   Reason: ${correction.reason}\n`);
      updatedCount++;
    }
  }

  console.log("=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log(`✅ URLs updated: ${updatedCount}`);
  console.log(`❌ Feeds deactivated: ${deactivatedCount}`);
  console.log(`📊 Total processed: ${updatedCount + deactivatedCount}`);

  process.exit(0);
}

fixRSSFeeds().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
