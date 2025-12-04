import OpenAI from "openai";
import { chatWithModelFallback } from "../utils/ai-fallback";
import {
  getHookPatternById,
  getRandomHookPattern,
  HOOK_PATTERNS,
} from "../types/hook-patterns";

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
    // Check if it's a rate limit error
    const isRateLimit =
      err?.status === 429 ||
      err?.code === "rate_limit_exceeded" ||
      err?.message?.toLowerCase().includes("rate limit");

    // Check if it's a temporary error we should retry
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
      return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
    }

    throw error;
  }
}

interface Article {
  title: string;
  summary: string;
  category?: string;
  source?: string; // Source name
  link?: string; // Article URL
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
    title: string;
    description: string;
    keyPoints?: string[]; // 3-5 bullet points from article
    source?: string; // Source name (e.g., "PC Mag", "Bloomberg")
    link?: string; // Article URL
    mockupType: "github" | "terminal" | "vscode" | "twitter" | "chart" | "none";
    mockupData: MockupData;
    backgroundColor: string;
    textColor: string;
  }>;
  cta: {
    title: string;
    subtitle?: string;
    link: string;
  };
}

export class SlideContentAnalyzer {
  /**
   * Phase 1: Select best 3-5 articles that work together thematically for TikTok
   */
  async selectBestArticlesForTikTok(articles: Article[]): Promise<{
    selectedArticles: Article[];
    theme: string;
    reasoning: string;
  }> {
    if (!openai || articles.length === 0) {
      // Fallback: just take first 3 articles
      return {
        selectedArticles: articles.slice(0, 3),
        theme: "Tech news roundup",
        reasoning: "No AI available - using first 3 articles",
      };
    }

    try {
      const prompt = `You are a viral TikTok content strategist. Analyze these tech articles and select 3-5 that work BEST together for a cohesive TikTok video.

Available Articles (${articles.length} total):
${articles.map((a, i) => `${i + 1}. ${a.title}\n   Summary: ${a.summary.substring(0, 150)}...\n   Category: ${a.category || "general"}`).join("\n\n")}

Your task:
1. Find a THEMATIC THREAD that connects 3-5 articles (e.g., "AI breakthroughs", "open source wins", "dev productivity tools", "controversial tech decisions")
2. Select articles that tell a cohesive story when presented together
3. Prioritize articles with viral potential (controversy, big numbers, surprising facts, practical value)
4. Ensure the theme is specific enough to be interesting but broad enough to cover your selections

Return ONLY valid JSON (no markdown, no code blocks):
{
  "selectedIndices": [0, 2, 4],
  "theme": "One concise theme (max 8 words) that ties selected articles together",
  "reasoning": "Brief explanation (2-3 sentences) of why these articles work together and what makes them compelling for TikTok"
}`;

      console.log(
        `📊 Analyzing ${articles.length} articles for TikTok selection...`
      );

      const { response } = await chatWithModelFallback(openai, {
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 300,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");

      // Validate and extract selected articles
      const selectedIndices = result.selectedIndices || [0, 1, 2];
      const selectedArticles = selectedIndices
        .filter((idx: number) => idx >= 0 && idx < articles.length)
        .map((idx: number) => articles[idx]);

      // Ensure we have at least 3 articles
      if (selectedArticles.length < 3) {
        console.log(
          "⚠️  LLM selected less than 3 articles, falling back to first 3"
        );
        return {
          selectedArticles: articles.slice(0, 3),
          theme: result.theme || "This week in tech",
          reasoning:
            result.reasoning ||
            "Selected first 3 articles due to insufficient selection",
        };
      }

      console.log(`✅ Selected ${selectedArticles.length} articles`);
      console.log(`🎯 Theme: "${result.theme}"`);
      console.log(`💡 Reasoning: ${result.reasoning}`);
      console.log(
        `📝 Selected: ${selectedArticles.map((a: Article) => a.title.substring(0, 50)).join(" | ")}`
      );

      return {
        selectedArticles,
        theme: result.theme || "Tech updates you need to know",
        reasoning:
          result.reasoning || "Articles selected for thematic coherence",
      };
    } catch (error) {
      console.error("Error selecting articles:", error);
      // Fallback to first 3 articles
      return {
        selectedArticles: articles.slice(0, 3),
        theme: "This week in tech",
        reasoning: "Error occurred - using fallback selection",
      };
    }
  }

  /**
   * Phase 2: Analyze articles and generate optimized slide content
   * Uses sequential processing with rate limiting to avoid API errors
   */
  async analyzeAndGenerate(
    articles: Article[],
    hookPatternId?: string
  ): Promise<SlideData> {
    if (!openai) {
      // Fallback without AI
      return this.generateFallbackContent(articles.slice(0, 3));
    }

    try {
      // PHASE 1: Select best articles for TikTok
      const selection = await retryWithBackoff(() =>
        this.selectBestArticlesForTikTok(articles)
      );

      // Wait to avoid rate limiting
      await sleep(RATE_LIMIT_DELAY);

      // PHASE 2: Generate an intro summary (instead of a hook) based on theme and selected articles
      const hook = await retryWithBackoff(() =>
        this.generateIntroSummary(selection.selectedArticles, selection.theme)
      );

      // Wait to avoid rate limiting
      await sleep(RATE_LIMIT_DELAY);

      // PHASE 3: Analyze each selected article SEQUENTIALLY
      const slides: SlideData["slides"] = [];
      for (let i = 0; i < selection.selectedArticles.length; i++) {
        const article = selection.selectedArticles[i];

        // Add delay between requests (except for first one)
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
          // Use fallback for this slide if AI fails
          slides.push(this.generateFallbackSlide(article, i));
        }
      }

      // Generate CTA
      const cta = this.generateCTA();

      return {
        hook,
        subtitle: selection.theme, // Add theme as subtitle for context
        slides,
        cta,
      };
    } catch (error) {
      console.error("Error analyzing content:", error);
      return this.generateFallbackContent(articles.slice(0, 3));
    }
  }

  /**
   * Generate a concise 1-2 sentence summary for the intro slide
   */
  private async generateIntroSummary(
    articles: Article[],
    theme: string
  ): Promise<string> {
    if (!openai) {
      // Fallback: simple concatenation of titles
      const topTitles = articles.slice(0, 3).map((a) => a.title);
      return `${theme}: ${topTitles.join(" · ")}`.slice(0, 180);
    }

    const titles = articles.map((a) => `- ${a.title}`).join("\n");

    const prompt = `You are summarizing a short social video about multiple tech articles under a single theme.

THEME: ${theme}

ARTICLES:
${titles}

Task: Write a single concise summary (1-2 sentences, max ~220 characters) describing what this video covers overall. Plain text only. No emojis, no markdown.`;

    try {
      const { response } = await chatWithModelFallback(openai, {
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 80,
      });

      const summary = response.choices[0]?.message?.content?.trim() || "";
      // Ensure length constraint
      return summary.length > 260 ? summary.slice(0, 257) + "..." : summary;
    } catch (error) {
      console.error("Error generating intro summary:", error);
      const fallback = articles
        .slice(0, 3)
        .map((a) => a.title)
        .join(" · ");
      return `${theme}: ${fallback}`.slice(0, 180);
    }
  }

  /**
   * Generate AI-powered hook based on thematic connection with manual pattern selection
   */
  private async generateDynamicHook(
    articles: Article[],
    theme: string,
    hookPatternId?: string
  ): Promise<string> {
    if (!openai) {
      console.log("OpenAI not configured, using fallback hook");
      return this.generateFallbackHook(articles);
    }

    // Get pattern - either user-selected or random
    const pattern = hookPatternId
      ? getHookPatternById(hookPatternId) || HOOK_PATTERNS[0]
      : getRandomHookPattern();

    console.log(
      `\n🎯 Hook Pattern: "${pattern.name}"${hookPatternId ? " (user-selected)" : " (random)"}`
    );
    console.log(`   Examples: ${pattern.examples[0]}`);

    const titles = articles.map((a) => a.title).join("\n");
    const articleCount = articles.length;

    const prompt = `You are a viral TikTok content creator specializing in tech news. Create ONE attention-grabbing hook using this specific style.

HOOK STYLE: ${pattern.name}
THEME: ${theme}
NUMBER OF ARTICLES: ${articleCount}

Articles in this video:
${titles}

${pattern.prompt}

Examples in this style:
${pattern.examples.map((ex) => `- "${ex}"`).join("\n")}

THEME CONNECTION:
Make sure your hook relates to the theme "${theme}" and captures what makes these ${articleCount} articles interesting together.

Return ONLY the hook text, nothing else. No quotes, no explanation.`;

    try {
      console.log(
        `Generating "${pattern.name}" style hook for theme: "${theme}"...`
      );
      const { response } = await chatWithModelFallback(openai, {
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 50,
      });

      let hook = response.choices[0]?.message?.content?.trim() || "";

      // Clean up any quotes or formatting
      hook = hook.replace(/^["']|["']$/g, "").trim();

      console.log(`Generated hook: "${hook}"`);

      // Validate hook length
      if (hook.split(" ").length > 10) {
        console.log("Hook too long, trying one more time...");
        // Try once more with stricter instructions
        const retryPrompt = `${prompt}\n\nIMPORTANT: Maximum 8 words. Be extremely concise.`;
        const { response: retryResponse } = await chatWithModelFallback(
          openai,
          {
            messages: [{ role: "user", content: retryPrompt }],
            temperature: 0.8,
            max_tokens: 30,
          }
        );
        const retryHook = retryResponse.choices[0]?.message?.content
          ?.trim()
          .replace(/^["']|["']$/g, "")
          .trim();

        if (retryHook && retryHook.split(" ").length <= 10) {
          hook = retryHook;
          console.log(`Retry hook: "${hook}"`);
        }
      }

      // Return the generated hook
      if (hook && hook.split(" ").length <= 10) {
        console.log(
          `✅ Hook generated successfully with "${pattern.name}" pattern\n`
        );
        return hook;
      }
    } catch (error) {
      console.error("Error generating hook with pattern:", error);
    }

    // Fallback
    console.log("Using fallback hook");
    return this.generateFallbackHook(articles);
  }

  /**
   * Analyze individual article and generate slide data with key points
   */
  private async analyzeArticleForSlide(
    article: Article,
    index: number
  ): Promise<SlideData["slides"][0]> {
    if (!openai) {
      console.log(`Slide ${index + 1}: OpenAI not configured, using fallback`);
      return this.generateFallbackSlide(article, index);
    }

    const prompt = `You are writing engaging tech news for TikTok/Instagram. Write from the user's perspective: What's NEW? What's INTERESTING? What can I LEARN?

Title: ${article.title}
Summary: ${article.summary}
Category: ${article.category || "general"}

Write a short engaging paragraph (2-4 sentences, ~80-120 words) that answers:
1. WHAT happened? (the news/announcement)
2. WHY does it matter? (impact, benefits, numbers)
3. WHAT can users do with it? (practical takeaway)

Style Guidelines:
- Write conversationally like you're telling a friend
- Use concrete numbers, dates, company names
- Focus on practical benefits and real-world impact
- Make it interesting and readable
- NO hype words like "revolutionary", "game-changing", "amazing"
- Start with the most interesting fact

Good Examples:
"GitHub just launched Copilot Workspace, an AI that can build entire features from a single prompt. It writes code, creates tests, and handles edge cases automatically. Early testers report 60% faster development time. Available now in beta for GitHub Pro users at $20/month."

"Meta's new Llama 3 model outperforms GPT-4 on coding benchmarks while being 40% faster. It's completely open source and can run locally on a MacBook Pro. Developers are already using it to build AI tools without API costs."

Return ONLY valid JSON (no markdown, no code blocks):
{
  "description": "Your engaging 2-4 sentence paragraph here (80-120 words)",
  "mockupType": "github|terminal|vscode|twitter|chart|none",
  "mockupData": {
    // For github: { "repoName": "user/repo", "stars": "25k", "language": "TypeScript", "description": "short desc" }
    // For terminal: { "command": "npm install package", "output": "success message" }
    // For vscode: { "beforeCode": "old code", "afterCode": "new code" }
    // For twitter: { "tweetText": "tweet content", "likes": "50K", "retweets": "12K" }
    // For chart: { "metric": "Performance", "value": "85", "comparison": "+40% faster" }
    // For none: {}
  }
}`;

    console.log(
      `Slide ${index + 1}: Analyzing article "${article.title.substring(0, 50)}..."`
    );
    const { response } = await chatWithModelFallback(openai, {
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");

    console.log(
      `Slide ${index + 1}: Mockup type selected: ${result.mockupType}`
    );

    // Alternate background colors for visual variety
    const backgroundColors = ["#000000", "#ffffff", "#0099FF"];
    const textColors = ["#ffffff", "#000000", "#ffffff"];

    return {
      title: article.title,
      description: result.description || article.summary.substring(0, 70),
      keyPoints: result.keyPoints || [],
      source: article.source,
      link: article.link,
      mockupType: result.mockupType || "none",
      mockupData: result.mockupData || {},
      backgroundColor: backgroundColors[index % 3],
      textColor: textColors[index % 3],
    };
  }

  /**
   * Generate fallback hook without AI - with variety
   */
  private generateFallbackHook(articles: Article[]): string {
    const firstTitle = articles[0]?.title || "";
    const titleLower = firstTitle.toLowerCase();

    // Get a random pattern for fallback variety
    const pattern = getRandomHookPattern();

    console.log(`Using fallback hook with "${pattern.name}" pattern`);

    // Topic-based hooks with pattern variety
    if (titleLower.includes("ai") || titleLower.includes("gpt")) {
      const hooks = [
        "AI just got scary good", // provocative
        "What AI companies won't tell you", // curiosity
        "Everyone's switching to AI", // trend
        "Your AI workflow is outdated", // warning
      ];
      return hooks[Math.floor(Math.random() * hooks.length)];
    }

    if (
      titleLower.includes("react") ||
      titleLower.includes("vue") ||
      titleLower.includes("framework")
    ) {
      const hooks = [
        "Your framework choice is wrong", // provocative
        "This beats React and Vue", // comparison
        "Framework wars just shifted", // trend
        "Stop using this framework", // warning
      ];
      return hooks[Math.floor(Math.random() * hooks.length)];
    }

    if (
      titleLower.includes("performance") ||
      titleLower.includes("speed") ||
      titleLower.includes("faster")
    ) {
      const hooks = [
        "This makes code 10x faster", // outcome
        "Performance just got unfair", // insider
        "Why your app is slow", // curiosity
        "The speed hack nobody talks about", // curiosity
      ];
      return hooks[Math.floor(Math.random() * hooks.length)];
    }

    if (titleLower.includes("tool") || titleLower.includes("library")) {
      const hooks = [
        "Dev tools you're missing out on", // warning
        "Tools that ship products faster", // outcome
        "The toolkit senior devs use", // curiosity
        "This changed my workflow", // insider
      ];
      return hooks[Math.floor(Math.random() * hooks.length)];
    }

    // Generic fallbacks with variety
    const genericHooks = [
      "This week's tech news hits different", // insider
      "What happened in tech this week", // curiosity
      "Tech news that actually matters", // provocative
      "The updates everyone's talking about", // trend
      "Your weekly tech reality check", // outcome
      "This changes how we build", // trend
    ];

    return genericHooks[Math.floor(Math.random() * genericHooks.length)];
  }

  /**
   * Generate fallback slide without AI
   */
  private generateFallbackSlide(
    article: Article,
    index: number
  ): SlideData["slides"][0] {
    // Determine mockup type based on keywords
    let mockupType:
      | "github"
      | "terminal"
      | "vscode"
      | "twitter"
      | "chart"
      | "none" = "none";
    let mockupData: MockupData = {};

    const titleLower = article.title.toLowerCase();
    const summaryLower = article.summary.toLowerCase();

    if (
      titleLower.includes("github") ||
      titleLower.includes("repo") ||
      titleLower.includes("star")
    ) {
      mockupType = "github";
      mockupData = {
        repoName: "trending/repo",
        stars: "15.2k",
        language: "TypeScript",
        description: article.summary.substring(0, 80),
      };
    } else if (
      titleLower.includes("npm") ||
      titleLower.includes("install") ||
      titleLower.includes("cli")
    ) {
      mockupType = "terminal";
      mockupData = {
        command: "npm install new-package",
        output: "✓ Installed successfully",
      };
    } else if (
      titleLower.includes("code") ||
      titleLower.includes("syntax") ||
      summaryLower.includes("before")
    ) {
      mockupType = "vscode";
      mockupData = {
        beforeCode: "// Old approach\nconst data = fetch(url);",
        afterCode: "// New approach\nconst data = await fetch(url);",
      };
    } else if (
      titleLower.includes("faster") ||
      titleLower.includes("performance") ||
      titleLower.includes("%")
    ) {
      mockupType = "chart";
      mockupData = {
        metric: "Performance Improvement",
        value: "75",
        comparison: "+50% faster than before",
      };
    }

    const backgroundColors = ["#000000", "#ffffff", "#0099FF"];
    const textColors = ["#ffffff", "#000000", "#ffffff"];

    // Generate engaging paragraph from summary (fallback when no AI)
    // Take first 2-3 sentences for a readable paragraph
    const summaryParts = article.summary
      .split(/[.!?]/)
      .filter((s) => s.trim().length > 20)
      .slice(0, 3);

    const paragraph =
      summaryParts.map((s) => s.trim()).join(". ") +
      (summaryParts.length > 0 ? "." : "");

    // Limit to ~150 words for readability
    const words = paragraph.split(/\s+/);
    const limitedParagraph =
      words.length > 150 ? words.slice(0, 150).join(" ") + "..." : paragraph;

    return {
      title: article.title,
      description: limitedParagraph || article.summary.substring(0, 120).trim(),
      keyPoints: [], // No bullet points, just paragraph
      source: article.source,
      link: article.link,
      mockupType,
      mockupData,
      backgroundColor: backgroundColors[index % 3],
      textColor: textColors[index % 3],
    };
  }

  /**
   * Generate CTA content
   */
  private generateCTA(): SlideData["cta"] {
    return {
      title: "Subscribe Now",
      subtitle: "Get curated tech news every Tuesday & Friday",
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
