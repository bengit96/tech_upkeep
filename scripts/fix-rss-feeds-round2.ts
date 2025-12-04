import { config } from "dotenv";
config();

import { db } from "../lib/db";
import { sources } from "../lib/db/schema";
import { eq } from "drizzle-orm";

// Second round of RSS feed corrections after research
const FEED_CORRECTIONS: Record<
  string,
  { url?: string; deactivate?: boolean; reason?: string }
> = {
  "Uber Engineering": {
    deactivate: true,
    reason: "Uber no longer provides RSS feed for engineering blog",
  },
  "Martin Kleppmann": {
    deactivate: true,
    reason: "Blog no longer has RSS feed",
  },
  "Svelte Blog": {
    deactivate: true,
    reason: "Svelte removed RSS feed in recent site update",
  },
  "Vercel Blog": {
    deactivate: true,
    reason: "Vercel no longer provides public RSS feed",
  },
  "Tailwind CSS Blog": {
    deactivate: true,
    reason: "Tailwind CSS blog doesn't have RSS feed",
  },
  "CodeRabbit Blog": {
    deactivate: true,
    reason: "CodeRabbit blog doesn't provide RSS feed",
  },
  "Supabase Blog": {
    deactivate: true,
    reason: "Supabase blog RSS format is not compatible with parser",
  },
  "Deno Blog": {
    deactivate: true,
    reason: "Deno blog feed has persistent XML formatting issues",
  },
  "Netflix Tech Blog": {
    deactivate: true,
    reason: "SSL certificate issue prevents reliable fetching",
  },
};

async function fixRSSFeedsRound2() {
  console.log("🔧 Applying Round 2 RSS Feed Fixes...\n");

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
      // Only deactivate if currently active
      if (source.isActive) {
        await db
          .update(sources)
          .set({ isActive: false })
          .where(eq(sources.id, source.id));

        console.log(`❌ Deactivated: ${sourceName}`);
        console.log(`   URL: ${source.url}`);
        console.log(`   Reason: ${correction.reason}\n`);
        deactivatedCount++;
      } else {
        console.log(`⏭️  Already deactivated: ${sourceName}\n`);
      }
    }
  }

  console.log("=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log(`❌ Additional feeds deactivated: ${deactivatedCount}`);
  console.log(
    `\nThese feeds have persistent issues (404, SSL, or XML parsing errors).`
  );
  console.log(
    `They can be re-enabled later if the source websites fix their RSS feeds.`
  );

  process.exit(0);
}

fixRSSFeedsRound2().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
