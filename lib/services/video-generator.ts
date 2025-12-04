import OpenAI from "openai";
import { chatWithModelFallback } from "../utils/ai-fallback";
import { db } from "../db";
import { content, videoGenerations } from "../db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";

// Initialize OpenAI for prompt generation
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Google AI API configuration
// Uses the existing GOOGLE_API_KEY from .env (same key for Gemini, Veo, YouTube)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_VEO_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/veo-3.1:generateVideo";

interface VideoGenerationRequest {
  articleId: number;
  style?: "tech-news" | "tutorial" | "promotional" | "explainer";
  duration?: 4 | 6 | 8; // Veo 3.1 supports 4, 6, or 8 seconds
  resolution?: "720p" | "1080p"; // 1080p only available for 8-second videos
}

interface VideoPrompt {
  visualPrompt: string;
  narrationScript: string;
  style: string;
  duration: number;
}

export class VideoGenerator {
  /**
   * Generate a video prompt from article content
   * This creates a structured prompt optimized for Google Veo
   */
  async generateVideoPrompt(
    request: VideoGenerationRequest
  ): Promise<VideoPrompt> {
    // Fetch article content
    const [article] = await db
      .select()
      .from(content)
      .where(eq(content.id, request.articleId))
      .limit(1);

    if (!article) {
      throw new Error("Article not found");
    }

    const style = request.style || "tech-news";
    const duration = request.duration || 15;

    // Generate AI-powered video prompt
    if (openai) {
      return await this.generatePromptWithAI(
        article.title,
        article.summary || "",
        style,
        duration
      );
    }

    // Fallback to template-based generation
    return this.generatePromptFallback(
      article.title,
      article.summary || "",
      style,
      duration
    );
  }

  /**
   * Generate video prompt using AI
   */
  private async generatePromptWithAI(
    title: string,
    summary: string,
    style: string,
    duration: number
  ): Promise<VideoPrompt> {
    const styleGuides = {
      "tech-news": "Fast-paced, dynamic news-style with tech aesthetics, modern UI elements, and code snippets",
      "tutorial": "Clear, step-by-step educational format with diagrams and visual demonstrations",
      "promotional": "Engaging, attention-grabbing style with bold graphics and energetic transitions",
      "explainer": "Simplified, animated explainer style with clear visuals and easy-to-follow concepts"
    };

    const prompt = `You are a video production expert creating a ${duration}-second video for Google Veo.

Article Title: ${title}
Article Summary: ${summary}

Style: ${style} - ${styleGuides[style as keyof typeof styleGuides]}

Create a detailed video prompt with two parts:

1. VISUAL PROMPT: Describe the visual elements, camera movements, scenes, and aesthetics for Google Veo to generate. Be specific about:
   - Scene composition and visual elements
   - Colors, lighting, and mood
   - Camera angles and movements
   - Graphics, text overlays, or animations
   - Transitions between scenes

2. NARRATION SCRIPT: Write a ${duration}-second voiceover script that:
   - Hooks attention in first 2 seconds
   - Explains the key concept clearly
   - Ends with a call to action to subscribe to the newsletter
   - Is timed for exactly ${duration} seconds (approximately ${Math.floor(duration * 2.5)} words)

Format your response as:
VISUAL PROMPT:
[Your detailed visual description]

NARRATION SCRIPT:
[Your ${duration}-second script]

Keep it engaging, tech-focused, and optimized for social media.`;

    const { response } = await chatWithModelFallback(openai!, {
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });

    const result = response.choices[0]?.message?.content || "";

    // Parse the response
    const visualMatch = result.match(/VISUAL PROMPT:\s*\n([\s\S]+?)(?=\n\nNARRATION SCRIPT:|$)/);
    const narrationMatch = result.match(/NARRATION SCRIPT:\s*\n([\s\S]+?)$/);

    const visualPrompt = visualMatch ? visualMatch[1].trim() : this.getDefaultVisualPrompt(title, style);
    const narrationScript = narrationMatch ? narrationMatch[1].trim() : this.getDefaultNarration(title, duration);

    return {
      visualPrompt,
      narrationScript,
      style,
      duration,
    };
  }

  /**
   * Fallback prompt generation without AI
   */
  private generatePromptFallback(
    title: string,
    summary: string,
    style: string,
    duration: number
  ): VideoPrompt {
    return {
      visualPrompt: this.getDefaultVisualPrompt(title, style),
      narrationScript: this.getDefaultNarration(title, duration),
      style,
      duration,
    };
  }

  /**
   * Get default visual prompt template
   */
  private getDefaultVisualPrompt(title: string, style: string): string {
    const baseVisuals = `A modern, tech-focused video with a dark gradient background (deep blue to purple).
Clean, minimalist design with floating code snippets and tech icons.
Bold white text displaying: "${title}".
Smooth camera pan across a virtual tech workspace with holographic UI elements.
Subtle particle effects and glowing accents in blue and purple tones.`;

    const styleAdditions = {
      "tech-news": "\nQuick cuts between tech imagery, code editors, and data visualizations. News-style lower thirds with article headline.",
      "tutorial": "\nStep-by-step visual progression with numbered points. Screen recording style with clear annotations.",
      "promotional": "\nDynamic zoom effects, energetic transitions. Large, bold typography with gradient effects. Eye-catching thumbnails and icons.",
      "explainer": "\nSimple animated icons and diagrams. Smooth transitions between concept visualizations. Clean, educational aesthetic."
    };

    return baseVisuals + (styleAdditions[style as keyof typeof styleAdditions] || "");
  }

  /**
   * Get default narration script
   */
  private getDefaultNarration(title: string, duration: number): string {
    if (duration <= 10) {
      return `${title}. This is changing how developers build software. Subscribe to Tech Upkeep for more insights delivered to your inbox twice a week.`;
    } else if (duration <= 15) {
      return `Here's the latest tech update you need to know: ${title}. This innovation is transforming the developer landscape. Want more curated tech content like this? Subscribe to Tech Upkeep - your bi-weekly dose of engineering insights.`;
    } else {
      return `Let me tell you about an exciting development in tech: ${title}. This breakthrough is reshaping how engineering teams approach modern software development. If you're a product engineer who wants to stay ahead of the curve, you need to hear about this. Subscribe to Tech Upkeep for carefully curated technical content delivered straight to your inbox every Tuesday and Friday. Don't miss out on the insights that matter.`;
    }
  }

  /**
   * Format prompt for Google Veo API
   * Note: Actual API structure may vary - this is a flexible format
   */
  formatForVeoAPI(videoPrompt: VideoPrompt): Record<string, any> {
    return {
      prompt: videoPrompt.visualPrompt,
      duration_seconds: videoPrompt.duration,
      aspect_ratio: "9:16", // Vertical for social media
      style: videoPrompt.style,
      // Additional parameters that Google Veo might support
      quality: "high",
      narration: videoPrompt.narrationScript,
      metadata: {
        generated_for: "tech_upkeep_newsletter",
        content_type: "promotional",
      }
    };
  }

  /**
   * Generate video using Google Veo 3.1 API
   */
  async generateVideoWithVeo(
    videoGenerationId: number,
    resolution: "720p" | "1080p" = "720p"
  ): Promise<{
    jobId: string;
    status: string;
    message: string;
  }> {
    if (!GOOGLE_API_KEY) {
      throw new Error(
        "Google AI API key not configured. Please set GOOGLE_AI_API_KEY environment variable."
      );
    }

    // Get the video generation record
    const [videoGen] = await db
      .select()
      .from(videoGenerations)
      .where(eq(videoGenerations.id, videoGenerationId))
      .limit(1);

    if (!videoGen) {
      throw new Error("Video generation record not found");
    }

    // Validate resolution for duration
    if (resolution === "1080p" && videoGen.duration !== 8) {
      throw new Error("1080p resolution is only available for 8-second videos");
    }

    console.log(`📹 Generating video with Veo 3.1...`);
    console.log(`Duration: ${videoGen.duration}s, Resolution: ${resolution}`);

    try {
      // Call Google Veo API
      const response = await axios.post(
        `${GOOGLE_VEO_ENDPOINT}?key=${GOOGLE_API_KEY}`,
        {
          prompt: {
            text: videoGen.visualPrompt,
          },
          generationConfig: {
            duration: `${videoGen.duration}s`,
            resolution: resolution === "1080p" ? "1080p" : "720p",
            aspectRatio: "9:16", // Vertical for social media
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout for initial request
        }
      );

      const jobId = response.data.name; // Google returns a job name/ID

      // Update video generation status
      await db
        .update(videoGenerations)
        .set({
          status: "generating",
          veoJobId: jobId,
          updatedAt: new Date(),
        })
        .where(eq(videoGenerations.id, videoGenerationId));

      console.log(`✅ Video generation started. Job ID: ${jobId}`);

      return {
        jobId,
        status: "generating",
        message: "Video generation started. This may take 11 seconds to 6 minutes.",
      };
    } catch (error) {
      console.error("Error calling Veo API:", error);

      // Update status to failed
      const errorMessage =
        axios.isAxiosError(error) && error.response
          ? JSON.stringify(error.response.data)
          : error instanceof Error
            ? error.message
            : "Unknown error";

      await db
        .update(videoGenerations)
        .set({
          status: "failed",
          errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(videoGenerations.id, videoGenerationId));

      throw new Error(`Failed to generate video: ${errorMessage}`);
    }
  }

  /**
   * Check the status of a video generation job
   */
  async checkVideoStatus(videoGenerationId: number): Promise<{
    status: string;
    videoUrl?: string;
    progress?: number;
  }> {
    if (!GOOGLE_API_KEY) {
      throw new Error("Google AI API key not configured");
    }

    const [videoGen] = await db
      .select()
      .from(videoGenerations)
      .where(eq(videoGenerations.id, videoGenerationId))
      .limit(1);

    if (!videoGen || !videoGen.veoJobId) {
      throw new Error("Video generation job not found");
    }

    try {
      // Check job status with Google API
      const response = await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/${videoGen.veoJobId}?key=${GOOGLE_API_KEY}`
      );

      const data = response.data;

      if (data.state === "SUCCEEDED") {
        // Video is ready - extract video URL
        const videoUrl = data.response?.videoUri || data.response?.uri;

        // Update database
        await db
          .update(videoGenerations)
          .set({
            status: "completed",
            videoUrl,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(videoGenerations.id, videoGenerationId));

        console.log(`✅ Video generation completed: ${videoUrl}`);

        return {
          status: "completed",
          videoUrl,
        };
      } else if (data.state === "FAILED") {
        const errorMsg = data.error?.message || "Video generation failed";

        await db
          .update(videoGenerations)
          .set({
            status: "failed",
            errorMessage: errorMsg,
            updatedAt: new Date(),
          })
          .where(eq(videoGenerations.id, videoGenerationId));

        return {
          status: "failed",
        };
      } else {
        // Still processing
        return {
          status: "generating",
          progress: data.metadata?.progressPercentage || undefined,
        };
      }
    } catch (error) {
      console.error("Error checking video status:", error);
      throw error;
    }
  }
}
