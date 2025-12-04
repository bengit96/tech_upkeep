import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

/**
 * AI Model fallback chain
 * Tries multiple models in order until one succeeds
 */
const AI_MODELS = [
  { provider: "openai", model: "gpt-4o-mini", name: "GPT-4o Mini" },
  { provider: "openai", model: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  { provider: "openai", model: "gpt-4o", name: "GPT-4o" },
] as const;

interface BlogPostData {
  title: string;
  description: string | null;
  category: string | null;
}

/**
 * Extract a valid JSON array string from model output that may include
 * markdown code fences or extra prose.
 */
function extractJsonArrayString(text: string): string {
  let cleaned = (text || "").trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("````") || cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
  }

  // If surrounding prose exists, capture the first array-looking segment
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  return cleaned;
}

/**
 * Generate key points using OpenAI with model fallback
 */
async function generateWithOpenAI(
  blogPost: BlogPostData,
  modelConfig: (typeof AI_MODELS)[number]
): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `You are a content expert analyzing a tech blog post for TikTok slide creation.

Blog Post Title: ${blogPost.title}
${blogPost.description ? `Description: ${blogPost.description}` : ""}
Category: ${blogPost.category || "Tech"}

Your task: Extract exactly 5 key takeaways from this blog post that would work well as TikTok slides. Each point should be:
- Concise (1-2 sentences, max 150 characters)
- Engaging and attention-grabbing
- Self-contained (understandable on its own)
- Focused on actionable insights or key learnings

IMPORTANT: Return exactly 5 key points as a JSON array of strings. Example format:
["First key point here", "Second key point here", "Third key point here", "Fourth key point here", "Fifth key point here"]

Do not include any extra text before or after the JSON. Do not wrap the JSON in markdown code fences. Return ONLY the valid JSON array.

Key takeaways:`;

  const completion = await openai.chat.completions.create({
    model: modelConfig.model,
    messages: [
      {
        role: "system",
        content:
          "You are a content strategist who specializes in creating engaging TikTok content from technical blog posts. You extract the most important, shareable insights.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const responseText = completion.choices[0]?.message?.content?.trim();

  if (!responseText) {
    throw new Error("No response from AI");
  }

  // Parse the JSON response (robust to code fences / extra prose)
  const jsonPayload = extractJsonArrayString(responseText);
  const keyPoints = JSON.parse(jsonPayload);

  // Validate that it's an array of strings
  if (
    !Array.isArray(keyPoints) ||
    keyPoints.some((point) => typeof point !== "string")
  ) {
    throw new Error("Invalid response format");
  }

  // Ensure we have 3-6 points
  if (keyPoints.length < 3) {
    throw new Error("Not enough key points generated");
  }
  if (keyPoints.length > 6) {
    return keyPoints.slice(0, 5);
  }

  return keyPoints;
}

/**
 * Fallback: Generate basic key points from blog post metadata
 */
function generateBasicKeyPoints(blogPost: BlogPostData): string[] {
  const points: string[] = [];

  // Use title to generate a key point
  points.push(`Discover insights about ${blogPost.title.toLowerCase()}`);

  // Use description if available
  if (blogPost.description) {
    const descWords = blogPost.description.split(" ").slice(0, 20).join(" ");
    points.push(descWords + (blogPost.description.length > 100 ? "..." : ""));
  }

  // Generic category-based points
  if (blogPost.category) {
    points.push(
      `Learn practical ${blogPost.category.toLowerCase()} techniques`
    );
  }

  // Add generic valuable points
  points.push("Understand the key concepts and best practices");
  points.push("Apply these learnings to your projects");

  return points.slice(0, 5);
}

/**
 * POST /api/admin/slides/generate-key-points
 * Auto-generate key points from a blog post using AI with model fallback
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blogPostId } = body;

    if (!blogPostId) {
      return NextResponse.json(
        { error: "Missing required field: blogPostId" },
        { status: 400 }
      );
    }

    // Fetch blog post from database
    const [blogPost] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, blogPostId))
      .limit(1);

    if (!blogPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    let keyPoints: string[] = [];
    let usedModel: string = "none";
    let lastError: any = null;

    // Try each AI model in the fallback chain
    for (const modelConfig of AI_MODELS) {
      try {
        console.log(
          `Attempting to generate key points with ${modelConfig.name}...`
        );

        if (modelConfig.provider === "openai") {
          keyPoints = await generateWithOpenAI(blogPost, modelConfig);
          usedModel = modelConfig.name;
          console.log(`✅ Successfully generated with ${modelConfig.name}`);
          break; // Success! Exit the loop
        }
      } catch (error: any) {
        lastError = error;
        const isRateLimit =
          error.message?.includes("Rate limit") || error.status === 429;
        const isQuotaExceeded = error.message?.includes("quota");

        console.warn(`❌ ${modelConfig.name} failed:`, error.message);

        // If it's a rate limit or quota error, try next model
        if (isRateLimit || isQuotaExceeded) {
          console.log(
            `⏭️  Trying next model due to ${isRateLimit ? "rate limit" : "quota exceeded"}...`
          );
          continue;
        }

        // For other errors, also try next model
        console.log(`⏭️  Trying next model due to error...`);
        continue;
      }
    }

    // If all AI models failed, use basic fallback
    if (keyPoints.length === 0) {
      console.log("⚠️  All AI models failed, using basic fallback");
      keyPoints = generateBasicKeyPoints(blogPost);
      usedModel = "Basic Fallback";
    }

    return NextResponse.json({
      keyPoints,
      blogPost: {
        id: blogPost.id,
        title: blogPost.title,
        slug: blogPost.slug,
      },
      metadata: {
        model: usedModel,
        fallback: usedModel === "Basic Fallback",
      },
    });
  } catch (error: any) {
    console.error("Error generating key points:", error);

    // Final fallback key points
    return NextResponse.json(
      {
        error: "Failed to generate key points",
        details: error.message || "Unknown error",
        keyPoints: [
          "Learn the core concepts from this article",
          "Discover practical applications",
          "Understand the key benefits",
          "Explore real-world examples",
        ],
        metadata: {
          model: "Emergency Fallback",
          fallback: true,
        },
      },
      { status: 500 }
    );
  }
}
