import { Resend } from "resend";
import { db } from "../db";
import {
  users,
  content,
  categories,
  contentTags,
  tags,
  newsletterSends,
  newsletterConfig,
} from "../db/schema";
import { eq, desc } from "drizzle-orm";
import type { Content, Category, Tag } from "../db/schema";
import { APP_NAME } from "../constants";
import { generateNewsletterHTML } from "../newsletter-template";
import { logEmailSent, logEmailFailed, logNewsletterBatch } from "../utils/discord";

if (!process.env.RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY env var");
}
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_NEWSLETTER = process.env.RESEND_FROM || "ben@techupkeep.dev";

interface ContentWithDetails extends Content {
  category?: Category | null;
  tags?: Tag[];
}

export class EmailService {
  /**
   * Retry helper with exponential backoff for email sending
   */
  private async sendWithRetry<T>(
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

      return this.sendWithRetry(fn, retries - 1, delayMs * 1.5, attempt + 1);
    }
  }

  async sendDailyNewsletter(userEmail: string): Promise<boolean> {
    try {
      // Get user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);
      if (!user || !user.isActive) {
        console.log(`User ${userEmail} not found or inactive`);
        return false;
      }

      // Get only accepted content that hasn't been sent yet
      const recentContent = await db
        .select()
        .from(content)
        .where(eq(content.status, "accepted"))
        .orderBy(desc(content.publishedAt))
        .limit(50);

      if (recentContent.length === 0) {
        console.log(`No accepted content to send to ${userEmail}`);
        return false;
      }

      // Enrich content with categories and tags
      const enrichedContent: ContentWithDetails[] = [];

      for (const item of recentContent) {
        const category = item.categoryId
          ? (
              await db
                .select()
                .from(categories)
                .where(eq(categories.id, item.categoryId))
                .limit(1)
            )[0]
          : null;

        const itemTags = await db
          .select({ tag: tags })
          .from(contentTags)
          .leftJoin(tags, eq(contentTags.tagId, tags.id))
          .where(eq(contentTags.contentId, item.id));

        enrichedContent.push({
          ...item,
          category,
          tags: itemTags.map((t) => t.tag).filter(Boolean) as Tag[],
        });
      }

      // Group content by category
      const contentByCategory = this.groupByCategory(enrichedContent);

      // Fetch newsletter config for header/footer
      const [config] = await db.select().from(newsletterConfig).limit(1);

      // Track newsletter send BEFORE sending (so we have the ID)
      const [newsletterSend] = await db
        .insert(newsletterSends)
        .values({
          userId: user.id,
          contentCount: recentContent.length,
          status: "sent",
        })
        .returning();

      // Generate HTML email with tracked URLs and tracking pixel
      const html = generateNewsletterHTML({
        contentByCategory,
        headerContent: config?.headerContent || null,
        footerContent: config?.footerContent || null,
        userId: user.id,
        newsletterSendId: newsletterSend.id,
        includeTracking: true,
      });

      // Create compelling preheader text (element #2)
      const topItems = enrichedContent.slice(0, 3);
      const preheaderText =
        topItems.length > 0
          ? `${topItems[0].title.substring(0, 80)}... + ${recentContent.length - 1} more curated articles`
          : `${recentContent.length} hand-picked tech articles`;

      // Get featured articles (featuredOrder 1, 2, 3) for subject line
      const featuredArticles = enrichedContent
        .filter(
          (item) => item.featuredOrder && [1, 2, 3].includes(item.featuredOrder)
        )
        .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));

      // Build subject line with featured article titles
      let subject = "";
      if (featuredArticles.length > 0) {
        const titles = featuredArticles.map((item) => {
          // Truncate long titles
          const maxLength = 40;
          return item.title.length > maxLength
            ? item.title.substring(0, maxLength) + "..."
            : item.title;
        });
        subject = titles.join(", ");
      } else {
        // Fallback to date if no featured articles
        subject = new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }

      // Send email using Resend with tracking enabled and retry logic
      const result = await this.sendWithRetry(() =>
        resend.emails.send({
          from: `${APP_NAME} <${FROM_NEWSLETTER}>`,
          to: userEmail,
          subject,
          html,
          headers: {
            "X-Preview-Text": preheaderText,
          },
          tags: [
            { name: "category", value: "newsletter" },
            { name: "user_id", value: user.id.toString() },
            { name: "newsletter_send_id", value: newsletterSend.id.toString() },
          ],
        })
      );

      const { data, error } = result;
      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      // Store Resend email ID for tracking
      if (data?.id) {
        await db
          .update(newsletterSends)
          .set({ resendEmailId: data.id })
          .where(eq(newsletterSends.id, newsletterSend.id));
      }

      // Mark content as sent with timestamp
      const now = new Date();
      for (const item of recentContent) {
        await db
          .update(content)
          .set({ sentAt: now })
          .where(eq(content.id, item.id));
      }

      console.log(
        `✅ Newsletter sent to ${userEmail} with ${recentContent.length} articles`
      );

      // Log to Discord
      await logEmailSent({
        email: userEmail,
        subject,
        articleCount: recentContent.length,
        newsletterSendId: newsletterSend.id,
        resendEmailId: data?.id,
        type: "newsletter",
      });

      return true;
    } catch (error) {
      console.error(`Error sending newsletter to ${userEmail}:`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Log to Discord
      await logEmailFailed({
        email: userEmail,
        error: errorMessage,
        type: "newsletter",
      });

      // Track failed send
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, userEmail))
          .limit(1);
        if (user) {
          await db.insert(newsletterSends).values({
            userId: user.id,
            contentCount: 0,
            status: "failed",
          });
        }
      } catch (e) {
        console.error(`Error tracking newsletter send to ${userEmail}:`, e);
        // Ignore tracking errors
      }

      return false;
    }
  }

  async sendNewsletterToAll(batchSize = 20): Promise<{ sent: number; failed: number; remaining: number; isComplete: boolean }> {
    const startTime = Date.now();

    // Get all active users
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.isActive, true));

    // Get users who have already received today's newsletter
    // We'll use a simple heuristic: users who received a newsletter in the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentSends = await db
      .select({ userId: newsletterSends.userId })
      .from(newsletterSends)
      .where(eq(newsletterSends.status, 'sent'));

    const recentSentUserIds = new Set(recentSends.map(s => s.userId));

    // Filter out users who already received the newsletter
    const pendingUsers = allUsers.filter(user => !recentSentUserIds.has(user.id));

    if (pendingUsers.length === 0) {
      return { sent: 0, failed: 0, remaining: 0, isComplete: true };
    }

    // Process only batchSize users
    const targetUsers = pendingUsers.slice(0, batchSize);
    const remainingAfterBatch = pendingUsers.length - targetUsers.length;

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < targetUsers.length; i++) {
      const user = targetUsers[i];
      const success = await this.sendDailyNewsletter(user.email);
      if (success) {
        sent++;
      } else {
        failed++;
      }

      // Log progress every 5 users
      if ((i + 1) % 5 === 0 || i === targetUsers.length - 1) {
        console.log(`[EMAIL] Progress: ${i + 1}/${targetUsers.length} (sent: ${sent}, failed: ${failed}, ${remainingAfterBatch} remaining)`);
      }

      // Delay between sends to respect rate limits (2 emails/second = 500ms)
      if (i < targetUsers.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const duration = Date.now() - startTime;

    // Log batch summary to Discord
    await logNewsletterBatch({
      totalSent: sent,
      totalFailed: failed,
      totalRecipients: targetUsers.length,
      duration,
    });

    return {
      sent,
      failed,
      remaining: remainingAfterBatch,
      isComplete: remainingAfterBatch === 0
    };
  }

  async sendNewsletterToSpecificUsers(userIds: number[]): Promise<{ sent: number; failed: number }> {
    const startTime = Date.now();

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      try {
        // Get user by ID
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user) {
          console.log(`User with ID ${userId} not found`);
          failed++;
          continue;
        }

        const success = await this.sendDailyNewsletter(user.email);
        if (success) {
          sent++;
        } else {
          failed++;
        }

        // Log progress every 10 users
        if ((i + 1) % 10 === 0 || i === userIds.length - 1) {
          console.log(`[EMAIL] Progress: ${i + 1}/${userIds.length} (sent: ${sent}, failed: ${failed})`);
        }

        // Delay between sends to respect rate limits (2 emails/second = 500ms)
        if (i < userIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error sending to user ${userId}:`, error);
        failed++;
      }
    }

    const duration = Date.now() - startTime;

    // Log batch summary to Discord
    await logNewsletterBatch({
      totalSent: sent,
      totalFailed: failed,
      totalRecipients: userIds.length,
      duration,
    });

    return { sent, failed };
  }

  async sendWelcomeEmail(userEmail: string): Promise<boolean> {
    try {
      // Get user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);

      if (!user) {
        console.log(`User ${userEmail} not found`);
        return false;
      }

      // Get most recent accepted content (limit to 25 articles for welcome email)
      const recentContent = await db
        .select()
        .from(content)
        .where(eq(content.status, "accepted"))
        .orderBy(desc(content.publishedAt))
        .limit(25);

      if (recentContent.length === 0) {
        console.log(`No content available for welcome email to ${userEmail}`);
        return false;
      }

      // Enrich content with categories and tags
      const enrichedContent: ContentWithDetails[] = [];

      for (const item of recentContent) {
        const category = item.categoryId
          ? (
              await db
                .select()
                .from(categories)
                .where(eq(categories.id, item.categoryId))
                .limit(1)
            )[0]
          : null;

        const itemTags = await db
          .select({ tag: tags })
          .from(contentTags)
          .leftJoin(tags, eq(contentTags.tagId, tags.id))
          .where(eq(contentTags.contentId, item.id));

        enrichedContent.push({
          ...item,
          category,
          tags: itemTags.map((t) => t.tag).filter(Boolean) as Tag[],
        });
      }

      // Group content by category
      const contentByCategory = this.groupByCategory(enrichedContent);

      // Fetch newsletter config for header/footer
      const [config] = await db.select().from(newsletterConfig).limit(1);

      // Custom welcome header
      const welcomeHeader = `
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%); padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 8px 0;">Welcome to ${APP_NAME}! 👋</h2>
          <p style="color: #e0e7ff; font-size: 16px; margin: 0;">
            Here's your first curated newsletter with ${recentContent.length} hand-picked tech articles to get you started.
          </p>
        </div>
      `;

      // Generate HTML email (no tracking for welcome email)
      const html = generateNewsletterHTML({
        contentByCategory,
        headerContent: welcomeHeader,
        footerContent: config?.footerContent || null,
        includeTracking: false,
      });

      // Send welcome email with retry logic
      const result = await this.sendWithRetry(() =>
        resend.emails.send({
          from: `${APP_NAME} <${FROM_NEWSLETTER}>`,
          to: userEmail,
          subject: `Welcome to ${APP_NAME}! Here's your first newsletter 🚀`,
          html,
          headers: {
            "X-Preview-Text": `Welcome to ${APP_NAME}! Start your journey with ${recentContent.length} curated tech articles.`,
          },
          tags: [
            { name: "category", value: "welcome" },
            { name: "user_id", value: user.id.toString() },
          ],
        })
      );

      const { data, error } = result;
      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      console.log(
        `✅ Welcome email sent to ${userEmail} with ${recentContent.length} articles`
      );

      // Log to Discord
      await logEmailSent({
        email: userEmail,
        subject: `Welcome to ${APP_NAME}! Here's your first newsletter 🚀`,
        articleCount: recentContent.length,
        newsletterSendId: 0, // Welcome emails don't have a newsletter send ID
        resendEmailId: data?.id,
        type: "welcome",
      });

      return true;
    } catch (error) {
      console.error(`Error sending welcome email to ${userEmail}:`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Log to Discord
      await logEmailFailed({
        email: userEmail,
        error: errorMessage,
        type: "welcome",
      });

      return false;
    }
  }

  private groupByCategory(
    content: ContentWithDetails[]
  ): Map<string, ContentWithDetails[]> {
    const grouped = new Map<string, ContentWithDetails[]>();

    for (const item of content) {
      const categoryName = item.category?.name || "Uncategorized";
      if (!grouped.has(categoryName)) {
        grouped.set(categoryName, []);
      }
      grouped.get(categoryName)!.push(item);
    }

    return grouped;
  }
}
