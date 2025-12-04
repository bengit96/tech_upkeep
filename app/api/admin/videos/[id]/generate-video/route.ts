import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { VideoGenerator } from "@/lib/services/video-generator";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const videoGenerationId = parseInt(params.id);
    const body = await request.json();
    const { resolution } = body;

    const videoGenerator = new VideoGenerator();

    // Actually generate the video with Google Veo
    const result = await videoGenerator.generateVideoWithVeo(
      videoGenerationId,
      resolution || "720p"
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error generating video:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate video", details: message },
      { status: 500 }
    );
  }
}
