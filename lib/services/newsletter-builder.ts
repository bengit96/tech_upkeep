import { db } from "@/lib/db";
import type { Content, Category, Tag } from "@/lib/db/schema";
import {
  content,
  categories,
  tags,
  contentTags,
  newsletterConfig,
} from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { generateNewsletterHTML } from "@/lib/newsletter-template";

export interface ContentWithDetails extends Content {
  category?: Category | null;
  tags?: Tag[];
}

export async function enrichContent(
  items: Content[]
): Promise<ContentWithDetails[]> {
  if (items.length === 0) return [];

  // Batch load categories
  const categoryIdSet = new Set<number>();
  for (const it of items) if (it.categoryId) categoryIdSet.add(it.categoryId);
  const categoryIds = Array.from(categoryIdSet);
  const categoryMap = new Map<number, Category>();
  if (categoryIds.length > 0) {
    const rows = await db
      .select()
      .from(categories)
      .where(inArray(categories.id, categoryIds));
    for (const row of rows) categoryMap.set(row.id, row as unknown as Category);
  }

  // Batch load tags per content
  const contentIds = items.map((i) => i.id);
  const tagRows = await db
    .select({
      contentId: contentTags.contentId,
      tag: tags,
    })
    .from(contentTags)
    .leftJoin(tags, eq(contentTags.tagId, tags.id))
    .where(inArray(contentTags.contentId, contentIds));

  const contentIdToTags = new Map<number, Tag[]>();
  for (const row of tagRows) {
    if (!row.tag) continue;
    const list = contentIdToTags.get(row.contentId) || [];
    list.push(row.tag as unknown as Tag);
    contentIdToTags.set(row.contentId, list);
  }

  // Build enriched items
  return items.map((it) => ({
    ...it,
    category: it.categoryId ? categoryMap.get(it.categoryId) || null : null,
    tags: contentIdToTags.get(it.id) || [],
  }));
}

export function groupByCategory(
  items: ContentWithDetails[]
): Map<string, ContentWithDetails[]> {
  const map = new Map<string, ContentWithDetails[]>();
  for (const item of items) {
    const name = item.category?.name || "Uncategorized";
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(item);
  }
  return map;
}

export async function getTaggedContentForDraft(
  draftId: number
): Promise<Content[]> {
  return await db
    .select()
    .from(content)
    .where(eq(content.newsletterDraftId, draftId))
    .orderBy(desc(content.publishedAt));
}

export async function buildHtmlForDraft(
  draftId: number,
  options?: {
    includeTracking?: boolean;
    userId?: number;
    newsletterSendId?: number;
  }
): Promise<string> {
  const items = await getTaggedContentForDraft(draftId);
  const enriched = await enrichContent(items);
  const contentByCategory = groupByCategory(enriched);
  const [config] = await db.select().from(newsletterConfig).limit(1);
  return generateNewsletterHTML({
    contentByCategory,
    headerContent: config?.headerContent || null,
    footerContent: config?.footerContent || null,
    includeTracking: options?.includeTracking ?? false,
    userId: options?.userId,
    newsletterSendId: options?.newsletterSendId,
  });
}

export async function buildHtmlFromContent(
  items: Content[],
  options?: {
    includeTracking?: boolean;
    userId?: number;
    newsletterSendId?: number;
  }
): Promise<string> {
  const enriched = await enrichContent(items);
  const contentByCategory = groupByCategory(enriched);
  const [config] = await db.select().from(newsletterConfig).limit(1);
  return generateNewsletterHTML({
    contentByCategory,
    headerContent: config?.headerContent || null,
    footerContent: config?.footerContent || null,
    includeTracking: options?.includeTracking ?? false,
    userId: options?.userId,
    newsletterSendId: options?.newsletterSendId,
  });
}
