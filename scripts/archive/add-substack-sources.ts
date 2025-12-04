import { db } from "./index";
import { sources } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Script to add top technology Substack newsletters to the database
 * Based on https://substack.com/top/technology
 *
 * Run with: npx tsx lib/db/add-substack-sources.ts
 */

const substackSources = [
  // From Substack Top 25 Technology
  {
    name: "The Pragmatic Engineer",
    slug: "pragmatic-engineer",
    url: "https://newsletter.pragmaticengineer.com/feed",
    description:
      "Big Tech and startups, from the inside. Engineering insights from Gergely Orosz.",
  },
  {
    name: "Chamath Palihapitiya",
    slug: "chamath",
    url: "https://chamath.substack.com/feed",
    description:
      "Tech investing and startup insights from Chamath Palihapitiya.",
  },
  {
    name: "ByteByteGo Newsletter",
    slug: "bytebytego",
    url: "https://blog.bytebytego.com/feed",
    description: "System design and architecture explained simply.",
  },
  {
    name: "Nate's Substack",
    slug: "nates-newsletter",
    url: "https://natesnewsletter.substack.com/feed",
    description: "Technology trends and analysis.",
  },
  {
    name: "The VC Corner",
    slug: "vc-corner",
    url: "https://www.thevccorner.com/feed",
    description: "Venture capital and startup ecosystem insights.",
  },
  {
    name: "Fabricated Knowledge",
    slug: "fabricated-knowledge",
    url: "https://www.fabricatedknowledge.com/feed",
    description: "Deep dives into technology and AI.",
  },
  {
    name: "Computer, Enhance!",
    slug: "computer-enhance",
    url: "https://www.computerenhance.com/feed",
    description: "Performance engineering and computer architecture.",
  },
  {
    name: "Exponential View",
    slug: "exponential-view",
    url: "https://www.exponentialview.co/feed",
    description: "Technology trends shaping the future by Azeem Azhar.",
  },
  {
    name: "Product Growth",
    slug: "product-growth",
    url: "https://www.news.aakashg.com/feed",
    description: "Product management and growth strategies.",
  },
  {
    name: "Newcomer",
    slug: "newcomer",
    url: "https://www.newcomer.co/feed",
    description: "Tech and startup news and analysis.",
  },
  {
    name: "Pirate Wires",
    slug: "pirate-wires",
    url: "https://piratewires.substack.com/feed",
    description: "Technology, culture, and Silicon Valley insights.",
  },
  {
    name: "next play",
    slug: "next-play",
    url: "https://nextplayso.substack.com/feed",
    description: "Strategic insights on tech and business.",
  },
  {
    name: "AI Report",
    slug: "ai-report",
    url: "https://www.aireport.email/feed",
    description: "Daily AI news and developments.",
  },
  {
    name: "Bismarck Brief",
    slug: "bismarck-brief",
    url: "https://brief.bismarckanalysis.com/feed",
    description: "Technology strategy and analysis.",
  },
  {
    name: "Uncharted Territories",
    slug: "uncharted-territories",
    url: "https://unchartedterritories.tomaspueyo.com/feed",
    description: "Deep analysis of technology and society by Tomas Pueyo.",
  },
  {
    name: "The Product Compass",
    slug: "product-compass",
    url: "https://www.productcompass.pm/feed",
    description: "Product management and strategy insights.",
  },
  {
    name: "Scarlet Ink",
    slug: "scarlet-ink",
    url: "https://www.scarletink.com/feed",
    description: "Technology and startup analysis.",
  },
  {
    name: "User Mag",
    slug: "user-mag",
    url: "https://www.usermag.co/feed",
    description: "User experience and product design.",
  },
  {
    name: "The GameDiscoverCo newsletter",
    slug: "gamediscoverco",
    url: "https://newsletter.gamediscover.co/feed",
    description: "Video game industry insights and analytics.",
  },
  {
    name: "Kyla's Newsletter",
    slug: "kyla-newsletter",
    url: "https://kyla.substack.com/feed",
    description: "Tech and startup insights.",
  },
  {
    name: "Read Max",
    slug: "read-max",
    url: "https://maxread.substack.com/feed",
    description: "Technology, media, and internet culture.",
  },
  {
    name: "Refactoring",
    slug: "refactoring",
    url: "https://refactoring.fm/feed",
    description: "Software engineering and developer insights.",
  },
  {
    name: "Upstarts Media",
    slug: "upstarts-media",
    url: "https://www.upstartsmedia.com/feed",
    description: "Emerging technology companies and trends.",
  },
  {
    name: "Understanding AI",
    slug: "understanding-ai",
    url: "https://www.understandingai.org/feed",
    description: "AI and machine learning explained clearly.",
  },
  {
    name: "Level Up Coding",
    slug: "level-up-coding",
    url: "https://levelup.gitconnected.com/feed",
    description: "Coding tutorials and career advice.",
  },

  // Additional requested sources
  {
    name: "OpenGovSG",
    slug: "opengovsg",
    url: "https://opengovsg.substack.com/feed",
    description: "Singapore government technology and digital transformation.",
  },
  {
    name: "Remote Branch",
    slug: "remotebranch",
    url: "https://remotebranch.substack.com/feed",
    description: "Engineering culture and remote work insights.",
  },
];

async function addSubstackSources() {
  console.log("🚀 Adding Substack technology sources to database...\n");

  let addedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const source of substackSources) {
    try {
      await db
        .insert(sources)
        .values({
          name: source.name,
          slug: source.slug,
          type: "substack",
          url: source.url,
          description: source.description,
          isActive: true,
        })
        .onConflictDoNothing({ target: sources.slug });

      // Check if it was actually added or skipped
      const existing = await db
        .select()
        .from(sources)
        .where(eq(sources.slug, source.slug))
        .limit(1);

      if (existing.length > 0) {
        console.log(`✅ Added: ${source.name}`);
        addedCount++;
      } else {
        console.log(`⏭️  Skipped (already exists): ${source.name}`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to add ${source.name}:`, error);
      errorCount++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   ✅ Added: ${addedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${substackSources.length}`);
  console.log("\n✅ Substack sources setup complete!");
}

// Run if called directly
addSubstackSources()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error adding Substack sources:", error);
    process.exit(1);
  });
