import OpenAI from "openai";
import { chatWithModelFallback } from "../utils/ai-fallback";
import { db } from "../db";
import { content, newsletterDrafts, socialMediaPosts } from "../db/schema";
import { eq } from "drizzle-orm";
import { HTMLSlideGenerator } from "./html-slide-generator";
import { SlideContentAnalyzer } from "./slide-content-analyzer";

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface NewsletterContent {
  id: number;
  title: string;
  summary: string;
  link: string;
  sourceName: string | null;
  sourceType: string;
  category?: string;
}

interface GeneratedContent {
  platform: string;
  contentType: string;
  title: string;
  content: string;
  hashtags: string;
  metadata?: string;
}

export class SocialMediaGenerator {
  private htmlGenerator = new HTMLSlideGenerator();
  private contentAnalyzer = new SlideContentAnalyzer();

  /**
   * Generate HTML slides for a platform with AI-powered content analysis
   */
  private async generateHTMLSlides(
    platform: string,
    textContent: string,
    subject: string,
    hashtags: string,
    articles?: Array<{ title: string; summary: string; category?: string }>
  ): Promise<string> {
    // Map social media platforms to HTML slide platforms
    let htmlPlatform:
      | "tiktok"
      | "instagram-square"
      | "instagram-story"
      | "twitter";

    switch (platform) {
      case "tiktok":
        htmlPlatform = "tiktok";
        break;
      case "instagram-feed":
        htmlPlatform = "instagram-square";
        break;
      case "instagram-stories":
      case "instagram-reels":
        htmlPlatform = "instagram-story";
        break;
      case "twitter-thread":
      case "twitter-single":
        htmlPlatform = "twitter";
        break;
      default:
        htmlPlatform = "tiktok"; // fallback
    }

    // Analyze content and generate dynamic slide data with article selection
    let slideData;
    let selectionMetadata = {};

    if (articles && articles.length > 0) {
      console.log(`\n🎬 Generating TikTok slides for ${articles.length} articles...`);
      slideData = await this.contentAnalyzer.analyzeAndGenerate(articles);

      // Store selection metadata for debugging
      selectionMetadata = {
        totalArticlesAvailable: articles.length,
        articlesSelected: slideData.slides?.length || 0,
        theme: slideData.subtitle || "N/A",
      };

      console.log(`\n✅ Slide generation complete!`);
      console.log(`   Theme: ${slideData.subtitle || "N/A"}`);
      console.log(`   Hook: "${slideData.hook}"`);
      console.log(`   Slides: ${slideData.slides?.length || 0}\n`);
    }

    const slideConfig = await this.htmlGenerator.parseContentToSlides(
      htmlPlatform,
      textContent,
      subject,
      hashtags,
      articles,
      slideData
    );

    return this.htmlGenerator.generateHTML(slideConfig);
  }

  /**
   * Generate social media content for a newsletter
   * Supports both TikTok and Twitter Thread generation
   */
  async generateAllForNewsletter(
    newsletterDraftId: number,
    platforms: ("tiktok" | "twitter-thread")[] = ["tiktok"]
  ): Promise<GeneratedContent[]> {
    // Get newsletter draft
    const [newsletter] = await db
      .select()
      .from(newsletterDrafts)
      .where(eq(newsletterDrafts.id, newsletterDraftId))
      .limit(1);

    if (!newsletter) {
      throw new Error("Newsletter not found");
    }

    // Get all content assigned to this newsletter
    const newsletterContent = await db
      .select()
      .from(content)
      .where(eq(content.newsletterDraftId, newsletterDraftId))
      .limit(50);

    if (newsletterContent.length === 0) {
      throw new Error("No content found in newsletter");
    }

    // Sort by virality factors: thumbnails, quality score, engagement score
    const sortByVirality = (items: typeof newsletterContent) => {
      return items.sort((a, b) => {
        // 1. Prioritize items with thumbnails (most important for visual platforms)
        const aThumbnail = a.thumbnailUrl ? 1 : 0;
        const bThumbnail = b.thumbnailUrl ? 1 : 0;
        if (aThumbnail !== bThumbnail) return bThumbnail - aThumbnail;

        // 2. Sort by quality score (virality indicator)
        const aQuality = a.qualityScore || 0;
        const bQuality = b.qualityScore || 0;
        if (aQuality !== bQuality) return bQuality - aQuality;

        // 3. Sort by engagement score (upvotes, views, etc.)
        const aEngagement = a.engagementScore || 0;
        const bEngagement = b.engagementScore || 0;
        return bEngagement - aEngagement;
      });
    };

    const prioritizedContent = sortByVirality([...newsletterContent]);

    // Generate content for requested platforms
    const generatedContent: GeneratedContent[] = [];

    for (const platform of platforms) {
      if (platform === "tiktok") {
        const tiktokScript = await this.generateTikTokScript(
          prioritizedContent,
          newsletter.subject
        );
        generatedContent.push(tiktokScript);
      } else if (platform === "twitter-thread") {
        const twitterThread = await this.generateTwitterThread(
          prioritizedContent,
          newsletter.subject
        );
        generatedContent.push(twitterThread);
      }
    }

    // Check if posts already exist for this newsletter
    const existingPosts = await db
      .select()
      .from(socialMediaPosts)
      .where(eq(socialMediaPosts.newsletterDraftId, newsletterDraftId));

    // Delete existing posts if any (to allow regeneration)
    if (existingPosts.length > 0) {
      await db
        .delete(socialMediaPosts)
        .where(eq(socialMediaPosts.newsletterDraftId, newsletterDraftId));
    }

    // Save generated content to database with HTML slides
    for (const postContent of generatedContent) {
      // Generate HTML slides for this content with dynamic visuals
      const htmlSlides = await this.generateHTMLSlides(
        postContent.platform,
        postContent.content,
        newsletter.subject,
        postContent.hashtags,
        prioritizedContent.map((item) => ({
          title: item.title,
          summary: item.summary || "",
          category: undefined, // Category name not available without join
        }))
      );

      // Store HTML in metadata along with existing metadata
      const existingMetadata = postContent.metadata
        ? JSON.parse(postContent.metadata)
        : {};
      const metadataWithHTML = JSON.stringify({
        ...existingMetadata,
        htmlSlides: htmlSlides,
      });

      await db.insert(socialMediaPosts).values({
        newsletterDraftId,
        platform: postContent.platform,
        contentType: postContent.contentType,
        title: postContent.title,
        content: postContent.content,
        hashtags: postContent.hashtags,
        metadata: metadataWithHTML,
        status: "draft",
      });
    }

    return generatedContent;
  }

  /**
   * Generate TikTok video script (30-60s)
   * Uses all suitable articles with thumbnails (not limited to 5)
   */
  private async generateTikTokScript(
    contents: any[],
    subject: string
  ): Promise<GeneratedContent> {
    // Use all articles (already prioritized by thumbnails and featured order)
    const topArticles = contents;

    if (!openai) {
      // Fallback without AI
      return this.generateTikTokScriptFallback(topArticles, subject);
    }

    try {
      const prompt = `You are a tech content creator making a TikTok video about the latest tech news.

Newsletter Subject: ${subject}

Available Articles (prioritized by featured status and thumbnails):
${topArticles.map((a, i) => `${i + 1}. ${a.title} - ${(a.summary || "").substring(0, 150)}...`).join("\n")}

Create a 30-60 second TikTok script with:
- HOOK (0-3s): Attention-grabbing opening
- MAIN CONTENT (3-45s): Include as many key points as suitable for the video (can go beyond 5 if the articles are great)
- CTA (45-60s): Call to action to subscribe to the newsletter

Prioritize articles with visual content potential (the first articles in the list have thumbnails).

Format as:
🎬 HOOK (0-3s):
[Your hook here]

📝 MAIN (3-45s):
• Point 1
• Point 2
• Point 3
• Point 4
• Point 5
[Add more points if suitable]

💡 CTA (45-60s):
[Your call to action]

🎨 VISUAL NOTES:
[Suggestions for text overlays and visuals - mention which articles have good thumbnail potential]

📌 PINNED COMMENT:
[A short, engaging comment to pin under the video that adds value, asks a question to drive engagement, or provides additional context. Should feel natural and encourage discussion. Max 150 characters.]

Keep it energetic, fast-paced, and engaging for developers.`;
      const { response } = await chatWithModelFallback(openai, {
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 700,
      });

      const scriptContent = response.choices[0]?.message?.content || "";

      return {
        platform: "tiktok",
        contentType: "script",
        title: `TikTok Script - ${subject}`,
        content: scriptContent,
        hashtags: "#tech #coding #developer #programming #techTok",
      };
    } catch (error) {
      console.error("Error generating TikTok script with AI:", error);
      // Fallback to template-based generation
      return this.generateTikTokScriptFallback(topArticles, subject);
    }
  }

  /**
   * Fallback TikTok script generator (no AI)
   */
  private generateTikTokScriptFallback(
    topArticles: any[],
    subject: string
  ): GeneratedContent {
    const scriptContent = `🎬 HOOK (0-3s):
"This week's tech news will blow your mind! 🤯"

📝 MAIN (3-45s):
${topArticles
  .slice(0, 3)
  .map((a, i) => `• ${a.title}`)
  .join("\n")}

💡 CTA (45-60s):
"Want these insights delivered to your inbox? Subscribe to techUpkeep() for bi-weekly tech updates! Link in bio 👆"

🎨 VISUAL NOTES:
- Text overlay for each article title
- Fast cuts between points
- Trending tech music
- End with newsletter logo

📌 PINNED COMMENT:
Which topic interests you most? Drop a comment! 👇`;

    return {
      platform: "tiktok",
      contentType: "script",
      title: `TikTok Script - ${subject}`,
      content: scriptContent,
      hashtags: "#tech #coding #developer #programming #techTok",
    };
  }

  /**
   * Generate Instagram Feed Post
   */
  private async generateInstagramFeed(
    contents: any[],
    subject: string
  ): Promise<GeneratedContent> {
    const topArticles = contents.slice(0, 5);

    if (!openai) {
      return this.generateInstagramFeedFallback(topArticles, subject);
    }

    try {
      const prompt = `You are a tech influencer creating an Instagram feed post about tech news.

Newsletter Subject: ${subject}

Top Articles:
${topArticles.map((a, i) => `${i + 1}. ${a.title}`).join("\n")}

Create an engaging Instagram caption that:
- Opens with an attention-grabbing hook
- Lists 3-5 key insights
- Ends with a CTA to subscribe
- Uses emojis appropriately
- Is under 2200 characters

Also suggest 5 slides for a carousel post.`;
      const { response } = await chatWithModelFallback(openai, {
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 800,
      });

      const captionContent = response.choices[0]?.message?.content || "";

      return {
        platform: "instagram-feed",
        contentType: "caption",
        title: `Instagram Feed - ${subject}`,
        content: captionContent,
        hashtags:
          "#tech #coding #developer #programming #softwareengineering #webdev #devlife #100daysofcode #techcommunity #learntocode",
        metadata: JSON.stringify({ carouselSlides: 5 }),
      };
    } catch (error) {
      console.error("Error generating Instagram feed with AI:", error);
      // Fallback to template-based generation
      return this.generateInstagramFeedFallback(topArticles, subject);
    }
  }

  /**
   * Fallback Instagram Feed generator
   */
  private generateInstagramFeedFallback(
    topArticles: any[],
    subject: string
  ): GeneratedContent {
    const caption = `📦 This week in tech!

${topArticles
  .slice(0, 5)
  .map((a, i) => `${i + 1}️⃣ ${a.title}`)
  .join("\n\n")}

💡 Want these insights delivered straight to your inbox? Subscribe to techUpkeep() for bi-weekly curated tech content!

🔗 Link in bio

---

📱 CAROUSEL SLIDES:
• Slide 1: Cover with title
• Slide 2-4: Key insights (one per slide)
• Slide 5: CTA + newsletter link`;

    return {
      platform: "instagram-feed",
      contentType: "caption",
      title: `Instagram Feed - ${subject}`,
      content: caption,
      hashtags:
        "#tech #coding #developer #programming #softwareengineering #webdev #devlife #100daysofcode #techcommunity #learntocode",
      metadata: JSON.stringify({ carouselSlides: 5 }),
    };
  }

  /**
   * Generate Instagram Stories (5 slides)
   */
  private async generateInstagramStories(
    contents: any[],
    subject: string
  ): Promise<GeneratedContent> {
    const topArticles = contents.slice(0, 5);

    const getSnippet = (article: any) => {
      return article?.summary ? article.summary.substring(0, 100) : "";
    };

    const storiesContent = `📱 INSTAGRAM STORIES (5 SLIDES)

SLIDE 1 (Opening):
"📦 New techUpkeep() newsletter dropped!
Swipe for this week's top tech updates 👉"

SLIDE 2:
${topArticles[0]?.title || "Featured Article"}
${getSnippet(topArticles[0])}...
[Link sticker to article]

SLIDE 3:
${topArticles[1]?.title || "Featured Article #2"}
${getSnippet(topArticles[1])}...
[Link sticker to article]

SLIDE 4:
${topArticles[2]?.title || "Featured Article #3"}
${getSnippet(topArticles[2])}...
[Link sticker to article]

SLIDE 5 (CTA):
"Want more curated tech content?
📧 Subscribe to techUpkeep()
👆 Link in bio"
[Link sticker to subscribe page]

🎨 DESIGN NOTES:
- Use gradient backgrounds (blue-purple)
- Bold, readable fonts
- Each slide: 3-5 seconds
- Use poll/quiz stickers for engagement`;

    return {
      platform: "instagram-stories",
      contentType: "script",
      title: `Instagram Stories - ${subject}`,
      content: storiesContent,
      hashtags: "",
      metadata: JSON.stringify({ slides: 5, duration: "15-25s" }),
    };
  }

  /**
   * Generate Instagram Reels Script
   */
  private async generateInstagramReels(
    contents: any[],
    subject: string
  ): Promise<GeneratedContent> {
    const topArticles = contents.slice(0, 3);

    const reelsContent = `🎬 INSTAGRAM REELS SCRIPT (30-45s)

🎯 HOOK (0-3s):
"3 tech updates you missed this week 👀"

📝 CONTENT (3-40s):
1. ${topArticles[0]?.title || "First topic"}
   [Quick 10-second explanation]

2. ${topArticles[1]?.title || "Second topic"}
   [Quick 10-second explanation]

3. ${topArticles[2]?.title || "Third topic"}
   [Quick 10-second explanation]

💡 CTA (40-45s):
"Subscribe to techUpkeep() for more tech insights!
Link in bio 👆"

🎨 VISUAL NOTES:
- Fast cuts between topics
- Text overlays for each point
- Trending audio
- Dynamic transitions
- End screen with newsletter logo

🎵 MUSIC: Trending tech/productivity track`;

    return {
      platform: "instagram-reels",
      contentType: "script",
      title: `Instagram Reels - ${subject}`,
      content: reelsContent,
      hashtags: "#reels #instagramreels #tech #coding #developer",
      metadata: JSON.stringify({ duration: "30-45s" }),
    };
  }


  /**
   * Generate Twitter Thread with AI
   */
  private async generateTwitterThread(
    contents: any[],
    subject: string
  ): Promise<GeneratedContent> {
    const topArticles = contents.slice(0, 5);

    if (!openai) {
      return this.generateTwitterThreadFallback(topArticles, subject);
    }

    try {
      const prompt = `You are a tech influencer creating a Twitter thread about this week's tech news.

Newsletter Subject: ${subject}

Top Articles:
${topArticles.map((a, i) => `${i + 1}. ${a.title}\n   ${a.summary?.substring(0, 150) || ""}`).join("\n\n")}

Create a Twitter thread (6-8 tweets) that:
- Tweet 1: Hook that grabs attention + thread announcement
- Tweets 2-6: Each tweet covers one article with a key insight
- Final tweet: Call to action + newsletter link

Requirements:
- Each tweet must be under 280 characters
- Use emojis strategically (not too many)
- Make it engaging for developers
- Number each tweet (1/8, 2/8, etc.)
- Include relevant hashtags in the final tweet only

Format: Return each tweet separated by "---"`;

      const { response } = await chatWithModelFallback(openai, {
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const threadContent = response.choices[0]?.message?.content || "";

      return {
        platform: "twitter-thread",
        contentType: "thread",
        title: `Twitter Thread - ${subject}`,
        content: threadContent,
        hashtags: "#TechTwitter #DevCommunity #Programming",
      };
    } catch (error) {
      console.error("Error generating Twitter thread with AI:", error);
      return this.generateTwitterThreadFallback(topArticles, subject);
    }
  }

  /**
   * Fallback Twitter Thread generator
   */
  private generateTwitterThreadFallback(
    topArticles: any[],
    subject: string
  ): GeneratedContent {
    const tweets = [
      `🧵 This week's tech insights you can't miss\n\n${topArticles.length} updates that are changing how we build software 👇`,
    ];

    topArticles.forEach((article, idx) => {
      const summary = article.summary?.substring(0, 200) || "";
      tweets.push(`${idx + 2}/${topArticles.length + 2} ${article.title}\n\n${summary}...`);
    });

    tweets.push(
      `${topArticles.length + 2}/${topArticles.length + 2} 💡 Want these insights delivered to your inbox?\n\nSubscribe to techUpkeep for bi-weekly curated tech content!\n\n🔗 techupkeep.dev\n\n#TechTwitter #DevCommunity #Programming`
    );

    const threadContent = tweets.join("\n\n---\n\n");

    return {
      platform: "twitter-thread",
      contentType: "thread",
      title: `Twitter Thread - ${subject}`,
      content: threadContent,
      hashtags: "#TechTwitter #DevCommunity #Programming",
    };
  }

  /**
   * Regenerate TikTok content (simplified - TikTok only)
   */
  async regenerateContent(
    socialMediaPostId: number
  ): Promise<GeneratedContent> {
    // Get the existing post
    const [post] = await db
      .select()
      .from(socialMediaPosts)
      .where(eq(socialMediaPosts.id, socialMediaPostId))
      .limit(1);

    if (!post) {
      throw new Error("Social media post not found");
    }

    if (post.platform !== "tiktok") {
      throw new Error("Only TikTok content regeneration is supported");
    }

    // Get newsletter content
    const newsletterContent = await db
      .select()
      .from(content)
      .where(eq(content.newsletterDraftId, post.newsletterDraftId))
      .limit(50);

    // Sort by virality factors: thumbnails, quality score, engagement score
    const sortByVirality = (items: typeof newsletterContent) => {
      return items.sort((a, b) => {
        // 1. Prioritize items with thumbnails
        const aThumbnail = a.thumbnailUrl ? 1 : 0;
        const bThumbnail = b.thumbnailUrl ? 1 : 0;
        if (aThumbnail !== bThumbnail) return bThumbnail - aThumbnail;

        // 2. Sort by quality score
        const aQuality = a.qualityScore || 0;
        const bQuality = b.qualityScore || 0;
        if (aQuality !== bQuality) return bQuality - aQuality;

        // 3. Sort by engagement score
        const aEngagement = a.engagementScore || 0;
        const bEngagement = b.engagementScore || 0;
        return bEngagement - aEngagement;
      });
    };

    const prioritizedContent = sortByVirality([...newsletterContent]);

    const [newsletter] = await db
      .select()
      .from(newsletterDrafts)
      .where(eq(newsletterDrafts.id, post.newsletterDraftId))
      .limit(1);

    // Generate new TikTok content
    const newContent = await this.generateTikTokScript(
      prioritizedContent,
      newsletter?.subject || "Newsletter"
    );

    // Generate HTML slides for the regenerated content
    const htmlSlides = await this.generateHTMLSlides(
      post.platform,
      newContent.content,
      newsletter?.subject || "Newsletter",
      newContent.hashtags,
      prioritizedContent.map((item) => ({
        title: item.title,
        summary: item.summary || "",
        category: undefined, // Category name not available without join
      }))
    );

    // Update metadata with HTML slides
    const existingMetadata = newContent.metadata
      ? JSON.parse(newContent.metadata)
      : {};
    const metadataWithHTML = JSON.stringify({
      ...existingMetadata,
      htmlSlides: htmlSlides,
    });

    // Update the post
    await db
      .update(socialMediaPosts)
      .set({
        content: newContent.content,
        hashtags: newContent.hashtags,
        metadata: metadataWithHTML,
        updatedAt: new Date(),
      })
      .where(eq(socialMediaPosts.id, socialMediaPostId));

    return newContent;
  }
}
