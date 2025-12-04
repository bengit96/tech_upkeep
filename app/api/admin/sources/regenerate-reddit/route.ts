import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sources, content } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

const redditSources = [
  {
    name: "r/programming",
    slug: "reddit-programming",
    type: "reddit",
    url: "https://www.reddit.com/r/programming.json",
    description: "Programming subreddit",
    isActive: true,
    metadata: JSON.stringify({ subreddit: "programming" }),
  },
  {
    name: "r/webdev",
    slug: "reddit-webdev",
    type: "reddit",
    url: "https://www.reddit.com/r/webdev.json",
    description: "Web development subreddit",
    isActive: true,
    metadata: JSON.stringify({ subreddit: "webdev" }),
  },
  {
    name: "r/MachineLearning",
    slug: "reddit-machinelearning",
    type: "reddit",
    url: "https://www.reddit.com/r/MachineLearning.json",
    description: "Machine Learning subreddit",
    isActive: true,
    metadata: JSON.stringify({ subreddit: "MachineLearning" }),
  },
  {
    name: "r/devops",
    slug: "reddit-devops",
    type: "reddit",
    url: "https://www.reddit.com/r/devops.json",
    description: "DevOps subreddit",
    isActive: true,
    metadata: JSON.stringify({ subreddit: "devops" }),
  },
];

/**
 * POST /api/admin/sources/regenerate-reddit
 * Regenerates all Reddit sources with clean defaults
 */
export async function POST() {
  try {
    await requireAdmin();
    let updatedCount = 0;
    let createdCount = 0;

    for (const source of redditSources) {
      // Check if source exists by slug
      const [existing] = await db
        .select()
        .from(sources)
        .where(eq(sources.slug, source.slug))
        .limit(1);

      if (existing) {
        // Update existing source
        await db
          .update(sources)
          .set({
            name: source.name,
            type: source.type as any,
            url: source.url,
            description: source.description,
            isActive: source.isActive,
            metadata: source.metadata,
          })
          .where(eq(sources.id, existing.id));
        updatedCount++;
        console.log(`✅ Updated Reddit source: ${source.name}`);
      } else {
        // Create new source
        await db
          .insert(sources)
          .values(source);
        createdCount++;
        console.log(`✅ Created Reddit source: ${source.name}`);
      }
    }

    // Fix existing articles that are marked as reddit but are external links
    console.log("🔧 Fixing existing Reddit articles...");
    const redditContent = await db
      .select()
      .from(content)
      .where(eq(content.sourceType, "reddit"));

    let fixedCount = 0;

    for (const item of redditContent) {
      // Check if the link is actually an external link (not reddit.com)
      const isActualRedditLink = item.link.includes('reddit.com') || item.link.includes('redd.it');

      if (!isActualRedditLink) {
        try {
          const url = new URL(item.link);
          const hostname = url.hostname.replace('www.', '');

          let newSourceType: string;
          let newSourceName: string;

          // Detect Medium articles
          if (hostname.includes('medium.com') || item.link.includes('/@')) {
            newSourceType = "medium";
            newSourceName = hostname;
          } else {
            newSourceType = "article";
            newSourceName = hostname;
          }

          // Update the content
          await db
            .update(content)
            .set({
              sourceType: newSourceType,
              sourceName: newSourceName,
            })
            .where(eq(content.id, item.id));

          fixedCount++;
        } catch (e) {
          console.error(`Error parsing URL for: ${item.title}`, e);
        }
      }
    }

    console.log(`✅ Fixed ${fixedCount} misclassified Reddit articles`);

    return NextResponse.json({
      success: true,
      message: `Reddit sources regenerated! Sources - Updated: ${updatedCount}, Created: ${createdCount}. Fixed ${fixedCount} misclassified articles.`,
      stats: {
        sources: {
          updated: updatedCount,
          created: createdCount,
          total: redditSources.length,
        },
        articles: {
          fixed: fixedCount,
        },
      },
    });
  } catch (error) {
    console.error("Error regenerating Reddit sources:", error);
    return NextResponse.json(
      { error: "Failed to regenerate Reddit sources" },
      { status: 500 }
    );
  }
}
