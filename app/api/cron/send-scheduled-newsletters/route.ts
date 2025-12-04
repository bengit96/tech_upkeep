import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  newsletterDrafts,
  users,
  content,
  newsletterSends,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  buildHtmlForDraft,
  getTaggedContentForDraft,
} from "@/lib/services/newsletter-builder";
import { Resend } from "resend";
import { Receiver } from "@upstash/qstash";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_NEWSLETTER =
  process.env.RESEND_FROM || "Ben from Tech Upkeep <ben@techupkeep.dev>";

/**
 * GET /api/cron/send-scheduled-newsletters
 * Cron job endpoint that checks for scheduled newsletters and sends them
 *
 * To set up in Vercel cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/send-scheduled-newsletters",
 *     "schedule": "* * * * *"  // Every minute
 *   }]
 * }
 */
export async function POST(request: Request) {
  try {
    // Verify QStash signature in production
    if (process.env.NODE_ENV === "production") {
      const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY || "";
      const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY || undefined;
      const receiver = new Receiver({
        currentSigningKey: currentKey as string,
        nextSigningKey: nextKey ?? currentKey,
      });
      const bodyText = await request.text();
      const signature =
        request.headers.get("Upstash-Signature") ||
        request.headers.get("Upstash-Signature-V1");
      if (
        !signature ||
        !(await receiver.verify({ signature, body: bodyText }))
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const payload = bodyText ? JSON.parse(bodyText) : { type: "schedule" };
      console.log("[QSTASH] Worker invoked (prod)", { payload });
      return await handleWorker(payload);
    }
    const payload = await request.json().catch(() => ({ type: "schedule" }));
    console.log("[QSTASH] Worker invoked (dev)", { payload });
    return await handleWorker(payload);
  } catch (error) {
    console.error("Error in send-scheduled-newsletters cron:", error);
    return NextResponse.json(
      { error: "Failed to process scheduled newsletters" },
      { status: 500 }
    );
  }
}

async function sendWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const error = e as Error;
    const isRateLimit = error.message?.includes('rate') || error.message?.includes('429');

    if (retries <= 0) {
      console.error(`[RETRY] All retry attempts exhausted`, {
        attempt,
        error: error.message,
      });
      throw e;
    }

    console.warn(`[RETRY] Attempt ${attempt} failed, retrying...`, {
      retriesLeft: retries,
      delayMs,
      isRateLimit,
      error: error.message,
    });

    // Longer delay for rate limit errors
    const actualDelay = isRateLimit ? delayMs * 2 : delayMs;
    await new Promise((r) => setTimeout(r, actualDelay));

    return sendWithRetry(fn, retries - 1, delayMs * 1.5, attempt + 1);
  }
}

async function handleWorker(args: {
  type: string;
  draftId?: number;
  scheduleId?: number;
}) {
  const { type, draftId } = args;
  if (type === "send_draft") {
    console.log("[WORKER] Starting draft send", { draftId });
    // Send a specific draft (QStash enqueue path) with limited concurrency
    const [draft] = await db
      .select()
      .from(newsletterDrafts)
      .where(eq(newsletterDrafts.id, draftId as number))
      .limit(1);
    if (!draft)
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const tagged = await getTaggedContentForDraft(draft.id);
    
    // Get users who have already received this newsletter (prevents duplicate sends on retry)
    const alreadySentUserIds = await db
      .select({ userId: newsletterSends.userId })
      .from(newsletterSends)
      .where(eq(newsletterSends.newsletterDraftId, draftId as number));
    const alreadySentIds = new Set(alreadySentUserIds.map(row => row.userId));
    
    const allActiveUsers = await db
      .select()
      .from(users)
      .where(eq(users.isActive, true));
    
    // Filter out users who have already been processed (sent or failed)
    const pendingUsers = allActiveUsers.filter(user => !alreadySentIds.has(user.id));
    
    console.log("[WORKER] Loaded payload", {
      draftId,
      taggedCount: tagged.length,
      totalActiveUsers: allActiveUsers.length,
      alreadyProcessed: alreadySentIds.size,
      pendingUsers: pendingUsers.length,
    });
    
    // If all users have already been processed, mark as complete
    if (pendingUsers.length === 0) {
      console.log("[WORKER] All users already processed, marking complete");
      const now = new Date();
      await db
        .update(newsletterDrafts)
        .set({ status: "sent", sentAt: now, updatedAt: now })
        .where(eq(newsletterDrafts.id, draftId as number));
      return NextResponse.json({
        success: true,
        message: "All users already processed",
        sentCount: 0,
        failCount: 0,
        skipped: alreadySentIds.size,
      });
    }
    
    let sentCount = 0;
    let failCount = 0;

    // Send emails sequentially with delay to avoid rate limits
    for (let i = 0; i < pendingUsers.length; i++) {
      const user = pendingUsers[i];

      try {
        const [newsletterSend] = await db
          .insert(newsletterSends)
          .values({
            userId: user.id,
            newsletterDraftId: draft.id,
            contentCount: tagged.length,
            status: "sent",
            subject: draft.subject,
          })
          .returning();

        const html = await buildHtmlForDraft(draft.id, {
          includeTracking: true,
          userId: user.id,
          newsletterSendId: newsletterSend.id,
        });

        const result = await sendWithRetry(() =>
          resend.emails.send({
            from: `${FROM_NEWSLETTER}`,
            to: user.email,
            subject: draft.subject,
            html,
            tags: [
              { name: "category", value: "newsletter" },
              { name: "user_id", value: String(user.id) },
              {
                name: "newsletter_send_id",
                value: String(newsletterSend.id),
              },
              { name: "draft_id", value: String(draft.id) },
            ],
          })
        );

        const resendId = (result as { data?: { id?: string } }).data?.id;
        if (resendId) {
          await db
            .update(newsletterSends)
            .set({ resendEmailId: resendId })
            .where(eq(newsletterSends.id, newsletterSend.id));
        }

        sentCount++;
        console.log(`[WORKER] Sent ${i + 1}/${pendingUsers.length} to ${user.email}`);

        // Delay between sends to respect rate limits (2 emails/second = 500ms)
        if (i < pendingUsers.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      } catch (err) {
        failCount++;
        console.error("[WORKER] Send failed after retries", {
          userId: user.id,
          email: user.email,
          error: (err as Error)?.message,
        });

        // Update newsletter send status to failed
        try {
          await db
            .update(newsletterSends)
            .set({ status: "failed" })
            .where(and(
              eq(newsletterSends.userId, user.id),
              eq(newsletterSends.newsletterDraftId, draft.id)
            ));
        } catch (updateErr) {
          console.error("[WORKER] Failed to update send status", updateErr);
        }
      }

      // Log progress every 10 users
      if ((i + 1) % 10 === 0 || i === pendingUsers.length - 1) {
        console.log("[WORKER] Progress update", {
          processed: i + 1,
          total: pendingUsers.length,
          sentCount,
          failCount,
        });
      }
    }

    // Mark the draft and content as sent
    const now = new Date();
    await db
      .update(newsletterDrafts)
      .set({ status: "sent", sentAt: now, updatedAt: now })
      .where(eq(newsletterDrafts.id, draftId as number));
    for (const article of tagged) {
      await db
        .update(content)
        .set({ sentAt: now })
        .where(eq(content.id, article.id));
    }
    console.log("[WORKER] Draft send complete", {
      draftId,
      sentCount,
      failCount,
      taggedCount: tagged.length,
    });
    return NextResponse.json({
      success: true,
      message: "Draft sent",
      sentCount,
      failCount,
    });
  }

  // Default scheduled path (placeholder)
  return NextResponse.json({
    success: true,
    message: "No-op for scheduled path",
  });
}
