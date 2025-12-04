import { config } from "dotenv";
config(); // Load .env file

import { db } from "../lib/db";
import { sources } from "../lib/db/schema";

async function addNewsletterSources() {
  const newSources = [
    {
      name: "Pointer",
      slug: "pointer",
      type: "substack",
      url: "https://www.pointer.io/feed/", // RSS feed
      isActive: true,
      description: "Hand-picked engineering articles from across the web. Covers software architecture, productivity, and engineering culture.",
      category: "engineering",
      subcategory: "general",
    },
    {
      name: "Backend Weekly",
      slug: "backend-weekly",
      type: "substack",
      url: "https://backend.devops.dev/feed", // RSS feed
      isActive: true,
      description: "Backend engineering, databases, and infrastructure content. Covers Go, Python, databases, and distributed systems.",
      category: "engineering",
      subcategory: "backend",
    },
    {
      name: "Frontend Focus",
      slug: "frontend-focus",
      type: "substack",
      url: "https://frontendfoc.us/rss", // RSS feed
      isActive: true,
      description: "Frontend news, articles, and tutorials. HTML, CSS, WebGL, and everything UI/UX related.",
      category: "engineering",
      subcategory: "frontend",
    },
    {
      name: "DevOps Weekly",
      slug: "devops-weekly",
      type: "substack",
      url: "https://www.devopsweekly.com/rss", // RSS feed
      isActive: true,
      description: "Cloud infrastructure, Kubernetes, CI/CD, and DevOps practices.",
      category: "devops",
      subcategory: "infra",
    },
    {
      name: "Quastor",
      slug: "quastor",
      type: "substack",
      url: "https://blog.quastor.org/feed", // RSS feed
      isActive: true,
      description: "Deep dives into how big tech companies solve engineering problems. Case studies from Google, Meta, Amazon.",
      category: "engineering",
      subcategory: "company-blog",
    },
    {
      name: "Level Up",
      slug: "level-up-newsletter",
      type: "substack",
      url: "https://levelup.patkua.com/feed", // RSS feed
      isActive: true,
      description: "Career advice, coding tutorials, and personal growth for developers.",
      category: "career",
      subcategory: "personal-blog",
    },
  ];

  console.log("Adding newsletter sources...\n");

  for (const source of newSources) {
    try {
      const result = await db.insert(sources).values(source).returning();
      console.log(`✅ Added: ${source.name} (${source.url})`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE")) {
        console.log(`⏭️  Skipped: ${source.name} (already exists)`);
      } else {
        console.error(`❌ Error adding ${source.name}:`, error);
      }
    }
  }

  console.log("\n✅ Newsletter sources added successfully!");
  process.exit(0);
}

addNewsletterSources().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
