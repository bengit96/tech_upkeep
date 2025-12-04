import { db } from "./index";
import { sources } from "./schema";

/**
 * Script to add missing sources that were lost
 * Run with: npx tsx lib/db/add-missing-sources.ts
 */

const missingSources = [
  // YouTube Channels
  {
    name: "Andrej Karpathy",
    slug: "andrej-karpathy-youtube",
    type: "youtube",
    url: "https://www.youtube.com/@AndrejKarpathy",
    description: "AI and deep learning insights from Andrej Karpathy",
    metadata: JSON.stringify({ channelId: "UCPKKdZuZkYGK8WfJfVijp_w" }),
  },
  {
    name: "Anthropic",
    slug: "anthropic-youtube",
    type: "youtube",
    url: "https://www.youtube.com/@AnthropicAI",
    description: "AI safety and research from Anthropic",
    metadata: JSON.stringify({ channelId: "UC9oXNkiVU3QshNzr1GQMFMQ" }),
  },

  // Podcasts
  {
    name: "Lenny's Podcast",
    slug: "lennys-podcast",
    type: "podcast",
    url: "https://www.lennysnewsletter.com/podcast?format=rss",
    description: "Product, growth, and career advice for product managers",
  },
  {
    name: "Pragmatic Engineer Podcast",
    slug: "pragmatic-engineer-podcast",
    type: "podcast",
    url: "https://podcast.pragmaticengineer.com/rss",
    description: "Behind-the-scenes stories from Big Tech and startups",
  },
  {
    name: "Latent Space",
    slug: "latent-space-podcast",
    type: "podcast",
    url: "https://api.substack.com/feed/podcast/1084089.rss",
    description: "The AI Engineer podcast",
  },
  {
    name: "DevInterrupted",
    slug: "devinterrupted-podcast",
    type: "podcast",
    url: "https://feeds.simplecast.com/FqhtT5mY",
    description: "Engineering leadership and developer productivity podcast",
  },

  // Engineering Blogs
  {
    name: "Supabase Engineering",
    slug: "supabase-engineering",
    type: "blog",
    url: "https://supabase.com/blog/tags/engineering/rss.xml",
    description: "Engineering insights from Supabase",
  },
  {
    name: "Microsoft Engineering",
    slug: "microsoft-engineering",
    type: "blog",
    url: "https://devblogs.microsoft.com/engineering-at-microsoft/feed/",
    description: "Engineering at Microsoft",
  },
  {
    name: "Jane Street Tech Blog",
    slug: "jane-street-tech-blog",
    type: "blog",
    url: "https://blog.janestreet.com/feed.xml",
    description: "Technical blog from Jane Street",
  },
  {
    name: "Atlassian Engineering",
    slug: "atlassian-engineering",
    type: "blog",
    url: "https://www.atlassian.com/blog/atlassian-engineering/feed",
    description: "Engineering at Atlassian",
  },
  {
    name: "Terrateam Blog",
    slug: "terrateam-blog",
    type: "blog",
    url: "https://terrateam.io/rss.xml",
    description: "Infrastructure and DevOps insights from Terrateam",
  },
  // MongoDB doesn't provide valid RSS feeds anymore - disabled
  // {
  //   name: "MongoDB Engineering",
  //   slug: "mongodb-engineering",
  //   type: "blog",
  //   url: "https://www.mongodb.com/blog/channel/engineering/rss.xml",
  //   description: "MongoDB engineering blog (RSS unavailable)",
  // },
  // {
  //   name: "MongoDB AI",
  //   slug: "mongodb-ai",
  //   type: "blog",
  //   url: "https://www.mongodb.com/blog/channel/artificial-intelligence/rss.xml",
  //   description: "MongoDB AI and ML insights (RSS unavailable)",
  // },
  {
    name: "Grab Engineering",
    slug: "grab-engineering",
    type: "blog",
    url: "https://engineering.grab.com/feed.xml",
    description: "Engineering at Grab",
  },
  {
    name: "Airwallex Engineering",
    slug: "airwallex-engineering",
    type: "blog",
    url: "https://medium.com/feed/airwallex-engineering",
    description: "Engineering at Airwallex",
  },
  {
    name: "Josh W. Comeau",
    slug: "josh-comeau",
    type: "blog",
    url: "https://www.joshwcomeau.com/rss.xml",
    description: "Interactive guides to frontend development and CSS",
  },
  {
    name: "Addy Osmani",
    slug: "addy-osmani",
    type: "blog",
    url: "https://addyosmani.com/rss.xml",
    description: "Engineering leader at Google Chrome, web performance expert",
  },
  {
    name: "Piccalilli",
    slug: "piccalilli",
    type: "blog",
    url: "https://piccalil.li/feed.xml",
    description: "CSS, web design, and front-end development tutorials",
  },
  {
    name: "Sam Altman",
    slug: "sam-altman-blog",
    type: "blog",
    url: "https://blog.samaltman.com/posts.atom",
    description: "CEO of OpenAI, startup and AI insights",
  },
  {
    name: "Slack Engineering",
    slug: "slack-engineering",
    type: "blog",
    url: "https://slack.engineering/feed/",
    description: "Engineering at Slack",
  },
  {
    name: "Linear Now",
    slug: "linear-now",
    type: "blog",
    url: "https://linear.app/now/rss",
    description: "Product updates and insights from Linear",
  },
  {
    name: "TanStack Blog",
    slug: "tanstack-blog",
    type: "blog",
    url: "https://tanstack.com/blog/rss.xml",
    description: "Updates on TanStack libraries (React Query, Table, Router, etc.)",
  }
];

async function addMissingSources() {
  console.log("🚀 Adding missing sources to database...\n");

  let addedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const source of missingSources) {
    try {
      const result = await db
        .insert(sources)
        .values({
          name: source.name,
          slug: source.slug,
          type: source.type,
          url: source.url,
          description: source.description,
          metadata: source.metadata || null,
          isActive: true,
        })
        .onConflictDoNothing({ target: sources.slug })
        .returning();

      if (result.length > 0) {
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
  console.log(`   📝 Total: ${missingSources.length}`);
  console.log("\n✅ Missing sources restored!");
}

// Run if called directly
addMissingSources()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error adding missing sources:", error);
    process.exit(1);
  });
