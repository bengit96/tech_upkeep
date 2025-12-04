import { initializeDefaultData } from "../lib/db/index";
import { db } from "../lib/db/index";
import { sources } from "../lib/db/schema";

/**
 * Complete database initialization script
 * - Initializes default categories (with deduplication via onConflictDoNothing)
 * - Adds all blog sources (with deduplication via onConflictDoNothing)
 *
 * Safe to run multiple times - will skip existing entries
 */
async function initializeDatabase() {
  console.log("🚀 Starting database initialization...\n");

  try {
    // Step 1: Initialize categories
    console.log("📂 Initializing categories...");
    await initializeDefaultData();
    console.log("✅ Categories initialized (duplicates skipped)\n");

    // Step 2: Add blog sources
    console.log("📰 Adding blog sources...");

    const blogSources = [
      {
        name: "Surfing Complexity",
        slug: "surfing-complexity",
        type: "blog" as const,
        url: "https://surfingcomplexity.blog/feed/",
        isActive: true,
        description: "Essays on engineering, systems thinking, and managing complexity in software",
      },
      {
        name: "Airbnb Engineering",
        slug: "airbnb-engineering",
        type: "blog" as const,
        url: "https://medium.com/feed/airbnb-engineering",
        isActive: true,
        description: "Technical blog from Airbnb's engineering team covering system design, infrastructure, and product development",
      },
      {
        name: "Mitchell Hashimoto",
        slug: "mitchell-hashimoto",
        type: "blog" as const,
        url: "https://mitchellh.com/feed.xml",
        isActive: true,
        description: "Personal blog of Mitchell Hashimoto (creator of Vagrant, Terraform, Consul). Deep dives on infrastructure, developer tools, and system design",
      },
      {
        name: "PyTorch Blog",
        slug: "pytorch-blog",
        type: "blog" as const,
        url: "https://pytorch.org/blog/feed.xml",
        isActive: true,
        description: "Official PyTorch blog covering deep learning, model training, performance optimization, and AI/ML research",
      },
      {
        name: "Rakhim Davletkaliyev",
        slug: "rakhim-exotext",
        type: "blog" as const,
        url: "https://rakhim.exotext.com/feed",
        isActive: true,
        description: "Essays on programming, learning, software craftsmanship, and the human side of technology",
      },
      {
        name: "Rob Bowley",
        slug: "rob-bowley",
        type: "blog" as const,
        url: "https://blog.robbowley.net/feed",
        isActive: true,
        description: "Software engineering, system design, and technical leadership insights",
      },
      {
        name: "Paul Graham Essays",
        slug: "paul-graham",
        type: "blog" as const,
        url: "https://paulgraham.com/rss.html",
        isActive: true,
        description: "Essays on startups, programming, and technology by Y Combinator co-founder Paul Graham",
      },
      {
        name: "React Blog",
        slug: "react-blog",
        type: "blog" as const,
        url: "https://react.dev/rss.xml",
        isActive: true,
        description: "Official React blog covering new releases, best practices, and framework updates from the React core team",
      },
      {
        name: "Bun Blog",
        slug: "bun-blog",
        type: "blog" as const,
        url: "https://bun.sh/rss.xml",
        isActive: true,
        description: "Official Bun runtime blog covering JavaScript/TypeScript performance, bundler updates, and new features",
      },
      {
        name: "Charity Majors",
        slug: "charity-wtf",
        type: "blog" as const,
        url: "https://charity.wtf/feed/",
        isActive: true,
        description: "Observability, engineering management, and building reliable systems by Honeycomb.io co-founder",
      },
      {
        name: "DHH (David Heinemeier Hansson)",
        slug: "dhh-hey",
        type: "blog" as const,
        url: "https://world.hey.com/dhh/feed.atom",
        isActive: true,
        description: "Ruby on Rails creator and Basecamp/37signals founder on software development, business, and technology philosophy",
      },
      {
        name: "Joel on Software",
        slug: "joel-spolsky",
        type: "blog" as const,
        url: "https://www.joelonsoftware.com/feed/",
        isActive: true,
        description: "Stack Overflow and Trello co-founder Joel Spolsky on software development and management",
      },
      {
        name: "Coding Horror",
        slug: "coding-horror",
        type: "blog" as const,
        url: "https://blog.codinghorror.com/rss/",
        isActive: true,
        description: "Stack Overflow and Discourse co-founder Jeff Atwood on programming and software development",
      },
      {
        name: "Sahil Lavingia",
        slug: "sahil-lavingia",
        type: "blog" as const,
        url: "https://sahillavingia.com/feed",
        isActive: true,
        description: "Gumroad founder on building products, startups, and creator economy",
      },
      {
        name: "Kalzumeus (Patrick McKenzie)",
        slug: "kalzumeus",
        type: "blog" as const,
        url: "https://www.kalzumeus.com/feed/",
        isActive: true,
        description: "patio11 on software business, product development, and Stripe insights",
      },
      {
        name: "A Smart Bear",
        slug: "smart-bear",
        type: "blog" as const,
        url: "https://blog.asmartbear.com/feed",
        isActive: true,
        description: "WP Engine founder Jason Cohen on startup strategy, product development, and business",
      },
      {
        name: "Andrej Karpathy",
        slug: "andrej-karpathy",
        type: "blog" as const,
        url: "https://karpathy.github.io/feed.xml",
        isActive: true,
        description: "Deep learning, neural networks, and AI by former Tesla AI director and OpenAI researcher",
      },
      {
        name: "Sebastian Raschka",
        slug: "sebastian-raschka",
        type: "blog" as const,
        url: "https://sebastianraschka.com/blog/index.html",
        isActive: true,
        description: "Machine learning, deep learning, and AI research by Lightning AI lead educator",
      },
      {
        name: "Martin Kleppmann",
        slug: "martin-kleppmann",
        type: "blog" as const,
        url: "https://martin.kleppmann.com/feed.xml",
        isActive: true,
        description: "Distributed systems, databases, and data-intensive applications by DDIA author",
      },
      {
        name: "All Things Distributed",
        slug: "werner-vogels",
        type: "blog" as const,
        url: "https://www.allthingsdistributed.com/atom.xml",
        isActive: true,
        description: "Amazon CTO Werner Vogels on distributed systems, cloud architecture, and scalability",
      },
      {
        name: "Dan Luu",
        slug: "dan-luu",
        type: "blog" as const,
        url: "https://danluu.com/atom.xml",
        isActive: true,
        description: "Computer architecture, performance engineering, and software development practices",
      },
      {
        name: "Jessie Frazelle",
        slug: "jessie-frazelle",
        type: "blog" as const,
        url: "https://blog.jessfraz.com/index.xml",
        isActive: true,
        description: "Containers, security, and infrastructure by former Docker and Google engineer",
      },
      {
        name: "Julia Evans",
        slug: "julia-evans",
        type: "blog" as const,
        url: "https://jvns.ca/atom.xml",
        isActive: true,
        description: "Making hard technical concepts accessible: networking, debugging, systems programming, and zines",
      },
      {
        name: "Cursor Blog",
        slug: "cursor-blog",
        type: "blog" as const,
        url: "https://cursor.com/blog/rss.xml",
        isActive: true,
        description: "AI-powered code editor updates, product features, and development workflows",
      },
      {
        name: "Testing Catalog",
        slug: "testing-catalog",
        type: "rss" as const,
        url: "https://www.testingcatalog.com/feed/",
        isActive: true,
        description: "AI news, testing strategies, and software quality engineering",
      },
      {
        name: "Software Doug",
        slug: "software-doug",
        type: "blog" as const,
        url: "https://softwaredoug.com/feed.xml",
        isActive: true,
        description: "Search engineering, information retrieval, and software architecture by Doug Turnbull",
      },
      {
        name: "ElevenLabs Blog",
        slug: "elevenlabs-blog",
        type: "blog" as const,
        url: "https://elevenlabs.io/blog/rss.xml",
        isActive: true,
        description: "AI voice synthesis, text-to-speech technology, and product updates",
      },
      {
        name: "GitHub Blog",
        slug: "github-blog",
        type: "blog" as const,
        url: "https://github.blog/feed/",
        isActive: true,
        description: "Product updates, engineering insights, and developer tools from GitHub",
      },
      {
        name: "Anthropic Alignment",
        slug: "anthropic-alignment",
        type: "blog" as const,
        url: "https://alignment.anthropic.com/feed.xml",
        isActive: true,
        description: "AI safety research, alignment techniques, and interpretability from Anthropic",
      },
      {
        name: "Exploding Topics",
        slug: "exploding-topics",
        type: "blog" as const,
        url: "https://explodi.tubatuba.net/feed",
        isActive: true,
        description: "Trending technologies, emerging startups, and growth insights",
      },
      {
        name: "Blog System5",
        slug: "blog-system5",
        type: "substack" as const,
        url: "https://blogsystem5.substack.com/feed",
        isActive: true,
        description: "Software engineering, systems thinking, and technology commentary",
      },
      {
        name: "Slack Engineering",
        slug: "slack-engineering",
        type: "blog" as const,
        url: "https://slack.engineering/feed/",
        isActive: true,
        description: "Engineering blog from Slack covering infrastructure, deployment, and scalability",
      },
      {
        name: "Simon Willison",
        slug: "simon-willison",
        type: "blog" as const,
        url: "https://simonwillison.net/atom/everything/",
        isActive: true,
        description: "Django co-creator on LLMs, AI tools, Python, and web development",
      },
      {
        name: "LogRocket Blog",
        slug: "logrocket-blog",
        type: "blog" as const,
        url: "https://blog.logrocket.com/feed/",
        isActive: true,
        description: "Frontend development, monitoring, debugging, and web performance",
      },
      {
        name: "Black Sheep Code",
        slug: "black-sheep-code",
        type: "blog" as const,
        url: "https://blacksheepcode.com/feed/",
        isActive: true,
        description: "Software development practices, code quality, and engineering insights",
      },
      {
        name: "bui.app",
        slug: "bui-app",
        type: "blog" as const,
        url: "https://bui.app/rss.xml",
        isActive: true,
        description: "Design engineering, UI components, and modern web development",
      },
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const source of blogSources) {
      try {
        const result = await db
          .insert(sources)
          .values(source)
          .onConflictDoNothing()
          .returning();

        if (result.length > 0) {
          console.log(`  ✅ Added: ${source.name}`);
          addedCount++;
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
    console.log(`   - Total sources in list: ${blogSources.length}`);

    console.log("\n🎉 Database initialization complete!");
  } catch (error) {
    console.error("\n❌ Error during database initialization:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the initialization
initializeDatabase();
