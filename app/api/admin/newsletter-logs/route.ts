import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSends, users, content } from "@/lib/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/newsletter-logs
 * Gets newsletter send logs grouped by batch (timestamp)
 */
export async function GET() {
  try {
    await requireAdmin();
    // Get all newsletter sends with user info
    const sends = await db
      .select({
        id: newsletterSends.id,
        userEmail: users.email,
        sentAt: newsletterSends.sentAt,
        contentCount: newsletterSends.contentCount,
        status: newsletterSends.status,
        resendEmailId: newsletterSends.resendEmailId,
      })
      .from(newsletterSends)
      .leftJoin(users, eq(newsletterSends.userId, users.id))
      .orderBy(desc(newsletterSends.sentAt))
      .limit(500); // Limit to last 500 sends

    // Group by batch (sentAt timestamp rounded to nearest minute)
    interface BatchStats {
      sentAt: Date;
      totalSent: number;
      successCount: number;
      failedCount: number;
      contentCount: number;
      emails: Array<{
        id: number;
        email: string;
        status: string;
        resendEmailId: string | null;
      }>;
    }

    const batches = new Map<string, BatchStats>();

    sends.forEach((send) => {
      if (!send.sentAt) return;

      // Round to nearest minute for batching
      const batchKey = new Date(send.sentAt).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

      if (!batches.has(batchKey)) {
        batches.set(batchKey, {
          sentAt: new Date(send.sentAt),
          totalSent: 0,
          successCount: 0,
          failedCount: 0,
          contentCount: send.contentCount || 0,
          emails: [],
        });
      }

      const batch = batches.get(batchKey)!;
      batch.totalSent++;

      if (send.status === "sent") {
        batch.successCount++;
      } else if (send.status === "failed") {
        batch.failedCount++;
      }

      batch.emails.push({
        id: send.id,
        email: send.userEmail || "Unknown",
        status: send.status || "unknown",
        resendEmailId: send.resendEmailId,
      });
    });

    // Convert map to array and sort by date descending
    const batchesArray = Array.from(batches.values()).sort(
      (a, b) => b.sentAt.getTime() - a.sentAt.getTime()
    );

    // Get stats
    const totalBatches = batchesArray.length;
    const recentBatch = batchesArray[0];

    return NextResponse.json({
      success: true,
      stats: {
        totalBatches,
        recentBatch: recentBatch
          ? {
              sentAt: recentBatch.sentAt,
              totalSent: recentBatch.totalSent,
              successCount: recentBatch.successCount,
              failedCount: recentBatch.failedCount,
            }
          : null,
      },
      batches: batchesArray.slice(0, 10), // Return only last 10 batches
    });
  } catch (error) {
    console.error("Error fetching newsletter logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch newsletter logs" },
      { status: 500 }
    );
  }
}
