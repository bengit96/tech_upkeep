import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * POST /api/admin/slides/generate-points-from-header
 * Generate 3-5 key points from a slide header using AI
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { header, blogPostId, manualContext } = body;

    if (!header || typeof header !== "string") {
      return NextResponse.json(
        { error: "Missing required field: header" },
        { status: 400 }
      );
    }

    let context = "";

    // Add manual context first (highest priority)
    if (
      manualContext &&
      typeof manualContext === "string" &&
      manualContext.trim()
    ) {
      context = `Manual Context: ${manualContext.trim()}\n\n`;
    }

    // If blog post ID provided, add blog context
    if (blogPostId) {
      const [blogPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, blogPostId))
        .limit(1);

      if (blogPost) {
        context += `Blog: ${blogPost.title}\n${blogPost.description || ""}`;
      }
    }

    // Try OpenAI first
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a content creator helping to create engaging TikTok slides. Generate 3-5 concise, impactful bullet points based on the given header. Each point should be 8-12 words max. Make them punchy and memorable.",
            },
            {
              role: "user",
              content: `Header: "${header}"${context ? `\n\n${context}` : ""}\n\nGenerate 3-5 key points that would make great bullet points for a TikTok slide. Each point should be concise and impactful. Return ONLY a JSON array of strings, no additional text.`,
            },
          ],
          temperature: 0.8,
          max_tokens: 300,
        });

        console.log(context);

        console.log("completion", completion);
        console.log("completion.choices", completion.choices);

        const responseText = completion.choices[0]?.message?.content?.trim();

        if (responseText) {
          // Clean up JSON markdown formatting
          let cleanedText = responseText
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .trim();

          // Parse JSON response
          try {
            const points = JSON.parse(cleanedText);
            if (
              Array.isArray(points) &&
              points.length >= 3 &&
              points.length <= 5
            ) {
              return NextResponse.json({
                points: points.slice(0, 5), // Ensure max 5 points
                model: "GPT-4o Mini",
                source: "openai",
              });
            }
          } catch (parseError) {
            // If parsing fails, try to extract points manually
            const lines = cleanedText
              .split("\n")
              .map((l) => l.trim())
              .filter(
                (l) =>
                  l && l.length > 0 && !l.startsWith("[") && !l.startsWith("]")
              )
              .map((l) =>
                l
                  .replace(/^[-•*]\s*/, "")
                  .replace(/^"\s*/, "")
                  .replace(/\s*"$/, "")
                  .replace(/,\s*$/, "")
              )
              .filter((l) => l.length > 5)
              .slice(0, 5);

            if (lines.length >= 3) {
              return NextResponse.json({
                points: lines,
                model: "GPT-4o Mini",
                source: "openai",
              });
            }
          }
        }
      } catch (openaiError: any) {
        console.error("OpenAI error:", openaiError);
        // Fall through to fallback
      }
    }

    // Fallback: Generate points based on header keywords
    const fallbackPoints = generateFallbackPoints(header);

    return NextResponse.json({
      points: fallbackPoints,
      model: "Fallback",
      source: "fallback",
      fallback: true,
    });
  } catch (error: any) {
    console.error("Error generating points:", error);

    return NextResponse.json(
      {
        error: "Failed to generate points",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Generate fallback points when AI is not available
 */
function generateFallbackPoints(header: string): string[] {
  const words = header.split(" ").filter((w) => w.length > 3);

  const templates = [
    `Understanding ${words[0] || "the concept"}`,
    `Key benefits and advantages`,
    `Common pitfalls to avoid`,
    `Best practices and tips`,
    `Real-world applications`,
  ];

  // If header is a question, generate question-based points
  if (header.includes("?")) {
    return [
      `What you need to know`,
      `Common misconceptions`,
      `Expert recommendations`,
      `Practical examples`,
      `Next steps to take`,
    ];
  }

  // If header is "How to...", generate process points
  if (header.toLowerCase().startsWith("how to")) {
    return [
      `Step 1: Getting started`,
      `Step 2: Core implementation`,
      `Step 3: Optimization`,
      `Common challenges`,
      `Pro tips for success`,
    ];
  }

  return templates.slice(0, 5);
}
