import { NextResponse } from "next/server";
import { getContentIntelligence } from "@/lib/services/analytics";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get("timeRange") || "30");

    const intelligence = await getContentIntelligence(timeRange);

    return NextResponse.json({
      ...intelligence,
      timeRange,
    });
  } catch (error) {
    console.error("Error fetching content intelligence:", error);
    return NextResponse.json(
      { error: "Failed to fetch content intelligence" },
      { status: 500 }
    );
  }
}
