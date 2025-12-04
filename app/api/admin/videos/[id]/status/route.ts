import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { VideoGenerator } from "@/lib/services/video-generator";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const videoGenerationId = parseInt(params.id);
    const videoGenerator = new VideoGenerator();

    // Check the status of the video generation
    const status = await videoGenerator.checkVideoStatus(videoGenerationId);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error("Error checking video status:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to check video status", details: message },
      { status: 500 }
    );
  }
}
