import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterDrafts, users, content } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
// import { Resend } from "resend";
import { Client as QStash } from "@upstash/qstash";
import { buildHtmlForDraft } from "@/lib/services/newsletter-builder";
import { requireAdmin } from "@/lib/auth";

// const resend = new Resend(process.env.RESEND_API_KEY);
const qstash = new QStash({
  token: process.env.QSTASH_TOKEN!,
});

/**
 * POST /api/admin/send-newsletter-draft
 * Send a saved newsletter draft to all active users
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { draftId } = body;

    if (!draftId) {
      return NextResponse.json(
        { error: "Draft ID is required" },
        { status: 400 }
      );
    }

    // Get the draft
    const [draft] = await db
      .select()
      .from(newsletterDrafts)
      .where(eq(newsletterDrafts.id, draftId))
      .limit(1);

    if (!draft) {
      return NextResponse.json(
        { error: "Newsletter draft not found" },
        { status: 404 }
      );
    }

    if (draft.status === "sent") {
      return NextResponse.json(
        { error: "This newsletter has already been sent" },
        { status: 400 }
      );
    }

    // Get all articles tagged to this newsletter
    const taggedArticles = await db
      .select()
      .from(content)
      .where(eq(content.newsletterDraftId, draftId));

    if (taggedArticles.length === 0) {
      return NextResponse.json(
        { error: "No articles tagged to this newsletter" },
        { status: 400 }
      );
    }

    // If the draft hasn't been finalized with HTML, generate a base HTML now
    // (non-personalized; used for preview/history). We'll still generate
    // personalized HTML per user below for tracking links/pixels.
    const baseHtmlContent =
      draft.htmlContent ||
      (await buildHtmlForDraft(draft.id, { includeTracking: false }));
    if (!draft.htmlContent) {
      await db
        .update(newsletterDrafts)
        .set({ htmlContent: baseHtmlContent, updatedAt: new Date() })
        .where(eq(newsletterDrafts.id, draftId));
    }

    // Get all active users
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.isActive, true));

    if (allUsers.length === 0) {
      return NextResponse.json(
        { error: "No active users to send to" },
        { status: 400 }
      );
    }

    // Enqueue a QStash job to process sending in background
    const callbackUrl = `https://techupkeep.dev/api/cron/send-scheduled-newsletters`;
    console.log("[ENQUEUE] send_draft", {
      draftId,
      callbackUrl,
      taggedCount: taggedArticles.length,
      activeUsers: allUsers.length,
    });
    await qstash.publishJSON({
      url: callbackUrl,
      body: { type: "send_draft", draftId },
      retries: 3,
    });

    return NextResponse.json({
      success: true,
      message: "Newsletter send enqueued",
    });
  } catch (error) {
    console.error("Error sending newsletter draft:", error);
    return NextResponse.json(
      { error: "Failed to send newsletter" },
      { status: 500 }
    );
  }
}
