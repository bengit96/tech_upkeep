import { initializeDefaultData } from "../lib/db/index";
import { db } from "../lib/db/index";
import { sources } from "../lib/db/schema";

/**
 * Comprehensive source seeding script
 * - Initializes default categories
 * - Adds ALL content sources (blogs, substacks, podcasts, YouTube, Reddit)
 * - Safe to run multiple times - uses onConflictDoNothing() for deduplication
 *
 * Usage: npx tsx scripts/seed-all-sources.ts
 */

interface SourceDefinition {
  name: string;
  slug: string;
  type: "blog" | "youtube" | "reddit" | "substack" | "podcast" | "rss";
  url: string;
  isActive: boolean;
  description: string;
  category?: string;
  subcategory?: string;
  metadata?: string;
}

async function seedAllSources() {
  console.log("🚀 Starting comprehensive source seeding...\n");

  try {
    // Step 1: Initialize categories
    console.log("📂 Initializing categories...");
    await initializeDefaultData();
    console.log("✅ Categories initialized\n");

    // Step 2: Define all sources
    console.log("📰 Preparing source list...");

    const allSources: SourceDefinition[] = [
      // ==========================================
      // 🏢 COMPANY ENGINEERING BLOGS
      // ==========================================
      {
        name: "Airbnb Engineering",
        slug: "airbnb-engineering",
        type: "blog",
        url: "https://medium.com/feed/airbnb-engineering",
        isActive: true,
        description: "Technical blog from Airbnb's engineering team covering system design, infrastructure, and product development",
        category: "engineering",
        subcategory: "company-blog",
      },
      {
        name: "Netflix Tech Blog",
        slug: "netflix-tech-blog",
        type: "blog",
        url: "https://netflixtechblog.com/feed",
        isActive: true,
        description: "Engineering blog from Netflix covering microservices, chaos engineering, and streaming infrastructure",
        category: "engineering",
        subcategory: "company-blog",
      },
      {
        name: "Uber Engineering",
        slug: "uber-engineering",
        type: "blog",
        url: "https://www.uber.com/en-US/blog/engineering/rss/",
        isActive: true,
        description: "Uber's engineering blog on distributed systems, mobile, and data infrastructure",
        category: "engineering",
        subcategory: "company-blog",
      },
      {
        name: "Stripe Engineering",
        slug: "stripe-engineering",
        type: "blog",
        url: "https://stripe.com/blog/feed.rss",
        isActive: true,
        description: "Stripe's engineering blog covering payments infrastructure, APIs, and financial services",
        category: "engineering",
        subcategory: "company-blog",
      },
      {
        name: "Slack Engineering",
        slug: "slack-engineering",
        type: "blog",
        url: "https://slack.engineering/feed/",
        isActive: true,
        description: "Engineering blog from Slack covering infrastructure, deployment, and scalability",
        category: "engineering",
        subcategory: "company-blog",
      },
      {
        name: "GitHub Blog",
        slug: "github-blog",
        type: "blog",
        url: "https://github.blog/feed/",
        isActive: true,
        description: "Product updates, engineering insights, and developer tools from GitHub",
        category: "tools",
        subcategory: "platform",
      },

      // ==========================================
      // 👤 FOUNDER/CTO PERSONAL BLOGS
      // ==========================================
      {
        name: "DHH (David Heinemeier Hansson)",
        slug: "dhh-hey",
        type: "blog",
        url: "https://world.hey.com/dhh/feed.atom",
        isActive: true,
        description: "Ruby on Rails creator and Basecamp/37signals founder on software development, business, and technology philosophy",
        category: "engineering",
        subcategory: "founder-blog",
      },
      {
        name: "Joel on Software",
        slug: "joel-spolsky",
        type: "blog",
        url: "https://www.joelonsoftware.com/feed/",
        isActive: true,
        description: "Stack Overflow and Trello co-founder Joel Spolsky on software development and management",
        category: "engineering",
        subcategory: "founder-blog",
      },
      {
        name: "Coding Horror",
        slug: "coding-horror",
        type: "blog",
        url: "https://blog.codinghorror.com/rss/",
        isActive: true,
        description: "Stack Overflow and Discourse co-founder Jeff Atwood on programming and software development",
        category: "engineering",
        subcategory: "founder-blog",
      },
      {
        name: "Paul Graham Essays",
        slug: "paul-graham",
        type: "blog",
        url: "https://paulgraham.com/rss.html",
        isActive: true,
        description: "Essays on startups, programming, and technology by Y Combinator co-founder Paul Graham",
        category: "product",
        subcategory: "founder-blog",
      },
      {
        name: "Sahil Lavingia",
        slug: "sahil-lavingia",
        type: "blog",
        url: "https://sahillavingia.com/feed",
        isActive: true,
        description: "Gumroad founder on building products, startups, and creator economy",
        category: "product",
        subcategory: "founder-blog",
      },
      {
        name: "Kalzumeus (Patrick McKenzie)",
        slug: "kalzumeus",
        type: "blog",
        url: "https://www.kalzumeus.com/feed/",
        isActive: true,
        description: "patio11 on software business, product development, and Stripe insights",
        category: "product",
        subcategory: "founder-blog",
      },
      {
        name: "A Smart Bear",
        slug: "smart-bear",
        type: "blog",
        url: "https://blog.asmartbear.com/feed",
        isActive: true,
        description: "WP Engine founder Jason Cohen on startup strategy, product development, and business",
        category: "product",
        subcategory: "founder-blog",
      },
      {
        name: "Mitchell Hashimoto",
        slug: "mitchell-hashimoto",
        type: "blog",
        url: "https://mitchellh.com/feed.xml",
        isActive: true,
        description: "Personal blog of Mitchell Hashimoto (creator of Vagrant, Terraform, Consul). Deep dives on infrastructure, developer tools, and system design",
        category: "devops",
        subcategory: "founder-blog",
      },

      // ==========================================
      // 🧠 INDIVIDUAL TECHNICAL BLOGGERS - AI/ML
      // ==========================================
      {
        name: "Andrej Karpathy",
        slug: "andrej-karpathy",
        type: "blog",
        url: "https://karpathy.github.io/feed.xml",
        isActive: true,
        description: "Deep learning, neural networks, and AI by former Tesla AI director and OpenAI researcher",
        category: "ai-ml",
        subcategory: "research",
      },
      {
        name: "Sebastian Raschka",
        slug: "sebastian-raschka",
        type: "blog",
        url: "https://sebastianraschka.com/blog/index.html",
        isActive: true,
        description: "Machine learning, deep learning, and AI research by Lightning AI lead educator",
        category: "ai-ml",
        subcategory: "research",
      },
      {
        name: "Simon Willison",
        slug: "simon-willison",
        type: "blog",
        url: "https://simonwillison.net/atom/everything/",
        isActive: true,
        description: "Django co-creator on LLMs, AI tools, Python, and web development",
        category: "ai-ml",
        subcategory: "applications",
      },

      // ==========================================
      // 🧠 TECHNICAL BLOGGERS - SYSTEMS/INFRA
      // ==========================================
      {
        name: "Martin Kleppmann",
        slug: "martin-kleppmann",
        type: "blog",
        url: "https://martin.kleppmann.com/feed.xml",
        isActive: true,
        description: "Distributed systems, databases, and data-intensive applications by DDIA author",
        category: "engineering",
        subcategory: "distributed-systems",
      },
      {
        name: "All Things Distributed",
        slug: "werner-vogels",
        type: "blog",
        url: "https://www.allthingsdistributed.com/atom.xml",
        isActive: true,
        description: "Amazon CTO Werner Vogels on distributed systems, cloud architecture, and scalability",
        category: "engineering",
        subcategory: "distributed-systems",
      },
      {
        name: "Dan Luu",
        slug: "dan-luu",
        type: "blog",
        url: "https://danluu.com/atom.xml",
        isActive: true,
        description: "Computer architecture, performance engineering, and software development practices",
        category: "engineering",
        subcategory: "performance",
      },
      {
        name: "Jessie Frazelle",
        slug: "jessie-frazelle",
        type: "blog",
        url: "https://blog.jessfraz.com/index.xml",
        isActive: true,
        description: "Containers, security, and infrastructure by former Docker and Google engineer",
        category: "devops",
        subcategory: "containers",
      },
      {
        name: "Julia Evans",
        slug: "julia-evans",
        type: "blog",
        url: "https://jvns.ca/atom.xml",
        isActive: true,
        description: "Making hard technical concepts accessible: networking, debugging, systems programming, and zines",
        category: "engineering",
        subcategory: "systems",
      },
      {
        name: "Charity Majors",
        slug: "charity-wtf",
        type: "blog",
        url: "https://charity.wtf/feed/",
        isActive: true,
        description: "Observability, engineering management, and building reliable systems by Honeycomb.io co-founder",
        category: "devops",
        subcategory: "observability",
      },
      {
        name: "Software Doug",
        slug: "software-doug",
        type: "blog",
        url: "https://softwaredoug.com/feed.xml",
        isActive: true,
        description: "Search engineering, information retrieval, and software architecture by Doug Turnbull",
        category: "engineering",
        subcategory: "search",
      },

      // ==========================================
      // 🧠 TECHNICAL BLOGGERS - GENERAL
      // ==========================================
      {
        name: "Rakhim Davletkaliyev",
        slug: "rakhim-exotext",
        type: "blog",
        url: "https://rakhim.exotext.com/feed",
        isActive: true,
        description: "Essays on programming, learning, software craftsmanship, and the human side of technology",
        category: "career",
        subcategory: "learning",
      },
      {
        name: "Rob Bowley",
        slug: "rob-bowley",
        type: "blog",
        url: "https://blog.robbowley.net/feed",
        isActive: true,
        description: "Software engineering, system design, and technical leadership insights",
        category: "engineering",
        subcategory: "general",
      },
      {
        name: "Black Sheep Code",
        slug: "black-sheep-code",
        type: "blog",
        url: "https://blacksheepcode.com/feed/",
        isActive: true,
        description: "Software development practices, code quality, and engineering insights",
        category: "engineering",
        subcategory: "best-practices",
      },
      {
        name: "Surfing Complexity",
        slug: "surfing-complexity",
        type: "blog",
        url: "https://surfingcomplexity.blog/feed/",
        isActive: true,
        description: "Essays on engineering, systems thinking, and managing complexity in software",
        category: "engineering",
        subcategory: "systems-thinking",
      },
      {
        name: "Michael Bleigh",
        slug: "michael-bleigh",
        type: "blog",
        url: "https://mbleigh.dev/rss.xml",
        isActive: true,
        description: "Google engineering lead on Firebase, developer experience, APIs, and web development",
        category: "engineering",
        subcategory: "developer-experience",
      },

      // ==========================================
      // 🛠️ FRAMEWORK & TOOL OFFICIAL BLOGS
      // ==========================================
      {
        name: "React Blog",
        slug: "react-blog",
        type: "blog",
        url: "https://react.dev/rss.xml",
        isActive: true,
        description: "Official React blog covering new releases, best practices, and framework updates from the React core team",
        category: "tools",
        subcategory: "frontend-framework",
      },
      {
        name: "Next.js Blog",
        slug: "nextjs-blog",
        type: "blog",
        url: "https://nextjs.org/feed.xml",
        isActive: true,
        description: "Official Next.js framework blog covering new releases, performance optimizations, and React features",
        category: "tools",
        subcategory: "frontend-framework",
      },
      {
        name: "Vue.js Blog",
        slug: "vuejs-blog",
        type: "blog",
        url: "https://blog.vuejs.org/feed.rss",
        isActive: true,
        description: "Official Vue.js framework updates, new features, and ecosystem news",
        category: "tools",
        subcategory: "frontend-framework",
      },
      {
        name: "Svelte Blog",
        slug: "svelte-blog",
        type: "blog",
        url: "https://svelte.dev/blog.rss",
        isActive: true,
        description: "Official Svelte framework blog covering SvelteKit, performance, and compiler improvements",
        category: "tools",
        subcategory: "frontend-framework",
      },
      {
        name: "Bun Blog",
        slug: "bun-blog",
        type: "blog",
        url: "https://bun.sh/rss.xml",
        isActive: true,
        description: "Official Bun runtime blog covering JavaScript/TypeScript performance, bundler updates, and new features",
        category: "tools",
        subcategory: "runtime",
      },
      {
        name: "Deno Blog",
        slug: "deno-blog",
        type: "blog",
        url: "https://deno.com/blog/rss.xml",
        isActive: true,
        description: "Modern JavaScript/TypeScript runtime covering security, web standards, and performance",
        category: "tools",
        subcategory: "runtime",
      },
      {
        name: "PyTorch Blog",
        slug: "pytorch-blog",
        type: "blog",
        url: "https://pytorch.org/blog/feed.xml",
        isActive: true,
        description: "Official PyTorch blog covering deep learning, model training, performance optimization, and AI/ML research",
        category: "ai-ml",
        subcategory: "framework",
      },
      {
        name: "TypeScript Blog",
        slug: "typescript-blog",
        type: "blog",
        url: "https://devblogs.microsoft.com/typescript/feed/",
        isActive: true,
        description: "Official TypeScript blog from Microsoft covering new releases, type system improvements, and tooling",
        category: "tools",
        subcategory: "language",
      },
      {
        name: "Go Blog",
        slug: "go-blog",
        type: "blog",
        url: "https://go.dev/blog/feed.atom",
        isActive: true,
        description: "Official Go programming language blog covering new features, performance, and best practices",
        category: "tools",
        subcategory: "language",
      },
      {
        name: "Rust Blog",
        slug: "rust-blog",
        type: "blog",
        url: "https://blog.rust-lang.org/feed.xml",
        isActive: true,
        description: "Official Rust programming language blog covering releases, RFC updates, and systems programming",
        category: "tools",
        subcategory: "language",
      },
      {
        name: "Cursor Blog",
        slug: "cursor-blog",
        type: "blog",
        url: "https://cursor.com/blog/rss.xml",
        isActive: true,
        description: "AI-powered code editor updates, product features, and development workflows",
        category: "tools",
        subcategory: "editor",
      },
      {
        name: "Tailwind CSS Blog",
        slug: "tailwind-blog",
        type: "blog",
        url: "https://tailwindcss.com/blog/feed.xml",
        isActive: true,
        description: "Official Tailwind CSS blog covering new features, design patterns, and utility-first CSS",
        category: "tools",
        subcategory: "css-framework",
      },
      {
        name: "Supabase Blog",
        slug: "supabase-blog",
        type: "blog",
        url: "https://supabase.com/blog/rss.xml",
        isActive: true,
        description: "Open-source Firebase alternative covering Postgres, auth, storage, and real-time features",
        category: "tools",
        subcategory: "backend-platform",
      },
      {
        name: "Prisma Blog",
        slug: "prisma-blog",
        type: "blog",
        url: "https://www.prisma.io/blog/rss.xml",
        isActive: true,
        description: "Next-generation ORM covering database workflows, migrations, and TypeScript integration",
        category: "tools",
        subcategory: "orm",
      },

      // ==========================================
      // ☁️ PLATFORM & INFRASTRUCTURE
      // ==========================================
      {
        name: "Cloudflare Blog",
        slug: "cloudflare-blog",
        type: "blog",
        url: "https://blog.cloudflare.com/rss/",
        isActive: true,
        description: "CDN, edge computing, DDoS protection, and internet infrastructure insights",
        category: "devops",
        subcategory: "cdn-edge",
      },
      {
        name: "Vercel Blog",
        slug: "vercel-blog",
        type: "blog",
        url: "https://vercel.com/blog/rss.xml",
        isActive: true,
        description: "Next.js creators' blog on frontend infrastructure, edge functions, and deployment",
        category: "devops",
        subcategory: "platform",
      },
      {
        name: "Railway Blog",
        slug: "railway-blog",
        type: "blog",
        url: "https://blog.railway.app/rss.xml",
        isActive: true,
        description: "Cloud platform for instant deployments, infrastructure, and developer experience",
        category: "devops",
        subcategory: "platform",
      },

      // ==========================================
      // 📰 DEVELOPER MEDIA & NEWS
      // ==========================================
      {
        name: "Testing Catalog",
        slug: "testing-catalog",
        type: "rss",
        url: "https://www.testingcatalog.com/feed/",
        isActive: true,
        description: "AI news, testing strategies, and software quality engineering",
        category: "engineering",
        subcategory: "testing",
      },
      {
        name: "LogRocket Blog",
        slug: "logrocket-blog",
        type: "blog",
        url: "https://blog.logrocket.com/feed/",
        isActive: true,
        description: "Frontend development, monitoring, debugging, and web performance",
        category: "engineering",
        subcategory: "frontend",
      },
      {
        name: "ElevenLabs Blog",
        slug: "elevenlabs-blog",
        type: "blog",
        url: "https://elevenlabs.io/blog/rss.xml",
        isActive: true,
        description: "AI voice synthesis, text-to-speech technology, and product updates",
        category: "ai-ml",
        subcategory: "voice-ai",
      },
      {
        name: "bui.app",
        slug: "bui-app",
        type: "blog",
        url: "https://bui.app/rss.xml",
        isActive: true,
        description: "Design engineering, UI components, and modern web development",
        category: "engineering",
        subcategory: "design-eng",
      },
      {
        name: "Exploding Topics",
        slug: "exploding-topics",
        type: "blog",
        url: "https://explodi.tubatuba.net/feed",
        isActive: true,
        description: "Trending technologies, emerging startups, and growth insights",
        category: "news",
        subcategory: "trends",
      },
      {
        name: "Anthropic Alignment",
        slug: "anthropic-alignment",
        type: "blog",
        url: "https://alignment.anthropic.com/feed.xml",
        isActive: true,
        description: "AI safety research, alignment techniques, and interpretability from Anthropic",
        category: "ai-ml",
        subcategory: "research",
      },
      {
        name: "Blog System5",
        slug: "blog-system5",
        type: "substack",
        url: "https://blogsystem5.substack.com/feed",
        isActive: true,
        description: "Software engineering, systems thinking, and technology commentary",
        category: "engineering",
        subcategory: "commentary",
      },
      {
        name: "Progscrape",
        slug: "progscrape",
        type: "rss",
        url: "https://progscrape.com/feed",
        isActive: true,
        description: "Tech news aggregator covering programming, AI/ML, security, cloud infrastructure, and industry developments from Hacker News, Lobsters, and Reddit",
        category: "news",
        subcategory: "aggregator",
      },

      // ==========================================
      // 📰 ADDITIONAL CURATED SOURCES
      // ==========================================
      {
        name: "Manager.dev",
        slug: "manager-dev",
        type: "substack",
        url: "https://newsletter.manager.dev/feed",
        isActive: true,
        description: "Newsletter for engineering managers covering leadership fundamentals, team building, career progression, and managing software teams",
        category: "career",
        subcategory: "engineering-management",
      },
      {
        name: "GBHackers News",
        slug: "gbhackers",
        type: "blog",
        url: "https://gbhackers.com/feed/",
        isActive: true,
        description: "Cybersecurity news platform covering ransomware, vulnerabilities, data breaches, malware analysis, and threat intelligence",
        category: "news",
        subcategory: "security",
      },
      {
        name: "The Leadership Lighthouse",
        slug: "leadership-lighthouse",
        type: "substack",
        url: "https://leadershiplighthouse.substack.com/feed",
        isActive: true,
        description: "Leadership development newsletter covering strategies for building world-class teams, delegation, organizational processes, and team transformation",
        category: "career",
        subcategory: "leadership",
      },
      {
        name: "Strategy Breakdowns",
        slug: "strategy-breakdowns",
        type: "blog",
        url: "https://rss.beehiiv.com/feeds/QAVPsYE1zw.xml",
        isActive: true,
        description: "Newsletter analyzing business strategy and growth tactics of major companies like Apple, Netflix, Stripe, and Notion",
        category: "product",
        subcategory: "strategy",
      },
      {
        name: "Galileo AI Blog",
        slug: "galileo-ai-blog",
        type: "blog",
        url: "https://galileo.ai/blog/rss.xml",
        isActive: true,
        description: "Blog about Galileo AI's observability and evaluation platform for AI/ML applications",
        category: "ai-ml",
        subcategory: "tools",
      },
      {
        name: "NULL BITMAP",
        slug: "null-bitmap",
        type: "substack",
        url: "https://buttondown.com/jaffray/rss",
        isActive: true,
        description: "Technical newsletter by Justin Jaffray covering database systems, distributed computing, query optimization, and systems programming",
        category: "engineering",
        subcategory: "systems",
      },
      {
        name: "Pinterest Engineering",
        slug: "pinterest-engineering",
        type: "blog",
        url: "https://medium.com/feed/pinterest-engineering",
        isActive: true,
        description: "Engineering blog from Pinterest covering infrastructure, distributed systems, and technical innovations",
        category: "engineering",
        subcategory: "company-blog",
      },
      {
        name: "Equal Ventures",
        slug: "equal-ventures",
        type: "substack",
        url: "https://newsletter.equal.vc/feed",
        isActive: true,
        description: "Newsletter for founders and operators focused on climate tech, insurance, and retail & supply chain with investment insights",
        category: "product",
        subcategory: "venture",
      },
      {
        name: "The Argument",
        slug: "the-argument",
        type: "substack",
        url: "https://theargumentmag.substack.com/feed",
        isActive: true,
        description: "Substack newsletter on policy and opinion essays making the case for pro-abundance liberalism, featuring columnists and debates",
        category: "news",
        subcategory: "opinion",
      },
      {
        name: "Off by One",
        slug: "off-by-one",
        type: "blog",
        url: "https://justoffbyone.com/rss.xml",
        isActive: true,
        description: "Blog about engineering leadership, management practices, and engineering management by Can Duruk",
        category: "career",
        subcategory: "engineering-management",
      },
    ];

    // Step 3: Insert all sources
    console.log(`📝 Inserting ${allSources.length} sources...\n`);

    let addedCount = 0;
    let skippedCount = 0;
    const categoryCounts: Record<string, number> = {};

    for (const source of allSources) {
      try {
        const result = await db
          .insert(sources)
          .values(source)
          .onConflictDoNothing()
          .returning();

        if (result.length > 0) {
          console.log(`  ✅ Added: ${source.name}`);
          addedCount++;

          // Track by category
          const cat = source.category || 'uncategorized';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        } else {
          console.log(`  ⏭️  Skipped (already exists): ${source.name}`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`  ❌ Error adding ${source.name}:`, error);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Added: ${addedCount} new sources`);
    console.log(`   - Skipped: ${skippedCount} existing sources`);
    console.log(`   - Total in list: ${allSources.length}`);

    if (addedCount > 0) {
      console.log(`\n📂 Added by Category:`);
      Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`   - ${category}: ${count} sources`);
        });
    }

    console.log("\n🎉 Source seeding complete!");
  } catch (error) {
    console.error("\n❌ Error during source seeding:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the seeding
seedAllSources();
