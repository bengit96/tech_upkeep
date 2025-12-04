import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, categories } from "@/lib/db/schema";
import { eq, desc, isNotNull } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    // Get all accepted content that has been sent
    const sentContent = await db
      .select({
        id: content.id,
        title: content.title,
        summary: content.summary,
        link: content.link,
        sourceType: content.sourceType,
        sourceName: content.sourceName,
        publishedAt: content.publishedAt,
        sentAt: content.sentAt,
        categoryId: content.categoryId,
        categoryName: categories.name,
      })
      .from(content)
      .leftJoin(categories, eq(content.categoryId, categories.id))
      .where(isNotNull(content.sentAt))
      .orderBy(desc(content.sentAt))
      .limit(100);

    // Group by send date
    const grouped = sentContent.reduce((acc, item) => {
      if (!item.sentAt) return acc;

      const dateKey = new Date(item.sentAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push({
        id: item.id,
        title: item.title,
        summary: item.summary,
        link: item.link,
        sourceType: item.sourceType,
        sourceName: item.sourceName,
        publishedAt: item.publishedAt,
        sentAt: item.sentAt,
        category: item.categoryName || 'Uncategorized',
      });

      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({ grouped });
  } catch (error) {
    console.error("Error fetching sent content:", error);
    return NextResponse.json(
      { error: "Failed to fetch sent content" },
      { status: 500 }
    );
  }
}
