import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { videoGenerations } from "@/lib/db/schema";
import { VideoGenerator } from "@/lib/services/video-generator";

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { articleId, style, duration } = body;

    if (!articleId || typeof articleId !== "number") {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    const videoGenerator = new VideoGenerator();

    // Generate video prompt
    console.log(`🎬 Generating video prompt for article ${articleId}...`);
    const videoPrompt = await videoGenerator.generateVideoPrompt({
      articleId,
      style: style || "tech-news",
      duration: duration || 15,
    });

    // Save to database
    const [videoGeneration] = await db
      .insert(videoGenerations)
      .values({
        contentId: articleId,
        visualPrompt: videoPrompt.visualPrompt,
        narrationScript: videoPrompt.narrationScript,
        style: videoPrompt.style,
        duration: videoPrompt.duration,
        status: "pending",
      })
      .returning();

    console.log(`✅ Video prompt generated (ID: ${videoGeneration.id})`);

    return NextResponse.json({
      success: true,
      videoGeneration,
      message: "Video prompt generated successfully",
      note: "Google Veo integration coming soon. You can manually use the generated prompts with Google's Veo platform.",
    });
  } catch (error) {
    console.error("Error generating video prompt:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate video prompt", details: message },
      { status: 500 }
    );
  }
}
