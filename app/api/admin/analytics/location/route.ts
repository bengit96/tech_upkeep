import { NextRequest, NextResponse } from "next/server";
import { getLocationAudienceAnalytics } from "@/lib/services/analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get("timeRange") || "30");

    const analytics = await getLocationAudienceAnalytics(timeRange);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching location/audience analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch location/audience analytics" },
      { status: 500 }
    );
  }
}
