import { db } from "./index";
import { sources, categories } from "./schema";

/**
 * Unified seed script for all data sources
 * Run with: npx tsx lib/db/seed.ts
 */

const defaultCategories = [
  {
    name: "System Design & Architecture",
    slug: "system-design-architecture",
    description: "Scalability, distributed systems, architecture patterns",
    icon: "📦",
  },
  {
    name: "Frontend Engineering",
    slug: "frontend-engineering",
    description: "React, Vue, performance, UI/UX",
    icon: "⚛️",
  },
  {
    name: "Backend & APIs",
    slug: "backend-apis",
    description: "Node.js, Python, databases, API design",
    icon: "⚙️",
  },
  {
    name: "Cloud & DevOps",
    slug: "cloud-devops",
    description: "AWS, Kubernetes, Docker, CI/CD",
    icon: "☁️",
  },
  {
    name: "AI & Machine Learning",
    slug: "ai-machine-learning",
    description: "LLMs, ML models, AI engineering",
    icon: "🤖",
  },
  {
    name: "Security",
    slug: "security",
    description: "Authentication, encryption, best practices",
    icon: "🔒",
  },
  {
    name: "Developer Tools",
    slug: "developer-tools",
    description: "IDEs, CLI tools, productivity",
    icon: "🛠️",
  },
  {
    name: "Career & Leadership",
    slug: "career-leadership",
    description: "Engineering career growth, management",
    icon: "📈",
  },
  {
    name: "Product",
    slug: "product",
    description: "Product management, growth, design",
    icon: "🚀",
  },
];

const allSources = [
  // ============================================
  // BIG TECH ENGINEERING BLOGS
  // ============================================
  {
    name: "Netflix Tech Blog",
    slug: "netflix-tech-blog",
    type: "blog",
    url: "https://netflixtechblog.medium.com/feed",
    description: "Engineering insights from Netflix",
  },
  {
    name: "Stripe Engineering",
    slug: "stripe-engineering",
    type: "blog",
    url: "https://stripe.com/blog/feed.rss",
    description: "Stripe's engineering blog",
  },
  {
    name: "Airbnb Engineering",
    slug: "airbnb-engineering",
    type: "blog",
    url: "https://medium.com/feed/airbnb-engineering",
    description: "Airbnb's engineering & data science blog",
  },
  {
    name: "Meta Engineering",
    slug: "meta-engineering",
    type: "blog",
    url: "https://engineering.fb.com/feed/",
    description: "Engineering at Meta (Facebook)",
  },
  {
    name: "Google Engineering",
    slug: "google-engineering",
    type: "blog",
    url: "https://developers.googleblog.com/feeds/posts/default",
    description: "Google Developers Blog",
  },
  {
    name: "AWS Blog",
    slug: "aws-blog",
    type: "blog",
    url: "https://aws.amazon.com/blogs/aws/feed/",
    description: "AWS architecture and best practices",
  },
  {
    name: "Figma Engineering",
    slug: "figma-engineering",
    type: "blog",
    url: "https://medium.com/feed/@figma",
    description: "Figma's engineering & design blog on Medium",
  },
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
    name: "Slack Engineering",
    slug: "slack-engineering",
    type: "blog",
    url: "https://slack.engineering/feed/",
    description: "Engineering at Slack",
  },
  {
    name: "Supabase Blog",
    slug: "supabase-blog",
    type: "blog",
    url: "https://supabase.com/blog/rss.xml",
    description: "Engineering and product insights from Supabase",
  },
  {
    name: "Microsoft Engineering",
    slug: "microsoft-engineering",
    type: "blog",
    url: "https://devblogs.microsoft.com/engineering-at-microsoft/feed/",
    description: "Engineering at Microsoft",
  },
  {
    name: "Atlassian Engineering",
    slug: "atlassian-engineering",
    type: "blog",
    url: "https://www.atlassian.com/blog/atlassian-engineering/feed",
    description: "Engineering at Atlassian",
  },

  // ============================================
  // TECH COMPANIES & STARTUPS
  // ============================================
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
  },
  {
    name: "Terrateam Blog",
    slug: "terrateam-blog",
    type: "blog",
    url: "https://terrateam.io/rss.xml",
    description: "Infrastructure and DevOps insights from Terrateam",
  },
  {
    name: "Jane Street Tech Blog",
    slug: "jane-street-tech-blog",
    type: "blog",
    url: "https://blog.janestreet.com/feed.xml",
    description: "Technical blog from Jane Street",
  },

  // ============================================
  // INDIVIDUAL TECHNICAL BLOGS
  // ============================================
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

  // ============================================
  // NEWS & AGGREGATORS
  // ============================================
  {
    name: "Hacker News",
    slug: "hacker-news",
    type: "rss",
    url: "https://hnrss.org/frontpage",
    description: "Top stories from Hacker News",
    metadata: JSON.stringify({ minScore: 100 }),
  },
  {
    name: "TechCrunch",
    slug: "techcrunch",
    type: "rss",
    url: "https://techcrunch.com/feed/",
    description: "Tech industry news",
  },
  {
    name: "The Verge",
    slug: "the-verge",
    type: "rss",
    url: "https://www.theverge.com/rss/index.xml",
    description: "Technology news and reviews",
  },
  {
    name: "Ars Technica",
    slug: "ars-technica",
    type: "rss",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    description: "In-depth tech analysis",
  },

  // ============================================
  // REDDIT COMMUNITIES
  // ============================================
  {
    name: "r/programming",
    slug: "reddit-programming",
    type: "reddit",
    url: "https://www.reddit.com/r/programming.json",
    description: "Programming subreddit",
    metadata: JSON.stringify({ subreddit: "programming" }),
  },
  {
    name: "r/webdev",
    slug: "reddit-webdev",
    type: "reddit",
    url: "https://www.reddit.com/r/webdev.json",
    description: "Web development subreddit",
    metadata: JSON.stringify({ subreddit: "webdev" }),
  },
  {
    name: "r/MachineLearning",
    slug: "reddit-machinelearning",
    type: "reddit",
    url: "https://www.reddit.com/r/MachineLearning.json",
    description: "Machine Learning subreddit",
    metadata: JSON.stringify({ subreddit: "MachineLearning" }),
  },
  {
    name: "r/devops",
    slug: "reddit-devops",
    type: "reddit",
    url: "https://www.reddit.com/r/devops.json",
    description: "DevOps subreddit",
    metadata: JSON.stringify({ subreddit: "devops" }),
  },
  {
    name: "r/artificial",
    slug: "reddit-artificial",
    type: "reddit",
    url: "https://www.reddit.com/r/artificial.json",
    description: "AI and artificial intelligence discussions",
    metadata: JSON.stringify({ subreddit: "artificial" }),
  },
  {
    name: "r/LocalLLaMA",
    slug: "reddit-localllama",
    type: "reddit",
    url: "https://www.reddit.com/r/LocalLLaMA.json",
    description: "Running LLMs locally and open-source AI",
    metadata: JSON.stringify({ subreddit: "LocalLLaMA" }),
  },
  {
    name: "r/StableDiffusion",
    slug: "reddit-stablediffusion",
    type: "reddit",
    url: "https://www.reddit.com/r/StableDiffusion.json",
    description: "Stable Diffusion and AI image generation",
    metadata: JSON.stringify({ subreddit: "StableDiffusion" }),
  },
  {
    name: "r/ChatGPT",
    slug: "reddit-chatgpt",
    type: "reddit",
    url: "https://www.reddit.com/r/ChatGPT.json",
    description: "ChatGPT discussions and use cases",
    metadata: JSON.stringify({ subreddit: "ChatGPT" }),
  },
  {
    name: "r/OpenAI",
    slug: "reddit-openai",
    type: "reddit",
    url: "https://www.reddit.com/r/OpenAI.json",
    description: "OpenAI products and AI research",
    metadata: JSON.stringify({ subreddit: "OpenAI" }),
  },
  {
    name: "r/learnmachinelearning",
    slug: "reddit-learnml",
    type: "reddit",
    url: "https://www.reddit.com/r/learnmachinelearning.json",
    description: "Learning resources for ML and AI",
    metadata: JSON.stringify({ subreddit: "learnmachinelearning" }),
  },

  // ============================================
  // YOUTUBE CHANNELS
  // ============================================
  {
    name: "Fireship",
    slug: "fireship-youtube",
    type: "youtube",
    url: "https://www.youtube.com/@Fireship",
    description: "High-intensity code tutorials",
    metadata: JSON.stringify({ channelId: "UCsBjURrPoezykLs9EqgamOA" }),
  },
  {
    name: "Y Combinator",
    slug: "ycombinator-youtube",
    type: "youtube",
    url: "https://www.youtube.com/@ycombinator",
    description: "Startup and tech insights",
    metadata: JSON.stringify({ channelId: "UCcefcZRL2oaA_uBNeo5UOWg" }),
  },
  {
    name: "freeCodeCamp",
    slug: "freecodecamp-youtube",
    type: "youtube",
    url: "https://www.youtube.com/@freecodecamp",
    description: "Programming tutorials",
    metadata: JSON.stringify({ channelId: "UC8butISFwT-Wl7EV0hUK0BQ" }),
  },
  {
    name: "The Net Ninja",
    slug: "net-ninja-youtube",
    type: "youtube",
    url: "https://www.youtube.com/@NetNinja",
    description: "Web development tutorials",
    metadata: JSON.stringify({ channelId: "UCW5YeuERMmlnqo4oq8vwUpg" }),
  },
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

  // ============================================
  // SUBSTACK NEWSLETTERS
  // ============================================
  {
    name: "The Pragmatic Engineer",
    slug: "pragmatic-engineer",
    type: "substack",
    url: "https://newsletter.pragmaticengineer.com/feed",
    description: "Big Tech and startups, from the inside. Engineering insights from Gergely Orosz.",
  },
  {
    name: "ByteByteGo Newsletter",
    slug: "bytebytego",
    type: "substack",
    url: "https://blog.bytebytego.com/feed",
    description: "System design and architecture explained simply.",
  },
  {
    name: "Level Up Coding",
    slug: "level-up-coding",
    type: "substack",
    url: "https://levelup.gitconnected.com/feed",
    description: "Coding tutorials and career advice.",
  },
  {
    name: "Chamath Palihapitiya",
    slug: "chamath",
    type: "substack",
    url: "https://chamath.substack.com/feed",
    description: "Tech investing and startup insights from Chamath Palihapitiya.",
  },
  {
    name: "Computer, Enhance!",
    slug: "computer-enhance",
    type: "substack",
    url: "https://www.computerenhance.com/feed",
    description: "Performance engineering and computer architecture.",
  },
  {
    name: "Exponential View",
    slug: "exponential-view",
    type: "substack",
    url: "https://www.exponentialview.co/feed",
    description: "Technology trends shaping the future by Azeem Azhar.",
  },
  {
    name: "AI Report",
    slug: "ai-report",
    type: "substack",
    url: "https://www.aireport.email/feed",
    description: "Daily AI news and developments.",
  },
  {
    name: "Understanding AI",
    slug: "understanding-ai",
    type: "substack",
    url: "https://www.understandingai.org/feed",
    description: "AI and machine learning explained clearly.",
  },
  {
    name: "Refactoring",
    slug: "refactoring",
    type: "substack",
    url: "https://refactoring.fm/feed",
    description: "Software engineering and developer insights.",
  },
  {
    name: "OpenGovSG",
    slug: "opengovsg",
    type: "substack",
    url: "https://opengovsg.substack.com/feed",
    description: "Singapore government technology and digital transformation.",
  },
  {
    name: "Remote Branch",
    slug: "remotebranch",
    type: "substack",
    url: "https://remotebranch.substack.com/feed",
    description: "Engineering culture and remote work insights.",
  },
  {
    name: "Fabricated Knowledge",
    slug: "fabricated-knowledge",
    type: "substack",
    url: "https://www.fabricatedknowledge.com/feed",
    description: "Deep dives into technology and AI.",
  },
  {
    name: "Product Growth",
    slug: "product-growth",
    type: "substack",
    url: "https://www.news.aakashg.com/feed",
    description: "Product management and growth strategies.",
  },
  {
    name: "The Product Compass",
    slug: "product-compass",
    type: "substack",
    url: "https://www.productcompass.pm/feed",
    description: "Product management and strategy insights.",
  },
  {
    name: "Newcomer",
    slug: "newcomer",
    type: "substack",
    url: "https://www.newcomer.co/feed",
    description: "Tech and startup news and analysis.",
  },
  {
    name: "Pirate Wires",
    slug: "pirate-wires",
    type: "substack",
    url: "https://piratewires.substack.com/feed",
    description: "Technology, culture, and Silicon Valley insights.",
  },

  // ============================================
  // PODCASTS
  // ============================================
  {
    name: "Software Engineering Daily",
    slug: "software-engineering-daily",
    type: "podcast",
    url: "https://softwareengineeringdaily.com/feed/podcast/",
    description: "Daily interviews about technical software topics",
  },
  {
    name: "Syntax.fm",
    slug: "syntax-fm",
    type: "podcast",
    url: "https://feed.syntax.fm/rss",
    description: "Web development podcast",
  },
  {
    name: "The Changelog",
    slug: "the-changelog",
    type: "podcast",
    url: "https://changelog.com/podcast/feed",
    description: "Conversations with software developers",
  },
  {
    name: "Lenny's Podcast",
    slug: "lennys-podcast",
    type: "podcast",
    url: "https://feeds.simplecast.com/BIvMv9z7",
    description: "Product, growth, and career advice for product managers",
  },
  {
    name: "Pragmatic Engineer Podcast",
    slug: "pragmatic-engineer-podcast",
    type: "podcast",
    url: "https://feeds.transistor.fm/pragmatic-engineer",
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
];

async function seedDatabase() {
  console.log("🌱 Starting unified database seeding...\n");

  // ============================================
  // 1. SEED CATEGORIES
  // ============================================
  console.log("📂 Seeding categories...");
  let categoriesAdded = 0;
  let categoriesSkipped = 0;

  for (const category of defaultCategories) {
    try {
      const result = await db
        .insert(categories)
        .values(category)
        .onConflictDoNothing({ target: categories.slug })
        .returning();

      if (result.length > 0) {
        console.log(`  ✅ Added: ${category.name}`);
        categoriesAdded++;
      } else {
        console.log(`  ⏭️  Skipped: ${category.name}`);
        categoriesSkipped++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to add ${category.name}:`, error);
    }
  }

  console.log(
    `\n✅ Categories: ${categoriesAdded} added, ${categoriesSkipped} skipped\n`
  );

  // ============================================
  // 2. SEED SOURCES
  // ============================================
  console.log("📡 Seeding sources...");
  let sourcesAdded = 0;
  let sourcesSkipped = 0;
  let sourcesError = 0;

  const sourcesByType: Record<string, number> = {};

  for (const source of allSources) {
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
        console.log(`  ✅ Added: ${source.name} (${source.type})`);
        sourcesAdded++;
        sourcesByType[source.type] = (sourcesByType[source.type] || 0) + 1;
      } else {
        sourcesSkipped++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to add ${source.name}:`, error);
      sourcesError++;
    }
  }

  console.log(`\n✅ Sources: ${sourcesAdded} added, ${sourcesSkipped} skipped, ${sourcesError} errors`);
  console.log("\n📊 Sources by type:");
  for (const [type, count] of Object.entries(sourcesByType)) {
    console.log(`  - ${type}: ${count}`);
  }

  console.log("\n✅ Database seeding complete!");
  console.log(`📝 Total sources in database: ${allSources.length}`);
  console.log(`📂 Total categories: ${defaultCategories.length}`);
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error seeding database:", error);
      process.exit(1);
    });
}

export { seedDatabase, allSources, defaultCategories };
