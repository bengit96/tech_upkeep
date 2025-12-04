import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeBatches, content } from "@/lib/db/schema";
import { eq, sql, and, or, inArray, notInArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/batches/merge
 * Merge selected batches and deconflict duplicates
 *
 * Request body:
 * {
 *   batchIds: number[],  // Batches to merge
 *   previewOnly?: boolean  // If true, just return stats without merging
 * }
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { batchIds, previewOnly = false } = await request.json();

    if (!batchIds || batchIds.length < 2) {
      return NextResponse.json(
        { error: "Please select at least 2 batches to merge" },
        { status: 400 }
      );
    }

    // Get all content from selected batches (only pending items)
    const batchContent = await db
      .select()
      .from(content)
      .where(
        and(
          inArray(content.batchId, batchIds),
          eq(content.status, "pending")
        )
      );

    // Get all accepted and rejected content (for deduplication)
    const reviewedContent = await db
      .select({
        link: content.link,
        normalizedUrl: content.normalizedUrl,
        contentHash: content.contentHash,
        title: content.title,
      })
      .from(content)
      .where(or(eq(content.status, "accepted"), eq(content.status, "discarded")));

    // Deduplication logic
    const dedupStats = {
      totalItems: batchContent.length,
      duplicatesWithinBatches: 0,
      alreadyAccepted: 0,
      alreadyRejected: 0,
      finalUniqueItems: 0,
      itemsToKeep: [] as number[],
      itemsToRemove: [] as number[],
    };

    const seenUrls = new Set<string>();
    const seenHashes = new Set<string>();
    const acceptedUrls = new Set(reviewedContent.filter(r => r.link).map(r => r.link));
    const acceptedHashes = new Set(reviewedContent.filter(r => r.contentHash).map(r => r.contentHash));

    // Check for similar titles in reviewed content
    const reviewedTitles = reviewedContent.map(r => r.title.toLowerCase());

    for (const item of batchContent) {
      let shouldKeep = true;
      let reason = "";

      // Check if already accepted or rejected
      if (item.link && acceptedUrls.has(item.link)) {
        shouldKeep = false;
        reason = "already_reviewed";
        // Determine if it was accepted or rejected by checking actual status
        const reviewedItem = await db
          .select({ status: content.status })
          .from(content)
          .where(eq(content.link, item.link))
          .limit(1);

        if (reviewedItem[0]?.status === "accepted") {
          dedupStats.alreadyAccepted++;
        } else {
          dedupStats.alreadyRejected++;
        }
      } else if (item.contentHash && acceptedHashes.has(item.contentHash)) {
        shouldKeep = false;
        reason = "already_reviewed";
        dedupStats.alreadyRejected++;
      }
      // Check for duplicates within the batches
      else if (item.link && seenUrls.has(item.link)) {
        shouldKeep = false;
        reason = "duplicate_in_batches";
        dedupStats.duplicatesWithinBatches++;
      } else if (item.contentHash && seenHashes.has(item.contentHash)) {
        shouldKeep = false;
        reason = "duplicate_in_batches";
        dedupStats.duplicatesWithinBatches++;
      }
      // Check for similar titles (fuzzy matching)
      else if (hasSimilarTitle(item.title, reviewedTitles)) {
        shouldKeep = false;
        reason = "similar_title_reviewed";
        dedupStats.alreadyRejected++;
      }

      if (shouldKeep) {
        dedupStats.itemsToKeep.push(item.id);
        if (item.link) seenUrls.add(item.link);
        if (item.contentHash) seenHashes.add(item.contentHash);
      } else {
        dedupStats.itemsToRemove.push(item.id);
      }
    }

    dedupStats.finalUniqueItems = dedupStats.itemsToKeep.length;

    // If preview only, just return stats
    if (previewOnly) {
      return NextResponse.json({
        preview: true,
        stats: {
          totalItems: dedupStats.totalItems,
          duplicatesWithinBatches: dedupStats.duplicatesWithinBatches,
          alreadyAccepted: dedupStats.alreadyAccepted,
          alreadyRejected: dedupStats.alreadyRejected,
          finalUniqueItems: dedupStats.finalUniqueItems,
        },
      });
    }

    // Actually perform the merge
    const mergeName = `Merged ${new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;

    // Create new merged batch
    const [mergedBatch] = await db
      .insert(scrapeBatches)
      .values({
        name: mergeName,
        status: "pending",
        totalItems: dedupStats.finalUniqueItems,
      })
      .returning();

    // Update items to keep - assign to new batch
    if (dedupStats.itemsToKeep.length > 0) {
      await db
        .update(content)
        .set({ batchId: mergedBatch.id })
        .where(inArray(content.id, dedupStats.itemsToKeep));
    }

    // Delete duplicate items
    if (dedupStats.itemsToRemove.length > 0) {
      await db
        .delete(content)
        .where(inArray(content.id, dedupStats.itemsToRemove));
    }

    // Mark original batches as merged
    await db
      .update(scrapeBatches)
      .set({ status: "merged" })
      .where(inArray(scrapeBatches.id, batchIds));

    return NextResponse.json({
      success: true,
      mergedBatch: {
        id: mergedBatch.id,
        name: mergedBatch.name,
        totalItems: mergedBatch.totalItems,
      },
      stats: {
        totalItems: dedupStats.totalItems,
        duplicatesWithinBatches: dedupStats.duplicatesWithinBatches,
        alreadyAccepted: dedupStats.alreadyAccepted,
        alreadyRejected: dedupStats.alreadyRejected,
        finalUniqueItems: dedupStats.finalUniqueItems,
        itemsRemoved: dedupStats.itemsToRemove.length,
      },
    });
  } catch (error) {
    console.error("Error merging batches:", error);
    return NextResponse.json(
      { error: "Failed to merge batches" },
      { status: 500 }
    );
  }
}

/**
 * Check if a title is similar to any in the list (fuzzy matching)
 */
function hasSimilarTitle(title: string, titles: string[]): boolean {
  const normalized = title.toLowerCase();

  for (const existingTitle of titles) {
    const similarity = calculateSimilarity(normalized, existingTitle);
    if (similarity > 0.85) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate similarity between two strings (Levenshtein-based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  const matrix: number[][] = [];

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[len2][len1];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}
