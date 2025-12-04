import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeBatches, content } from "@/lib/db/schema";
import { eq, sql, and, or, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/batches
 * List all scrape batches with item counts
 */
export async function GET() {
  try {
    await requireAdmin();
    const batches = await db
      .select({
        id: scrapeBatches.id,
        name: scrapeBatches.name,
        status: scrapeBatches.status,
        totalItems: scrapeBatches.totalItems,
        createdAt: scrapeBatches.createdAt,
      })
      .from(scrapeBatches)
      .orderBy(sql`${scrapeBatches.createdAt} DESC`);

    // Get pending, accepted, and rejected counts for each batch
    const batchesWithCounts = await Promise.all(
      batches.map(async (batch) => {
        const counts = await db
          .select({
            status: content.status,
            count: sql<number>`count(*)`,
          })
          .from(content)
          .where(eq(content.batchId, batch.id))
          .groupBy(content.status);

        const statusCounts = {
          pending: 0,
          accepted: 0,
          discarded: 0,
        };

        counts.forEach((c) => {
          if (c.status === "pending") statusCounts.pending = Number(c.count);
          if (c.status === "accepted") statusCounts.accepted = Number(c.count);
          if (c.status === "discarded")
            statusCounts.discarded = Number(c.count);
        });

        return {
          ...batch,
          counts: statusCounts,
        };
      })
    );

    return NextResponse.json({ batches: batchesWithCounts });
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}
