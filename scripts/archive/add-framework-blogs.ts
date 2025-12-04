import { db } from "../lib/db/index";
import { sources } from "../lib/db/schema";

/**
 * Add framework-specific blogs and Cloudflare
 * - Cloudflare Blog
 * - Next.js Blog
 * - Vercel Blog
 * - Supabase Blog
 * - Tailwind CSS Blog
 * - Vue.js Blog
 * - Svelte Blog
 * - Deno Blog
 * - Prisma Blog
 * - TypeScript Blog
 * - Go Blog
 * - Rust Blog
 * - Railway Blog
 */

async function addFrameworkBlogs() {
  console.log("🚀 Adding framework-specific blogs and Cloudflare...\n");

  const newSources = [
    // Company Infrastructure Blog
    {
      name: "Cloudflare Blog",
      slug: "cloudflare-blog",
      type: "blog" as const,
      url: "https://blog.cloudflare.com/rss/",
      isActive: true,
      description: "CDN, edge computing, DDoS protection, and internet infrastructure insights",
      category: "devops",
      subcategory: "cdn-edge",
    },

    // Frontend Frameworks
    {
      name: "Next.js Blog",
      slug: "nextjs-blog",
      type: "blog" as const,
      url: "https://nextjs.org/feed.xml",
      isActive: true,
      description: "Official Next.js framework blog covering new releases, performance optimizations, and React features",
      category: "tools",
      subcategory: "frontend-framework",
    },
    {
      name: "Vue.js Blog",
      slug: "vuejs-blog",
      type: "blog" as const,
      url: "https://blog.vuejs.org/feed.rss",
      isActive: true,
      description: "Official Vue.js framework updates, new features, and ecosystem news",
      category: "tools",
      subcategory: "frontend-framework",
    },
    {
      name: "Svelte Blog",
      slug: "svelte-blog",
      type: "blog" as const,
      url: "https://svelte.dev/blog.rss",
      isActive: true,
      description: "Official Svelte framework blog covering SvelteKit, performance, and compiler improvements",
      category: "tools",
      subcategory: "frontend-framework",
    },

    // Platform & Hosting
    {
      name: "Vercel Blog",
      slug: "vercel-blog",
      type: "blog" as const,
      url: "https://vercel.com/blog/rss.xml",
      isActive: true,
      description: "Next.js creators' blog on frontend infrastructure, edge functions, and deployment",
      category: "devops",
      subcategory: "platform",
    },
    {
      name: "Railway Blog",
      slug: "railway-blog",
      type: "blog" as const,
      url: "https://blog.railway.app/rss.xml",
      isActive: true,
      description: "Cloud platform for instant deployments, infrastructure, and developer experience",
      category: "devops",
      subcategory: "platform",
    },

    // Backend & Database
    {
      name: "Supabase Blog",
      slug: "supabase-blog",
      type: "blog" as const,
      url: "https://supabase.com/blog/rss.xml",
      isActive: true,
      description: "Open-source Firebase alternative covering Postgres, auth, storage, and real-time features",
      category: "tools",
      subcategory: "backend-platform",
    },
    {
      name: "Prisma Blog",
      slug: "prisma-blog",
      type: "blog" as const,
      url: "https://www.prisma.io/blog/rss.xml",
      isActive: true,
      description: "Next-generation ORM covering database workflows, migrations, and TypeScript integration",
      category: "tools",
      subcategory: "orm",
    },

    // CSS & Styling
    {
      name: "Tailwind CSS Blog",
      slug: "tailwind-blog",
      type: "blog" as const,
      url: "https://tailwindcss.com/blog/feed.xml",
      isActive: true,
      description: "Official Tailwind CSS blog covering new features, design patterns, and utility-first CSS",
      category: "tools",
      subcategory: "css-framework",
    },

    // Programming Languages
    {
      name: "TypeScript Blog",
      slug: "typescript-blog",
      type: "blog" as const,
      url: "https://devblogs.microsoft.com/typescript/feed/",
      isActive: true,
      description: "Official TypeScript blog from Microsoft covering new releases, type system improvements, and tooling",
      category: "tools",
      subcategory: "language",
    },
    {
      name: "Go Blog",
      slug: "go-blog",
      type: "blog" as const,
      url: "https://go.dev/blog/feed.atom",
      isActive: true,
      description: "Official Go programming language blog covering new features, performance, and best practices",
      category: "tools",
      subcategory: "language",
    },
    {
      name: "Rust Blog",
      slug: "rust-blog",
      type: "blog" as const,
      url: "https://blog.rust-lang.org/feed.xml",
      isActive: true,
      description: "Official Rust programming language blog covering releases, RFC updates, and systems programming",
      category: "tools",
      subcategory: "language",
    },

    // Runtime & Tools
    {
      name: "Deno Blog",
      slug: "deno-blog",
      type: "blog" as const,
      url: "https://deno.com/blog/rss.xml",
      isActive: true,
      description: "Modern JavaScript/TypeScript runtime covering security, web standards, and performance",
      category: "tools",
      subcategory: "runtime",
    },
  ];

  let addedCount = 0;
  let skippedCount = 0;

  for (const source of newSources) {
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
  console.log(`   - Total in list: ${newSources.length}`);

  console.log("\n🎉 Framework blogs added successfully!");
  process.exit(0);
}

// Run the script
addFrameworkBlogs().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
