import OpenAI from "openai";
import { chatWithModelFallback } from "../utils/ai-fallback";

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff retry wrapper
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    const err = error as { status?: number; code?: string; message?: string };
    const isRateLimit =
      err?.status === 429 ||
      err?.code === "rate_limit_exceeded" ||
      err?.message?.toLowerCase().includes("rate limit");

    const isRetriable =
      isRateLimit ||
      err?.status === 500 ||
      err?.status === 502 ||
      err?.status === 503 ||
      err?.code === "ECONNRESET";

    if (retries > 0 && isRetriable) {
      console.log(
        `Rate limit or temporary error detected. Retrying in ${delay}ms... (${retries} retries left)`
      );
      await sleep(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }

    throw error;
  }
}

interface Article {
  title: string;
  summary: string;
  category?: string;
  source?: string;
  link?: string;
}

interface MockupData {
  repoName?: string;
  stars?: string;
  language?: string;
  description?: string;
  command?: string;
  output?: string;
  beforeCode?: string;
  afterCode?: string;
  tweetText?: string;
  likes?: string;
  retweets?: string;
  metric?: string;
  value?: string;
  comparison?: string;
}

export interface SlideData {
  hook: string;
  subtitle?: string;
  slides: Array<{
    title: string; // MAX 8 words
    description: string; // MAX 15 words
    keyPoints?: string[];
    source?: string;
    link?: string;
    mockupType: "github" | "terminal" | "vscode" | "twitter" | "chart" | "none";
    mockupData: MockupData;
    backgroundColor: string;
    textColor: string;
  }>;
  cta: {
    title: string; // MAX 3 words
    subtitle?: string; // MAX 8 words
    link: string;
  };
}

/**
 * REDESIGNED Slide Content Analyzer
 * Optimized for TikTok consumption patterns:
 * - 15-word maximum per slide
 * - Powerful, specific hooks
 * - Minimal text, maximum impact
 * - Visual hierarchy with bold typography
 */
export class SlideContentAnalyzerRedesigned {
  /**
   * Analyze articles and generate TikTok-optimized slide content
   * Uses the 15-word rule and powerful hooks
   */
  async analyzeAndGenerate(articles: Article[]): Promise<SlideData> {
    // Use top 3-4 articles for optimal TikTok pacing
    const topArticles = articles.slice(0, 4);

    if (!openai) {
      return this.generateFallbackContent(topArticles);
    }

    try {
      // Generate powerful, specific hook
      const hook = await retryWithBackoff(() =>
        this.generatePowerfulHook(topArticles)
      );

      await sleep(RATE_LIMIT_DELAY);

      // Analyze each article sequentially
      const slides: SlideData["slides"] = [];
      for (let i = 0; i < topArticles.length; i++) {
        const article = topArticles[i];

        if (i > 0) {
          await sleep(RATE_LIMIT_DELAY);
        }

        try {
          const slide = await retryWithBackoff(() =>
            this.analyzeArticleForSlide(article, i)
          );
          slides.push(slide);
        } catch (error) {
          console.error(`Error analyzing article ${i}:`, error);
          slides.push(this.generateFallbackSlide(article, i));
        }
      }

      const cta = this.generateCTA();

      return {
        hook,
        slides,
        cta,
      };
    } catch (error) {
      console.error("Error analyzing content:", error);
      return this.generateFallbackContent(topArticles);
    }
  }

  /**
   * Generate powerful, specific hook using TikTok best practices
   * - Creates urgency or controversy
   * - Specific to first article
   * - Max 8 words
   * - No generic phrases
   */
  private async generatePowerfulHook(articles: Article[]): Promise<string> {
    if (!openai) {
      return this.generateFallbackHook(articles);
    }

    const first = articles[0];
    const titles = articles.map((a) => a.title).join("\n");

    const prompt = `You are a viral TikTok creator. Create ONE powerful hook (MAX 8 words) for this tech news.

First article: ${first.title}
Summary: ${first.summary}

All articles:
${titles}

RULES (CRITICAL):
1. MAX 8 words total
2. Be SPECIFIC to the first article - not generic
3. Create tension, urgency, or controversy
4. Use concrete numbers, company names, or specifics
5. NO generic phrases: "you won't believe", "this week", "tech news"
6. NO emojis
7. Make it feel native to TikTok, not corporate

GOOD EXAMPLES:
- "WISPR FLOW: 50% MONTHLY GROWTH"
- "YOUR TESTS ARE LYING TO YOU"
- "GitHub Copilot just killed coding interviews"
- "Meta's Llama 3 beats GPT-4"
- "This startup raised $50M in stealth"

BAD EXAMPLES:
- "This week's top tech news" (generic)
- "You won't believe this startup" (clickbait)
- "Meet the company changing everything" (vague)

Return ONLY the hook text (max 8 words), nothing else.`;

    console.log("Generating powerful hook...");
    const { response } = await chatWithModelFallback(openai, {
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 30,
    });

    const hook = response.choices[0]?.message?.content?.trim() || "";
    console.log(`Generated hook: "${hook}"`);

    // Validate hook length (8 words max)
    const wordCount = hook.split(/\s+/).length;
    if (wordCount > 8) {
      console.log(`Hook too long (${wordCount} words), using fallback`);
      return this.generateFallbackHook(articles);
    }

    // Reject generic hooks
    const isGeneric =
      /week|tech news|roundup|this\s+week|top\s+stories|you won't believe|meet the/i.test(
        hook
      );
    if (isGeneric) {
      console.log("Hook is generic, using fallback");
      return this.generateFallbackHook(articles);
    }

    return hook || this.generateFallbackHook(articles);
  }

  /**
   * Analyze individual article and generate TikTok-optimized slide
   * - Title: MAX 8 words
   * - Description: MAX 15 words
   * - Focus on ONE key message
   */
  private async analyzeArticleForSlide(
    article: Article,
    index: number
  ): Promise<SlideData["slides"][0]> {
    if (!openai) {
      return this.generateFallbackSlide(article, index);
    }

    const prompt = `You are a TikTok content creator. Create ONE slide for this article.

Title: ${article.title}
Summary: ${article.summary}

RULES (CRITICAL):
1. Title: MAX 8 WORDS (use ALL CAPS for emphasis)
2. Description: MAX 15 WORDS (one punchy sentence)
3. Focus on ONE key insight
4. Use specific numbers, names, or facts
5. No fluff or filler words
6. Make every word count

GOOD EXAMPLES:

Title: "WISPR FLOW: 50% MONTHLY GROWTH"
Description: "Voice AI that boosts engagement, growing fast"

Title: "YOUR TESTS MIGHT BE LYING"
Description: "Tests prove code agrees with tests, not correctness"

Title: "GITHUB COPILOT WORKSPACE LAUNCHES"
Description: "AI builds entire features from one prompt"

BAD EXAMPLES:

Title: "A really interesting startup that is doing amazing things" (too long, vague)
Description: "This company is revolutionizing the way we think about technology" (too long, no substance)

Choose mockup type based on content:
- github: for repos, tools, open source
- terminal: for CLI, commands, DevOps
- vscode: for code changes, syntax
- chart: for metrics, performance, growth
- twitter: for announcements, viral content
- none: for everything else

Return ONLY valid JSON:
{
  "title": "MAX 8 WORDS IN ALL CAPS",
  "description": "MAX 15 words of impact",
  "mockupType": "github|terminal|vscode|twitter|chart|none",
  "mockupData": {
    // Provide realistic data based on the article
  }
}`;

    console.log(
      `Slide ${index + 1}: Analyzing "${article.title.substring(0, 50)}..."`
    );

    const { response } = await chatWithModelFallback(openai, {
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");

    // Validate word counts
    const titleWords = (result.title || "").split(/\s+/).length;
    const descWords = (result.description || "").split(/\s+/).length;

    console.log(
      `Slide ${index + 1}: Title=${titleWords} words, Desc=${descWords} words, Mockup=${result.mockupType}`
    );

    // Enforce limits by truncation if AI fails
    let finalTitle = result.title || article.title;
    if (titleWords > 8) {
      finalTitle = result.title.split(/\s+/).slice(0, 8).join(" ");
    }

    let finalDescription = result.description || article.summary;
    if (descWords > 15) {
      finalDescription = result.description.split(/\s+/).slice(0, 15).join(" ");
    }

    // High-contrast colors for maximum impact
    const colorSchemes = [
      { bg: "#000000", text: "#FFFFFF" }, // Black/White
      { bg: "#0099FF", text: "#FFFFFF" }, // Blue/White
      { bg: "#FF3366", text: "#FFFFFF" }, // Pink/White
      { bg: "#FFFFFF", text: "#000000" }, // White/Black
    ];

    const scheme = colorSchemes[index % colorSchemes.length];

    return {
      title: finalTitle,
      description: finalDescription,
      keyPoints: [],
      source: article.source,
      link: article.link,
      mockupType: result.mockupType || "none",
      mockupData: result.mockupData || {},
      backgroundColor: scheme.bg,
      textColor: scheme.text,
    };
  }

  /**
   * Generate powerful fallback hook without AI
   */
  private generateFallbackHook(articles: Article[]): string {
    const first = articles[0];
    if (!first) return "Tech news that matters";

    const title = first.title.toLowerCase();

    // Extract key phrases and make them punchy
    if (title.includes("50%") || title.includes("month over month")) {
      return "50% MONTHLY GROWTH RIGHT NOW";
    } else if (title.includes("ai") && title.includes("beats")) {
      return "AI JUST BEAT THE BENCHMARK";
    } else if (title.includes("github") || title.includes("copilot")) {
      return "GITHUB CHANGED CODING FOREVER";
    } else if (title.includes("meta") || title.includes("llama")) {
      return "META'S SECRET WEAPON LEAKED";
    } else if (title.includes("test")) {
      return "YOUR TESTS ARE LYING";
    } else {
      // Use first 6 words of title as hook
      const words = first.title.split(/\s+/).slice(0, 6);
      return words.join(" ").toUpperCase();
    }
  }

  /**
   * Generate fallback slide without AI
   */
  private generateFallbackSlide(
    article: Article,
    index: number
  ): SlideData["slides"][0] {
    // Extract first 8 words for title
    const titleWords = article.title.split(/\s+/).slice(0, 8).join(" ");
    const title = titleWords.toUpperCase();

    // Extract first sentence or 15 words for description
    const firstSentence = article.summary.split(/[.!?]/)[0] || article.summary;
    const descWords = firstSentence.split(/\s+/).slice(0, 15).join(" ");

    // Determine mockup type from keywords
    let mockupType:
      | "github"
      | "terminal"
      | "vscode"
      | "twitter"
      | "chart"
      | "none" = "none";
    let mockupData: MockupData = {};

    const lower = article.title.toLowerCase() + " " + article.summary.toLowerCase();

    if (lower.includes("github") || lower.includes("repo") || lower.includes("star")) {
      mockupType = "github";
      mockupData = {
        repoName: "trending/repo",
        stars: "25k",
        language: "TypeScript",
        description: descWords,
      };
    } else if (lower.includes("50%") || lower.includes("growth") || lower.includes("faster")) {
      mockupType = "chart";
      mockupData = {
        metric: "Growth",
        value: "50",
        comparison: "+50% MoM",
      };
    } else if (lower.includes("npm") || lower.includes("cli") || lower.includes("install")) {
      mockupType = "terminal";
      mockupData = {
        command: "npm install package",
        output: "✓ Success",
      };
    } else if (lower.includes("code") || lower.includes("syntax")) {
      mockupType = "vscode";
      mockupData = {
        beforeCode: "// Old",
        afterCode: "// New",
      };
    }

    const colorSchemes = [
      { bg: "#000000", text: "#FFFFFF" },
      { bg: "#0099FF", text: "#FFFFFF" },
      { bg: "#FF3366", text: "#FFFFFF" },
      { bg: "#FFFFFF", text: "#000000" },
    ];

    const scheme = colorSchemes[index % colorSchemes.length];

    return {
      title,
      description: descWords,
      keyPoints: [],
      source: article.source,
      link: article.link,
      mockupType,
      mockupData,
      backgroundColor: scheme.bg,
      textColor: scheme.text,
    };
  }

  /**
   * Generate CTA with maximum impact
   */
  private generateCTA(): SlideData["cta"] {
    return {
      title: "SUBSCRIBE NOW", // 2 words
      subtitle: "Tech news every Tuesday & Friday", // 6 words
      link: "techupkeep.dev",
    };
  }

  /**
   * Complete fallback content generation
   */
  private generateFallbackContent(articles: Article[]): SlideData {
    return {
      hook: this.generateFallbackHook(articles),
      slides: articles.map((article, index) =>
        this.generateFallbackSlide(article, index)
      ),
      cta: this.generateCTA(),
    };
  }
}
