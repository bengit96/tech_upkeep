import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { content } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { chatWithModelFallback } from "@/lib/utils/ai-fallback";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/content/generate-description
 * Generate AI description for an article using GPT-4o-mini
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { contentId } = await request.json();

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Fetch the content item
    const [item] = await db
      .select()
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Generate description with model fallback
    const { response } = await chatWithModelFallback(openai, {
      messages: [
        {
          role: "system",
          content:
            "You are a technical writer for product engineers. Generate concise summaries in exactly 2 SHORT lines for quick scanning.\n\nRules:\n- Exactly 2 lines (separate with period, not line break)\n- 15-25 words total across both lines\n- Start with the core concept (noun phrase)\n- NO quotation marks in output\n- NO article references (This article, The post, etc)\n- Technical terminology only\n- Each line should be a complete thought\n\nGood examples:\n- OpenTelemetry tracing patterns for microservices. Covers span propagation and context injection.\n- OAuth2 authorization code flow with PKCE. Includes token refresh and session management.\n- React Server Components performance optimization. Details selective hydration and streaming.\n\nBad examples:\n- Using quotation marks around the description\n- Single long sentence\n- This article examines...",
        },
        {
          role: "user",
          content: `Title: ${item.title}\n\nOriginal Summary: ${item.summary}\n\nWrite a 2-line summary (15-25 words total). No quotation marks. Be technical and direct.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 50,
    });

    let description = response.choices[0]?.message?.content?.trim();

    if (!description) {
      return NextResponse.json(
        { error: "Failed to generate description" },
        { status: 500 }
      );
    }

    // Remove any quotation marks that might have been added
    description = description.replace(/^["']|["']$/g, "").trim();

    // Update BOTH description and summary fields to overwrite the current description
    await db
      .update(content)
      .set({
        description,
        summary: description, // Overwrite summary with AI-generated description
      })
      .where(eq(content.id, contentId));

    return NextResponse.json({
      success: true,
      description,
    });
  } catch (error) {
    console.error("Error generating description:", error);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}
