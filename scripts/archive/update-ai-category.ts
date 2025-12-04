import { db } from "../lib/db";
import { categories } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function updateAICategory() {
  console.log("🔄 Updating 'AI & Machine Learning' category to 'AI'...");

  try {
    const result = await db
      .update(categories)
      .set({ name: "AI" })
      .where(eq(categories.slug, "ai-machine-learning"));

    console.log("✅ Successfully updated category name from 'AI & Machine Learning' to 'AI'");
    console.log("   Note: The slug 'ai-machine-learning' remains unchanged to preserve references");
  } catch (error) {
    console.error("❌ Error updating category:", error);
    process.exit(1);
  }

  process.exit(0);
}

updateAICategory();
