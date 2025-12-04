import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ComicTikTokGenerator } from "@/lib/services/comic-tiktok-generator";

export async function GET(request: Request) {
  try {
    // Check authentication
    await requireAdmin();

    // Get recent content
    const generator = new ComicTikTokGenerator();
    const items = await generator.getRecentContent(15);

    return NextResponse.json({
      success: true,
      content: items,
      count: items.length,
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
