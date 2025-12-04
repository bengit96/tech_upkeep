import { NextRequest, NextResponse } from "next/server";
import { getComprehensiveOverview } from "@/lib/services/analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get("timeRange") || "30");

    const overview = await getComprehensiveOverview(timeRange);

    return NextResponse.json(overview);
  } catch (error) {
    console.error("Error fetching comprehensive overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch comprehensive overview" },
      { status: 500 }
    );
  }
}
