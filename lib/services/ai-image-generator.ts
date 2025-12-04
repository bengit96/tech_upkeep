import fetch from "node-fetch";
import OpenAI from "openai";

// Rate limiting configuration
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests (HuggingFace free tier)
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 5000; // 5 seconds

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff retry wrapper for image generation
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
    // Check if it's a rate limit or loading error
    const isRateLimit =
      err?.status === 429 ||
      err?.code === "rate_limit_exceeded" ||
      err?.message?.toLowerCase().includes("rate limit") ||
      err?.message?.toLowerCase().includes("loading");

    // Check if it's a temporary error we should retry
    const isRetriable =
      isRateLimit ||
      err?.status === 500 ||
      err?.status === 502 ||
      err?.status === 503 ||
      err?.code === "ECONNRESET";

    if (retries > 0 && isRetriable) {
      console.log(
        `API error detected (${err?.status || err?.code}). Retrying in ${delay}ms... (${retries} retries left)`
      );
      await sleep(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
    }

    throw error;
  }
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

interface SlideImageRequest {
  title: string;
  description: string;
  mockupType: "github" | "terminal" | "vscode" | "twitter" | "chart" | "none";
  mockupData: MockupData;
  backgroundColor: string;
  index: number;
}

export class AIImageGenerator {
  private huggingFaceApiKey: string | undefined;
  private openaiClient: OpenAI | null;
  private apiUrl =
    "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

  constructor() {
    this.huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
    this.openaiClient = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }

  /**
   * Generate AI image for a slide
   */
  async generateSlideImage(
    request: SlideImageRequest,
    width: number = 1080,
    height: number = 1920
  ): Promise<Buffer> {
    // Generate prompt based on mockup type and content
    const prompt = this.generatePrompt(request);

    console.log(
      `Slide ${request.index + 1}: Generating AI image with prompt: "${prompt.substring(0, 100)}..."`
    );

    // Try OpenAI DALL-E first
    // if (this.openaiClient) {
    //   try {
    //     console.log("Trying OpenAI DALL-E...");
    //     const imageBuffer = await this.callOpenAIAPI(prompt, width, height);
    //     console.log("OpenAI DALL-E succeeded");
    //     return imageBuffer;
    //   } catch (error) {
    //     console.log(
    //       "OpenAI DALL-E failed, falling back to HuggingFace:",
    //       error
    //     );
    //   }
    // }

    // Fallback to HuggingFace
    if (!this.huggingFaceApiKey) {
      throw new Error(
        "Neither OPENAI_API_KEY nor HUGGINGFACE_API_KEY configured. Set at least one in your .env file."
      );
    }

    console.log("Trying HuggingFace API...");
    // Call HuggingFace API with retry logic
    const imageBuffer = await retryWithBackoff(() =>
      this.callHuggingFaceAPI(prompt, width, height)
    );

    return imageBuffer;
  }

  /**
   * Generate optimized prompt for FLUX.1-schnell model
   * Creates abstract backgrounds or concept visuals WITHOUT text
   */
  private generatePrompt(request: SlideImageRequest): string {
    const { title, description, mockupType } = request;

    // Analyze content to determine visual theme
    const contentLower = (title + " " + description).toLowerCase();

    // Determine visual theme based on keywords
    let visualTheme = "";

    if (
      contentLower.includes("ai") ||
      contentLower.includes("machine learning") ||
      contentLower.includes("neural")
    ) {
      visualTheme =
        "abstract neural network visualization, glowing nodes and connections, purple and blue gradient, futuristic AI concept";
    } else if (
      contentLower.includes("cloud") ||
      contentLower.includes("devops") ||
      contentLower.includes("infrastructure")
    ) {
      visualTheme =
        "abstract cloud computing visualization, geometric server racks, blue and cyan gradients, tech infrastructure concept";
    } else if (
      contentLower.includes("security") ||
      contentLower.includes("crypto") ||
      contentLower.includes("blockchain")
    ) {
      visualTheme =
        "abstract security visualization, digital lock and shield, green matrix-style code background, cybersecurity concept";
    } else if (
      contentLower.includes("web") ||
      contentLower.includes("frontend") ||
      contentLower.includes("react") ||
      contentLower.includes("javascript")
    ) {
      visualTheme =
        "abstract web development visualization, colorful code brackets and tags, gradient background, modern web design concept";
    } else if (
      contentLower.includes("mobile") ||
      contentLower.includes("app") ||
      contentLower.includes("ios") ||
      contentLower.includes("android")
    ) {
      visualTheme =
        "abstract mobile app visualization, smartphone screens with colorful UI elements, gradient background, app development concept";
    } else if (
      contentLower.includes("data") ||
      contentLower.includes("database") ||
      contentLower.includes("sql")
    ) {
      visualTheme =
        "abstract data visualization, flowing data streams and nodes, blue and purple gradients, database concept";
    } else if (
      contentLower.includes("performance") ||
      contentLower.includes("speed") ||
      contentLower.includes("optimization")
    ) {
      visualTheme =
        "abstract performance visualization, speed lines and motion blur, vibrant orange and yellow gradients, optimization concept";
    } else {
      visualTheme =
        "abstract tech visualization, geometric shapes and gradients, modern tech aesthetic, innovative concept";
    }

    // Base style - NO TEXT, just visual backgrounds
    const baseStyle =
      "professional tech background image, NO TEXT, NO WORDS, NO LETTERS, clean abstract design, vibrant colors, modern aesthetic, TikTok-style vertical format 9:16";

    return `${baseStyle}, ${visualTheme}, photorealistic quality, sharp details, trending on artstation`;
  }

  /**
   * Call OpenAI DALL-E API
   */
  private async callOpenAIAPI(
    prompt: string,
    width: number,
    height: number
  ): Promise<Buffer> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    // DALL-E 3 works best with square or standard aspect ratios
    // Convert vertical dimensions to more DALL-E friendly sizes
    let size: "1792x1024" | "1024x1024" | "1024x1792" = "1024x1024";

    if (width > height) {
      size = "1792x1024"; // landscape
    } else if (height > width) {
      size = "1024x1792"; // portrait
    }

    const response = await this.openaiClient.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: size,
      quality: "standard",
      n: 1,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("No image data received from OpenAI");
    }

    // Download the image
    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error("No image URL received from OpenAI");
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(
        `Failed to download image from OpenAI: ${imageResponse.status}`
      );
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Call HuggingFace Inference API
   */
  private async callHuggingFaceAPI(
    prompt: string,
    width: number,
    height: number
  ): Promise<Buffer> {
    console.log(`Calling HuggingFace API with URL: ${this.apiUrl}`);

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.huggingFaceApiKey}`,
        "Content-Type": "application/json",
        "x-use-cache": "false", // Disable caching for router endpoint
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width,
          height,
          num_inference_steps: 4, // FLUX.1-schnell optimized for 1-4 steps
          guidance_scale: 0, // Schnell doesn't use guidance
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Check if model is loading
      if (response.status === 503 && errorText.includes("loading")) {
        const error = new Error(`Model is loading, please retry`) as Error & {
          status: number;
        };
        error.status = 503;
        throw error;
      }

      // Handle rate limiting
      if (response.status === 429) {
        const error = new Error(`Rate limit exceeded`) as Error & {
          status: number;
        };
        error.status = 429;
        throw error;
      }

      // Handle specific router endpoint errors
      if (
        response.status === 410 &&
        errorText.includes("no longer supported")
      ) {
        throw new Error(
          `HuggingFace API endpoint has changed. Please check the latest API documentation.`
        );
      }

      throw new Error(
        `HuggingFace API error (${response.status}): ${errorText}`
      );
    }

    // Response is the image buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generate multiple slide images with rate limiting
   */
  async generateMultipleSlides(
    requests: SlideImageRequest[],
    width: number = 1080,
    height: number = 1920
  ): Promise<Buffer[]> {
    const images: Buffer[] = [];

    console.log(`Generating ${requests.length} AI images sequentially...`);

    for (let i = 0; i < requests.length; i++) {
      // Add delay between requests (except for first one)
      if (i > 0) {
        console.log(`Waiting ${RATE_LIMIT_DELAY}ms before next request...`);
        await sleep(RATE_LIMIT_DELAY);
      }

      try {
        const imageBuffer = await this.generateSlideImage(
          requests[i],
          width,
          height
        );
        images.push(imageBuffer);
        console.log(
          `✓ Slide ${i + 1}/${requests.length} generated successfully`
        );
      } catch (error) {
        console.error(`✗ Error generating slide ${i + 1}:`, error);
        throw error; // Propagate error to caller for handling
      }
    }

    return images;
  }
}
