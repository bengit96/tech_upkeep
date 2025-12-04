import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { SocialMediaGenerator } from "@/lib/services/social-media-generator";

export async function POST(request: Request) {
  try {
    // Check authentication
    await requireAdmin();

    // Get newsletter ID and platforms from request body
    const { newsletterDraftId, platforms } = await request.json();

    if (!newsletterDraftId) {
      return NextResponse.json(
        { error: "newsletterDraftId is required" },
        { status: 400 }
      );
    }

    // Default to TikTok if no platforms specified
    const requestedPlatforms = platforms || ["tiktok"];

    // Generate social media content
    const generator = new SocialMediaGenerator();
    const generatedContent = await generator.generateAllForNewsletter(
      parseInt(newsletterDraftId),
      requestedPlatforms
    );

    return NextResponse.json({
      message: "Social media content generated successfully",
      content: generatedContent,
      count: generatedContent.length,
    });
  } catch (error) {
    console.error("Error generating social media content:", error);
    return NextResponse.json(
      {
        error: "Failed to generate social media content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
