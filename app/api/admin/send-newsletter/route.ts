import { NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email';
import { requireAdmin } from "@/lib/auth";
import { db } from '@/lib/db';
import { newsletterDrafts, users, newsletterSends } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { buildHtmlForDraft } from '@/lib/services/newsletter-builder';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_NEWSLETTER = process.env.RESEND_FROM || "Ben from Tech Upkeep <ben@techupkeep.dev>";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    console.log('📧 Manual newsletter sending triggered');

    const body = await request.json();
    const { userIds, draftId, batchSize = 20 } = body;

    // If draftId is provided, send that specific draft
    if (draftId) {
      console.log(`Sending newsletter draft ${draftId} in batches of ${batchSize}`);

      // Get the draft
      const [draft] = await db
        .select()
        .from(newsletterDrafts)
        .where(eq(newsletterDrafts.id, draftId))
        .limit(1);

      if (!draft) {
        return NextResponse.json(
          { error: 'Newsletter draft not found' },
          { status: 404 }
        );
      }

      // Get users who have already received this draft
      const alreadySentUserIds = await db
        .select({ userId: newsletterSends.userId })
        .from(newsletterSends)
        .where(
          and(
            eq(newsletterSends.newsletterDraftId, draftId),
            eq(newsletterSends.status, 'sent')
          )
        );

      const alreadySentIds = new Set(alreadySentUserIds.map(row => row.userId));

      // Get users to send to (excluding those who already received it)
      let allPendingUsers;
      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        allPendingUsers = await db
          .select()
          .from(users)
          .where(inArray(users.id, userIds));
      } else {
        allPendingUsers = await db
          .select()
          .from(users)
          .where(eq(users.isActive, true));
      }

      // Filter out users who already received this newsletter
      const pendingUsers = allPendingUsers.filter(user => !alreadySentIds.has(user.id));

      if (pendingUsers.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'All users have already received this newsletter',
          sent: 0,
          failed: 0,
          remaining: 0,
          total: allPendingUsers.length,
          isComplete: true,
        });
      }

      // Take only batchSize users for this request
      const targetUsers = pendingUsers.slice(0, batchSize);
      const remainingAfterBatch = pendingUsers.length - targetUsers.length;

      console.log(`Sending to ${targetUsers.length} users (${remainingAfterBatch} remaining after this batch)`);

      // Helper function for retry logic
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

          const actualDelay = isRateLimit ? delayMs * 2 : delayMs;
          await new Promise((r) => setTimeout(r, actualDelay));

          return sendWithRetry(fn, retries - 1, delayMs * 1.5, attempt + 1);
        }
      }

      // Send to each user
      let sent = 0;
      let failed = 0;

      for (let i = 0; i < targetUsers.length; i++) {
        const user = targetUsers[i];
        try {
          // Create newsletter send record
          const [newsletterSend] = await db
            .insert(newsletterSends)
            .values({
              userId: user.id,
              newsletterDraftId: draft.id,
              contentCount: 0, // Will be updated by buildHtmlForDraft
              status: 'sent',
              subject: draft.subject,
            })
            .returning();

          // Build personalized HTML
          const html = await buildHtmlForDraft(draft.id, {
            includeTracking: true,
            userId: user.id,
            newsletterSendId: newsletterSend.id,
          });

          // Send email with retry logic
          await sendWithRetry(() =>
            resend.emails.send({
              from: FROM_NEWSLETTER,
              to: user.email,
              subject: draft.subject,
              html,
              tags: [
                { name: 'category', value: 'newsletter' },
                { name: 'user_id', value: String(user.id) },
                { name: 'newsletter_send_id', value: String(newsletterSend.id) },
                { name: 'draft_id', value: String(draft.id) },
              ],
            })
          );

          sent++;
          console.log(`✅ Sent ${i + 1}/${targetUsers.length} to ${user.email}`);

          // Delay between sends to respect rate limits (2 emails/second = 500ms)
          if (i < targetUsers.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`❌ Failed to send to ${user.email} after retries:`, error);
          failed++;

          // Update newsletter send status to failed
          try {
            await db
              .update(newsletterSends)
              .set({ status: 'failed' })
              .where(and(
                eq(newsletterSends.userId, user.id),
                eq(newsletterSends.newsletterDraftId, draft.id)
              ));
          } catch (updateErr) {
            console.error('Failed to update send status', updateErr);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Newsletter "${draft.subject}" sent to ${sent} user${sent !== 1 ? 's' : ''}, ${failed} failed. ${remainingAfterBatch} remaining.`,
        sent,
        failed,
        remaining: remainingAfterBatch,
        total: pendingUsers.length,
        processed: targetUsers.length,
        isComplete: remainingAfterBatch === 0,
      });
    }

    // Legacy flow: send accepted content
    const emailService = new EmailService();
    let result;

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Send to specific users (no batching for specific user list)
      console.log(`Sending to ${userIds.length} specific users`);
      result = await emailService.sendNewsletterToSpecificUsers(userIds);
      return NextResponse.json({
        success: true,
        message: `Newsletters sent to ${result.sent} users, ${result.failed} failed`,
        sent: result.sent,
        failed: result.failed,
        isComplete: true,
      });
    } else {
      // Send to all active users in batches
      console.log(`Sending to active users in batches of ${batchSize}`);
      result = await emailService.sendNewsletterToAll(batchSize);
    }

    return NextResponse.json({
      success: true,
      message: `Newsletters sent to ${result.sent} users, ${result.failed} failed. ${result.remaining} remaining.`,
      sent: result.sent,
      failed: result.failed,
      remaining: result.remaining,
      isComplete: result.isComplete,
    });
  } catch (error) {
    console.error('Error in manual newsletter sending:', error);
    return NextResponse.json(
      {
        error: 'Failed to send newsletters',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
