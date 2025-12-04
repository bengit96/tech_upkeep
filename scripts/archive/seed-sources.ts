import { db } from "./index";
import { sources } from "./schema";

const defaultSources = [
  // Big Tech Engineering Blogs
  {
    name: "Netflix Tech Blog",
    slug: "netflix-tech-blog",
    type: "blog",
    url: "https://netflixtechblog.com/feed",
    description: "Engineering insights from Netflix",
    isActive: true,
  },
  {
    name: "Stripe Engineering",
    slug: "stripe-engineering",
    type: "blog",
    url: "https://stripe.com/blog/feed.rss",
    description: "Stripe's engineering blog",
    isActive: true,
  },
  {
    name: "Airbnb Engineering",
    slug: "airbnb-engineering",
    type: "blog",
    url: "https://medium.com/feed/airbnb-engineering",
    description: "Airbnb's engineering & data science blog",
    isActive: true,
  },
  {
    name: "Uber Engineering",
    slug: "uber-engineering",
    type: "blog",
    url: "https://www.uber.com/blog/engineering/rss/",
    description: "Uber no longer provides RSS feed",
    isActive: false,
  },
  {
    name: "Meta Engineering",
    slug: "meta-engineering",
    type: "blog",
    url: "https://engineering.fb.com/feed/",
    description: "Engineering at Meta (Facebook)",
    isActive: true,
  },
  {
    name: "Google Engineering",
    slug: "google-engineering",
    type: "blog",
    url: "https://developers.googleblog.com/feeds/posts/default",
    description: "Google Developers Blog",
    isActive: true,
  },
  {
    name: "AWS Blog",
    slug: "aws-blog",
    type: "blog",
    url: "https://aws.amazon.com/blogs/aws/feed/",
    description: "AWS architecture and best practices",
    isActive: true,
  },
  {
    name: "Figma Engineering",
    slug: "figma-engineering",
    type: "blog",
    url: "https://medium.com/feed/@figma",
    description: "Figma's engineering & design blog on Medium",
    isActive: true,
  },
  {
    name: "CodeRabbit Blog",
    slug: "coderabbit-blog",
    type: "blog",
    url: "https://www.coderabbit.ai/blog/rss.xml",
    description: "AI-powered code reviews and engineering insights",
    isActive: true,
  },

  // News & Aggregators
  {
    name: "Hacker News",
    slug: "hacker-news",
    type: "rss",
    url: "https://hnrss.org/frontpage",
    description: "Top stories from Hacker News",
    isActive: true,
    metadata: JSON.stringify({ minScore: 100 }),
  },
  {
    name: "TechCrunch",
    slug: "techcrunch",
    type: "rss",
    url: "https://techcrunch.com/feed/",
    description: "Tech industry news",
    isActive: true,
  },
  {
    name: "The Verge",
    slug: "the-verge",
    type: "rss",
    url: "https://www.theverge.com/rss/index.xml",
    description: "Technology news and reviews",
    isActive: true,
  },
  {
    name: "Ars Technica",
    slug: "ars-technica",
    type: "rss",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    description: "In-depth tech analysis",
    isActive: true,
  },

  // Reddit
  {
    name: "r/programming",
    slug: "reddit-programming",
    type: "reddit",
    url: "https://www.reddit.com/r/programming.json",
    description: "Programming subreddit",
    isActive: true,
    metadata: JSON.stringify({ subreddit: "programming" }),
  },
  {
    name: "r/webdev",
    slug: "reddit-webdev",
    type: "reddit",
    url: "https://www.reddit.com/r/webdev.json",
    description: "Web development subreddit",
    isActive: true,
    metadata: JSON.stringify({ subreddit: "webdev" }),
  },
  {
    name: "r/MachineLearning",
    slug: "reddit-machinelearning",
    type: "reddit",
    url: "https://www.reddit.com/r/MachineLearning.json",
    description: "Machine Learning subreddit",
    isActive: true,
    metadata: JSON.stringify({ subreddit: "MachineLearning" }),
  },
  {
    name: "r/devops",
    slug: "reddit-devops",
    type: "reddit",
    url: "https://www.reddit.com/r/devops.json",
    description: "DevOps subreddit",
    isActive: true,
    metadata: JSON.stringify({ subreddit: "devops" }),
  },

  // YouTube Channels
  {
    name: "Fireship",
    slug: "fireship-youtube",
    type: "youtube",
    url: "https://www.youtube.com/@Fireship",
    description: "High-intensity code tutorials",
    isActive: true,
    metadata: JSON.stringify({ channelId: "UCsBjURrPoezykLs9EqgamOA" }),
  },
  {
    name: "Y Combinator",
    slug: "ycombinator-youtube",
    type: "youtube",
    url: "https://www.youtube.com/@ycombinator",
    description: "Startup and tech insights",
    isActive: true,
    metadata: JSON.stringify({ channelId: "UCcefcZRL2oaA_uBNeo5UOWg" }),
  },
  {
    name: "freeCodeCamp",
    slug: "freecodecamp-youtube",
    type: "youtube",
    url: "https://www.youtube.com/@freecodecamp",
    description: "Programming tutorials",
    isActive: true,
    metadata: JSON.stringify({ channelId: "UC8butISFwT-Wl7EV0hUK0BQ" }),
  },
  {
    name: "The Net Ninja",
    slug: "net-ninja-youtube",
    type: "youtube",
    url: "https://www.youtube.com/@NetNinja",
    description: "Web development tutorials",
    isActive: true,
    metadata: JSON.stringify({ channelId: "UCW5YeuERMmlnqo4oq8vwUpg" }),
  },

  // Substack (Popular Tech Newsletters)
  {
    name: "Pragmatic Engineer",
    slug: "pragmatic-engineer",
    type: "substack",
    url: "https://newsletter.pragmaticengineer.com/feed",
    description: "Big Tech and startups, from the inside",
    isActive: true,
  },
  {
    name: "ByteByteGo",
    slug: "bytebytego",
    type: "substack",
    url: "https://blog.bytebytego.com/feed",
    description: "System design and architecture",
    isActive: true,
  },
  {
    name: "Level Up Coding",
    slug: "level-up-coding",
    type: "substack",
    url: "https://levelup.gitconnected.com/feed",
    description: "Coding tutorials and career advice",
    isActive: true,
  },
  {
    name: "Scarlet Ink",
    slug: "scarlet-ink",
    type: "substack",
    url: "https://scarletink.substack.com/feed",
    description: "Tech industry news and insights",
    isActive: true,
  },

  // Podcasts (RSS feeds)
  {
    name: "Software Engineering Daily",
    slug: "software-engineering-daily",
    type: "podcast",
    url: "https://softwareengineeringdaily.com/feed/podcast/",
    description: "Daily interviews about technical software topics",
    isActive: true,
  },
  {
    name: "Syntax.fm",
    slug: "syntax-fm",
    type: "podcast",
    url: "https://feed.syntax.fm/rss",
    description: "Web development podcast",
    isActive: true,
  },
  {
    name: "The Changelog",
    slug: "the-changelog",
    type: "podcast",
    url: "https://changelog.com/podcast/feed",
    description: "Conversations with software developers",
    isActive: true,
  },
];

export async function seedSources() {
  console.log("🌱 Seeding sources...");

  for (const source of defaultSources) {
    try {
      await db
        .insert(sources)
        .values(source)
        .onConflictDoNothing({ target: sources.slug });
      console.log(`✅ Added source: ${source.name}`);
    } catch (error) {
      console.error(`❌ Failed to add ${source.name}:`, error);
    }
  }

  console.log("✅ Sources seeded successfully!");
}

// Run if called directly
seedSources()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding sources:", error);
    process.exit(1);
  });
