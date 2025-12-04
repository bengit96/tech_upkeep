import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialMediaPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ImageGenerator } from "@/lib/services/image-generator";
import { SlideContentAnalyzer } from "@/lib/services/slide-content-analyzer";
import JSZip from "jszip";
import { requireAdmin } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";

const SLIDES_DIR = path.join(process.cwd(), "public", "assets", "slides");

// Ensure directory exists
if (!fs.existsSync(SLIDES_DIR)) {
  fs.mkdirSync(SLIDES_DIR, { recursive: true });
}

/**
 * Save individual images to assets directory
 */
function saveImagesToAssets(
  postId: number,
  images: Array<{ index: number; buffer: Buffer; filename: string }>,
  articles: Array<any>,
  metadata: any
): string[] {
  const timestamp = Date.now();
  const savedPaths: string[] = [];

  // Create a directory for this generation
  const genDir = path.join(SLIDES_DIR, `post-${postId}-${timestamp}`);
  fs.mkdirSync(genDir, { recursive: true });

  // Save each image
  for (const image of images) {
    const imagePath = path.join(genDir, image.filename);
    fs.writeFileSync(imagePath, image.buffer);
    // Store relative path from public
    savedPaths.push(
      `/assets/slides/post-${postId}-${timestamp}/${image.filename}`
    );
  }

  // Save comprehensive metadata JSON
  const metadataFile = {
    postId,
    timestamp,
    generatedAt: new Date().toISOString(),
    totalImages: images.length,
    mode: metadata.mode || "auto",
    phase1: metadata.phase1 || null,
    phase2: metadata.phase2 || null,
    articles: articles.map((a) => ({
      id: a.id,
      title: a.title,
      link: a.link,
      category: a.categoryId ? `Category ${a.categoryId}` : undefined,
      summary: a.summary?.substring(0, 200),
    })),
    images: images.map((img, idx) => ({
      index: img.index,
      filename: img.filename,
      path: savedPaths[idx],
      type: idx === 0 ? "hook" : idx === images.length - 1 ? "cta" : "content",
      articleId:
        idx > 0 && idx < images.length - 1 ? articles[idx - 1]?.id : null,
    })),
  };

  fs.writeFileSync(
    path.join(genDir, "metadata.json"),
    JSON.stringify(metadataFile, null, 2)
  );

  console.log(`📁 Saved ${images.length} images to ${genDir}`);
  return savedPaths;
}

/**
 * POST - Generate TikTok slides with auto or manual article selection
 * Supports Phase 1 (article selection) and Phase 2 (slide generation)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const postId = parseInt(params.id);

    const body = await request.json();
    const {
      mode = "auto",
      articleIds,
      hookPatternId,
      onlyFirstSlide,
    } = body as {
      mode?: "auto" | "manual";
      articleIds?: number[];
      hookPatternId?: string;
      onlyFirstSlide?: boolean;
    };

    console.log(
      `\n🎬 Starting TikTok slide generation (Mode: ${mode.toUpperCase()})`
    );

    // Get the post
    const [post] = await db
      .select()
      .from(socialMediaPosts)
      .where(eq(socialMediaPosts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get newsletter and all articles
    const { content: contentTable, newsletterDrafts } = await import(
      "@/lib/db/schema"
    );

    const [newsletter] = await db
      .select()
      .from(newsletterDrafts)
      .where(eq(newsletterDrafts.id, post.newsletterDraftId))
      .limit(1);

    const allArticles = await db
      .select()
      .from(contentTable)
      .where(eq(contentTable.newsletterDraftId, post.newsletterDraftId))
      .limit(50);

    let selectedArticles: typeof allArticles;
    let phase1Metadata: any = null;
    let phase2Metadata: any = null;

    if (mode === "manual") {
      // MANUAL MODE: Use user-provided article IDs
      console.log(
        `📝 Manual mode: Using ${articleIds?.length || 0} user-selected articles`
      );

      if (!Array.isArray(articleIds) || articleIds.length === 0) {
        return NextResponse.json(
          { error: "articleIds is required for manual mode" },
          { status: 400 }
        );
      }

      const articleById = new Map(allArticles.map((a: any) => [a.id, a]));
      selectedArticles = articleIds
        .map((id) => articleById.get(id))
        .filter(Boolean) as typeof allArticles;

      if (selectedArticles.length === 0) {
        return NextResponse.json(
          { error: "No valid articles found" },
          { status: 400 }
        );
      }

      phase1Metadata = {
        mode: "manual",
        selectedCount: selectedArticles.length,
        articleIds: articleIds,
      };

      console.log(`✅ Manual selection: ${selectedArticles.length} articles`);
    } else {
      // AUTO MODE: AI Phase 1 - Select best articles
      console.log(`🤖 Auto mode: Running Phase 1 (AI article selection)`);

      const analyzer = new SlideContentAnalyzer();
      const selection = await analyzer.selectBestArticlesForTikTok(
        allArticles.map((a) => ({
          title: a.title,
          summary: a.summary || "",
          category: undefined, // Category name not directly available without join
          source: a.sourceName || undefined,
          link: a.link || undefined,
        }))
      );

      // Map selected articles back to full article objects
      const selectedTitles = new Set(
        selection.selectedArticles.map((a) => a.title)
      );
      selectedArticles = allArticles.filter((a) => selectedTitles.has(a.title));

      phase1Metadata = {
        mode: "auto",
        theme: selection.theme,
        reasoning: selection.reasoning,
        selectedCount: selectedArticles.length,
        articleTitles: selection.selectedArticles.map((a) => a.title),
      };

      console.log(`\n📊 PHASE 1 COMPLETE:`);
      console.log(`   Theme: "${selection.theme}"`);
      console.log(`   Selected: ${selectedArticles.length} articles`);
      console.log(`   Reasoning: ${selection.reasoning}`);
    }

    // PHASE 2: Generate slides with selected articles
    console.log(`\n🎨 Running Phase 2 (Slide generation with theme)`);

    const imageGenerator = new ImageGenerator();
    const images = await imageGenerator.generateImages(
      post.platform,
      post.content,
      post.title || "Social Media Post",
      post.hashtags || "",
      selectedArticles,
      "ai", // Always use AI mode for better quality
      hookPatternId
    );

    phase2Metadata = {
      totalSlides: images.length,
      articleCount: selectedArticles.length,
    };

    console.log(`✅ Phase 2 complete: Generated ${images.length} slides`);

    // Generate comprehensive TikTok caption
    let caption = ``;

    // Add hook if in auto mode and we have Phase 1 data
    if (mode === "auto" && phase1Metadata?.theme) {
      caption += `🔥 ${phase1Metadata.theme}\n\n`;
    } else {
      caption += `📱 This Week's Must-Know Tech News\n\n`;
    }

    // Add article list with links
    selectedArticles.forEach((article, index) => {
      caption += `${index + 1}. ${article.title}\n`;
      caption += `   🔗 ${article.link}\n\n`;
    });

    // Add CTA and hashtags
    caption += `\n💡 Want more curated tech news delivered to your inbox?\n`;
    caption += `Subscribe to our newsletter: techupkeep.dev\n\n`;

    // Generate relevant hashtags
    const hashtags = [
      "#techNews",
      "#softwareEngineering",
      "#coding",
      "#developer",
      "#techUpkeep",
      "#programming",
      "#webdev",
      "#tech",
      "#softwareDeveloper",
      "#developerNews",
    ].join(" ");

    caption += hashtags;

    // If auto mode, add theme info to caption for reference
    if (mode === "auto" && phase1Metadata) {
      caption += `\n\n---\n📊 Content Strategy:\nTheme: ${phase1Metadata.theme}\nReasoning: ${phase1Metadata.reasoning}`;
    }

    // Save images to assets directory with metadata
    const savedPaths = saveImagesToAssets(postId, images, selectedArticles, {
      mode,
      phase1: phase1Metadata,
      phase2: phase2Metadata,
    });

    console.log(`📁 Saved ${savedPaths.length} images to assets directory`);

    // If only the first slide (hook) is requested, return a single PNG
    if (onlyFirstSlide) {
      const first = images[0];
      const hookFilename = `tiktok_hook_${postId}.png`;
      return new NextResponse(new Uint8Array(first.buffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${hookFilename}"`,
          "Content-Length": first.buffer.length.toString(),
        },
      });
    }

    // Create ZIP file
    const zip = new JSZip();

    // Add images to ZIP
    for (const image of images) {
      zip.file(image.filename, image.buffer);
    }

    // Add caption to ZIP
    zip.file("tiktok_caption.txt", caption);

    // Add metadata JSON for reference
    const metadataJson = {
      generatedAt: new Date().toISOString(),
      mode,
      phase1: phase1Metadata,
      phase2: phase2Metadata,
      articles: selectedArticles.map((a) => ({
        id: a.id,
        title: a.title,
        link: a.link,
        category: a.categoryId ? `Category ${a.categoryId}` : undefined,
      })),
    };
    zip.file("metadata.json", JSON.stringify(metadataJson, null, 2));

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    const platformName = post.platform.replace(/-/g, "_");
    const modeLabel = mode === "auto" ? "auto" : "manual";
    const filename = `${platformName}_slides_${modeLabel}_${postId}.zip`;

    console.log(
      `\n✅ SUCCESS: ZIP file ready for download (${zipBuffer.length} bytes)`
    );
    console.log(`   Filename: ${filename}`);
    console.log(`   Contents: ${images.length} images + caption + metadata\n`);

    // Return ZIP file
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("❌ Error generating images:", error);
    return NextResponse.json(
      {
        error: "Failed to generate images",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
