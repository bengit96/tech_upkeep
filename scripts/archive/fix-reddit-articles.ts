import { db } from "../lib/db";
import { content } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function fixRedditArticles() {
  console.log("🔧 Fixing Reddit articles that are actually external links...");

  try {
    // Find all content marked as reddit
    const redditContent = await db
      .select()
      .from(content)
      .where(eq(content.sourceType, "reddit"));

    console.log(`📊 Found ${redditContent.length} items marked as reddit`);

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

          console.log(`✅ Fixed: ${item.title.substring(0, 50)}...`);
          console.log(`   Changed from: reddit/${item.sourceName}`);
          console.log(`   Changed to: ${newSourceType}/${newSourceName}`);
          fixedCount++;
        } catch (e) {
          console.error(`❌ Error parsing URL for: ${item.title.substring(0, 50)}...`, e);
        }
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} articles!`);
    console.log(`✅ Remaining reddit items: ${redditContent.length - fixedCount}`);
  } catch (error) {
    console.error("❌ Error fixing reddit articles:", error);
    process.exit(1);
  }

  process.exit(0);
}

fixRedditArticles();
