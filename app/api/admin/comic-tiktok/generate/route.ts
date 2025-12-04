import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ComicTikTokGenerator } from "@/lib/services/comic-tiktok-generator";

export async function POST(request: Request) {
  try {
    // Check authentication
    await requireAdmin();

    // Get content IDs from request
    const { contentIds } = await request.json();

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return NextResponse.json(
        { error: "contentIds array is required" },
        { status: 400 }
      );
    }

    // Initialize generator
    const generator = new ComicTikTokGenerator();

    // Generate comic episode
    console.log("🎬 Generating comic TikTok episode...\n");
    const episode = await generator.generateComicEpisode(contentIds);

    if (!episode) {
      return NextResponse.json(
        { error: "Failed to generate comic episode" },
        { status: 500 }
      );
    }

    console.log(
      `✅ Comic episode #${episode.episodeNumber} generated successfully\n`
    );

    return NextResponse.json({
      success: true,
      message: `Comic TikTok Episode #${episode.episodeNumber} generated successfully!`,
      episode: {
        episodeNumber: episode.episodeNumber,
        newsTitle: episode.newsTitle,
        mainTake: episode.mainTake,
        hook: episode.hook,
        theme: episode.theme,
        slides: episode.slides.map((slide) => ({
          slideNumber: slide.slideNumber,
          character: slide.character,
          dialogue: slide.dialogue,
          narration: slide.narration,
          imagePrompt: slide.imagePrompt,
        })),
        hashtags: episode.hashtags,
      },
      nextSteps: [
        "For each slide:",
        "1. Copy the IMAGE PROMPT to Gemini/Leonardo.ai (set to illustrated comic style)",
        "2. Download the generated image",
        "3. Create a TikTok slide in Canva with the image + slide text",
        "4. Add the NARRATION as voice-over",
        "5. Post all slides sequentially on TikTok with the HOOK as your caption",
        `6. Use hashtags: ${episode.hashtags}`,
      ],
    });
  } catch (error) {
    console.error("❌ Error generating comic TikTok:", error);
    return NextResponse.json(
      {
        error: "Failed to generate comic TikTok",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
