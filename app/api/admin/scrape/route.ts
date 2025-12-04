import { NextResponse } from "next/server";
import { ContentAggregator } from "@/lib/services/aggregator";
import { initializeDefaultData } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    console.log("🔄 Manual content aggregation triggered");

    // Initialize default data if needed
    await initializeDefaultData();

    // Optional tuning via query/body
    let maxAgeHours: number | undefined;
    let minRedditScore: number | undefined;
    let minRedditUpvoteRatio: number | undefined;
    let debug: boolean | undefined;

    const url = new URL(request.url);
    const params = url.searchParams;
    if (params.get("maxAgeHours"))
      maxAgeHours = Number(params.get("maxAgeHours"));
    if (params.get("minRedditScore"))
      minRedditScore = Number(params.get("minRedditScore"));
    if (params.get("minRedditUpvoteRatio"))
      minRedditUpvoteRatio = Number(params.get("minRedditUpvoteRatio"));
    if (params.get("debug")) debug = params.get("debug") === "true";

    const aggregator = new ContentAggregator({
      maxAgeHours,
      minRedditScore,
      minRedditUpvoteRatio,
      debug,
    });
    const stats = await aggregator.aggregateAll();

    return NextResponse.json({
      success: true,
      message: `Successfully aggregated ${stats.saved} new items`,
      stats,
    });
  } catch (error) {
    console.error("Error in manual aggregation:", error);
    return NextResponse.json(
      {
        error: "Failed to aggregate content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
