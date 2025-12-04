import { db } from "../lib/db";
import { categories } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function updateProductCategory() {
  console.log("🔄 Updating Product category to Product/Culture...");

  try {
    // Update the category name and description
    await db
      .update(categories)
      .set({
        name: "Product/Culture",
        description: "Product management, startup culture, company building, user research, design thinking, and organizational dynamics",
      })
      .where(eq(categories.slug, "product"));

    console.log("✅ Successfully updated Product category to Product/Culture");
  } catch (error) {
    console.error("❌ Error updating category:", error);
    process.exit(1);
  }

  process.exit(0);
}

updateProductCategory();
