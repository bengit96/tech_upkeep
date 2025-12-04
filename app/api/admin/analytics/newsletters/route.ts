import { NextResponse } from "next/server";
import { getNewsletterComparison } from "@/lib/services/analytics";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const newsletters = await getNewsletterComparison(limit);

    // Calculate best performer
    const bestPerformer = newsletters.reduce(
      (best, current) =>
        current.engagementScore > best.engagementScore ? current : best,
      newsletters[0] || { engagementScore: 0 }
    );

    // Calculate averages
    const avgOpenRate =
      newsletters.reduce((sum, n) => sum + n.openRate, 0) / newsletters.length || 0;
    const avgClickRate =
      newsletters.reduce((sum, n) => sum + n.clickRate, 0) / newsletters.length || 0;

    return NextResponse.json({
      newsletters,
      bestPerformer,
      avgOpenRate: Math.round(avgOpenRate * 100) / 100,
      avgClickRate: Math.round(avgClickRate * 100) / 100,
    });
  } catch (error) {
    console.error("Error fetching newsletter comparison:", error);
    return NextResponse.json(
      { error: "Failed to fetch newsletter comparison" },
      { status: 500 }
    );
  }
}
