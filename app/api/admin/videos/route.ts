import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { videoGenerations, content } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");

    if (contentId) {
      // Get videos for specific article
      const videos = await db
        .select({
          id: videoGenerations.id,
          visualPrompt: videoGenerations.visualPrompt,
          narrationScript: videoGenerations.narrationScript,
          style: videoGenerations.style,
          duration: videoGenerations.duration,
          status: videoGenerations.status,
          veoJobId: videoGenerations.veoJobId,
          videoUrl: videoGenerations.videoUrl,
          thumbnailUrl: videoGenerations.thumbnailUrl,
          errorMessage: videoGenerations.errorMessage,
          completedAt: videoGenerations.completedAt,
          createdAt: videoGenerations.createdAt,
          article: {
            id: content.id,
            title: content.title,
            link: content.link,
          },
        })
        .from(videoGenerations)
        .leftJoin(content, eq(videoGenerations.contentId, content.id))
        .where(eq(videoGenerations.contentId, parseInt(contentId)))
        .orderBy(desc(videoGenerations.createdAt))
        .limit(50);

      return NextResponse.json({ videos });
    }

    // Get all video generations
    const videos = await db
      .select({
        id: videoGenerations.id,
        visualPrompt: videoGenerations.visualPrompt,
        narrationScript: videoGenerations.narrationScript,
        style: videoGenerations.style,
        duration: videoGenerations.duration,
        status: videoGenerations.status,
        veoJobId: videoGenerations.veoJobId,
        videoUrl: videoGenerations.videoUrl,
        thumbnailUrl: videoGenerations.thumbnailUrl,
        errorMessage: videoGenerations.errorMessage,
        completedAt: videoGenerations.completedAt,
        createdAt: videoGenerations.createdAt,
        article: {
          id: content.id,
          title: content.title,
          link: content.link,
        },
      })
      .from(videoGenerations)
      .leftJoin(content, eq(videoGenerations.contentId, content.id))
      .orderBy(desc(videoGenerations.createdAt))
      .limit(100);

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching video generations:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch video generations", details: message },
      { status: 500 }
    );
  }
}
