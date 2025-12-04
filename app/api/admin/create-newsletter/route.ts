import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content, categories, tags, contentTags, newsletterDrafts, newsletterConfig } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateNewsletterHTML } from "@/lib/newsletter-template";
import type { Content, Category, Tag } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";

interface ContentWithDetails extends Content {
  category?: Category | null;
  tags?: Tag[];
}

/**
 * POST /api/admin/create-newsletter
 * Creates a newsletter draft from accepted content
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { subject, preheaderText } = body;

    if (!subject) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }

    // Get accepted content
    const acceptedContent = await db
      .select()
      .from(content)
      .where(eq(content.status, "accepted"))
      .orderBy(desc(content.publishedAt))
      .limit(100);

    if (acceptedContent.length === 0) {
      return NextResponse.json(
        { error: "No accepted content to create newsletter" },
        { status: 400 }
      );
    }

    // Enrich content with categories and tags
    const enrichedContent: ContentWithDetails[] = [];

    for (const item of acceptedContent) {
      const category = item.categoryId
        ? (
            await db
              .select()
              .from(categories)
              .where(eq(categories.id, item.categoryId))
              .limit(1)
          )[0]
        : null;

      const itemTags = await db
        .select({ tag: tags })
        .from(contentTags)
        .leftJoin(tags, eq(contentTags.tagId, tags.id))
        .where(eq(contentTags.contentId, item.id));

      enrichedContent.push({
        ...item,
        category,
        tags: itemTags.map((t) => t.tag).filter(Boolean) as Tag[],
      });
    }

    // Group content by category
    const contentByCategory = new Map<string, ContentWithDetails[]>();
    for (const item of enrichedContent) {
      const categoryName = item.category?.name || "Uncategorized";
      if (!contentByCategory.has(categoryName)) {
        contentByCategory.set(categoryName, []);
      }
      contentByCategory.get(categoryName)!.push(item);
    }

    // Fetch newsletter config
    const [config] = await db.select().from(newsletterConfig).limit(1);

    // Generate HTML
    const htmlContent = generateNewsletterHTML({
      contentByCategory,
      headerContent: config?.headerContent || null,
      footerContent: config?.footerContent || null,
      includeTracking: false, // No tracking for preview
    });

    // Save as draft
    const contentIds = acceptedContent.map((c) => c.id);
    const [draft] = await db
      .insert(newsletterDrafts)
      .values({
        subject,
        preheaderText: preheaderText || "",
        htmlContent,
        contentIds: JSON.stringify(contentIds),
        contentCount: acceptedContent.length,
        status: "draft",
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: `Newsletter draft created with ${acceptedContent.length} articles`,
      draft: {
        id: draft.id,
        subject: draft.subject,
        contentCount: draft.contentCount,
        createdAt: draft.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating newsletter:", error);
    return NextResponse.json(
      { error: "Failed to create newsletter draft" },
      { status: 500 }
    );
  }
}
