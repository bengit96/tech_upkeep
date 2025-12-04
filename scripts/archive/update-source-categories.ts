import { db } from "../lib/db/index";
import { sources } from "../lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Update existing sources with category and subcategory classifications
 * Run this after adding the new fields to organize your sources
 */

interface SourceCategorization {
  name: string;
  category: string;
  subcategory: string;
}

const sourceCategories: SourceCategorization[] = [
  // 🏢 Company Engineering Blogs
  { name: "Airbnb Engineering", category: "engineering", subcategory: "company-blog" },
  { name: "GitHub Blog", category: "tools", subcategory: "platform" },
  { name: "Slack Engineering", category: "engineering", subcategory: "company-blog" },

  // 👤 Founder/CTO Blogs
  { name: "DHH (David Heinemeier Hansson)", category: "engineering", subcategory: "founder-blog" },
  { name: "Joel on Software", category: "engineering", subcategory: "founder-blog" },
  { name: "Coding Horror", category: "engineering", subcategory: "founder-blog" },
  { name: "Paul Graham Essays", category: "product", subcategory: "founder-blog" },
  { name: "Sahil Lavingia", category: "product", subcategory: "founder-blog" },
  { name: "Kalzumeus (Patrick McKenzie)", category: "product", subcategory: "founder-blog" },
  { name: "A Smart Bear", category: "product", subcategory: "founder-blog" },
  { name: "Mitchell Hashimoto", category: "devops", subcategory: "founder-blog" },

  // 🧠 Individual Technical Bloggers - AI/ML
  { name: "Andrej Karpathy", category: "ai-ml", subcategory: "research" },
  { name: "Sebastian Raschka", category: "ai-ml", subcategory: "research" },
  { name: "Simon Willison", category: "ai-ml", subcategory: "applications" },

  // 🧠 Individual Technical Bloggers - Systems/Infrastructure
  { name: "Martin Kleppmann", category: "engineering", subcategory: "distributed-systems" },
  { name: "All Things Distributed", category: "engineering", subcategory: "distributed-systems" },
  { name: "Dan Luu", category: "engineering", subcategory: "performance" },
  { name: "Jessie Frazelle", category: "devops", subcategory: "containers" },
  { name: "Julia Evans", category: "engineering", subcategory: "systems" },
  { name: "Charity Majors", category: "devops", subcategory: "observability" },
  { name: "Software Doug", category: "engineering", subcategory: "search" },

  // 🧠 Individual Technical Bloggers - General
  { name: "Rakhim Davletkaliyev", category: "career", subcategory: "learning" },
  { name: "Rob Bowley", category: "engineering", subcategory: "general" },
  { name: "Black Sheep Code", category: "engineering", subcategory: "best-practices" },
  { name: "Surfing Complexity", category: "engineering", subcategory: "systems-thinking" },

  // 🛠️ Official Tool/Framework Blogs
  { name: "React Blog", category: "tools", subcategory: "frontend-framework" },
  { name: "Bun Blog", category: "tools", subcategory: "runtime" },
  { name: "PyTorch Blog", category: "ai-ml", subcategory: "framework" },
  { name: "Cursor Blog", category: "tools", subcategory: "editor" },
  { name: "Anthropic Alignment", category: "ai-ml", subcategory: "research" },

  // 📰 Developer Media & Tools
  { name: "Testing Catalog", category: "engineering", subcategory: "testing" },
  { name: "LogRocket Blog", category: "engineering", subcategory: "frontend" },
  { name: "ElevenLabs Blog", category: "ai-ml", subcategory: "voice-ai" },
  { name: "bui.app", category: "engineering", subcategory: "design-eng" },

  // 📊 News & Trends
  { name: "Exploding Topics", category: "news", subcategory: "trends" },
  { name: "Blog System5", category: "engineering", subcategory: "commentary" },
];

async function updateSourceCategories() {
  console.log("🏷️  Starting source categorization update...\n");

  let updatedCount = 0;
  let notFoundCount = 0;

  for (const item of sourceCategories) {
    try {
      const [existingSource] = await db
        .select()
        .from(sources)
        .where(eq(sources.name, item.name))
        .limit(1);

      if (existingSource) {
        await db
          .update(sources)
          .set({
            category: item.category,
            subcategory: item.subcategory,
          })
          .where(eq(sources.name, item.name));

        console.log(`  ✅ Updated: ${item.name} → ${item.category}/${item.subcategory}`);
        updatedCount++;
      } else {
        console.log(`  ⚠️  Not found: ${item.name}`);
        notFoundCount++;
      }
    } catch (error) {
      console.error(`  ❌ Error updating ${item.name}:`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Updated: ${updatedCount} sources`);
  console.log(`   - Not found: ${notFoundCount} sources`);
  console.log(`   - Total in mapping: ${sourceCategories.length}`);

  // Show breakdown by category
  const categoryCounts = sourceCategories.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`\n📂 By Category:`);
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`   - ${category}: ${count} sources`);
    });

  console.log("\n🎉 Categorization update complete!");
  process.exit(0);
}

// Run the update
updateSourceCategories().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
