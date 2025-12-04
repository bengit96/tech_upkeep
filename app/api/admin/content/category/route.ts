import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { contentId, categorySlug } = await request.json();

    // Get the category by slug
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Update the content's category
    await db
      .update(content)
      .set({ categoryId: category.id })
      .where(eq(content.id, contentId));

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Error updating content category:", error);
    return NextResponse.json(
      { error: "Failed to update content category" },
      { status: 500 }
    );
  }
}
