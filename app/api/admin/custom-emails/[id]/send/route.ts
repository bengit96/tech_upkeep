import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customEmailDrafts, customEmailSends, users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, and, inArray, isNull, isNotNull, sql } from "drizzle-orm";
import { Resend } from "resend";
import { APP_NAME } from "@/lib/constants";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM || "ben@techupkeep.dev";

interface TargetAudience {
  audience?: string[];
  seniority?: string[];
  companySize?: string[];
  country?: string[];
  riskLevel?: string[];
  allUsers?: boolean;
  specificUserIds?: number[];
}

// POST /api/admin/custom-emails/[id]/send - Send custom email
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const draftId = parseInt(params.id);
    if (isNaN(draftId)) {
      return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
    }

    const body = await request.json();
    const { testMode = false, testEmail } = body;

    // Get the draft
    const [draft] = await db
      .select()
      .from(customEmailDrafts)
      .where(eq(customEmailDrafts.id, draftId))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Test mode - send to specific email only
    if (testMode) {
      if (!testEmail) {
        return NextResponse.json(
          { error: "Test email address is required in test mode" },
          { status: 400 }
        );
      }

      try {
        const { data, error } = await resend.emails.send({
          from: `${APP_NAME} <${FROM_EMAIL}>`,
          to: testEmail,
          subject: `[TEST] ${draft.subject}`,
          html: draft.htmlContent,
          headers: {
            "X-Preview-Text": draft.preheaderText || "",
          },
        });

        if (error) {
          throw new Error(`Resend API error: ${error.message}`);
        }

        return NextResponse.json({
          success: true,
          message: `Test email sent to ${testEmail}`,
          testMode: true,
        });
      } catch (error) {
        console.error("Error sending test email:", error);
        return NextResponse.json(
          { error: "Failed to send test email" },
          { status: 500 }
        );
      }
    }

    // Parse target audience filters
    const targetAudience: TargetAudience = draft.targetAudience
      ? JSON.parse(draft.targetAudience)
      : { allUsers: true };

    // Build query to get target users
    let query = db.select().from(users).where(eq(users.isActive, true));

    // Apply filters
    const conditions = [eq(users.isActive, true)];

    if (targetAudience.specificUserIds && targetAudience.specificUserIds.length > 0) {
      conditions.push(inArray(users.id, targetAudience.specificUserIds));
    } else if (!targetAudience.allUsers) {
      if (targetAudience.audience && targetAudience.audience.length > 0) {
        conditions.push(inArray(users.audience, targetAudience.audience));
      }
      if (targetAudience.seniority && targetAudience.seniority.length > 0) {
        conditions.push(inArray(users.seniority, targetAudience.seniority));
      }
      if (targetAudience.companySize && targetAudience.companySize.length > 0) {
        conditions.push(inArray(users.companySize, targetAudience.companySize));
      }
      if (targetAudience.country && targetAudience.country.length > 0) {
        conditions.push(inArray(users.country, targetAudience.country));
      }
      if (targetAudience.riskLevel && targetAudience.riskLevel.length > 0) {
        conditions.push(inArray(users.riskLevel, targetAudience.riskLevel));
      }
    }

    const targetUsers = await db
      .select()
      .from(users)
      .where(and(...conditions));

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: "No users match the target audience criteria" },
        { status: 400 }
      );
    }

    // Send emails
    let sent = 0;
    let failed = 0;
    const sendErrors: string[] = [];

    for (const user of targetUsers) {
      try {
        // Generate HTML with tracking if enabled
        let html = draft.htmlContent;

        // Add tracking pixel if enabled
        if (draft.includeTracking) {
          // We'll track opens via a separate tracking endpoint
          const trackingPixelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/track/custom-email-open/${draftId}/${user.id}`;
          html += `\n<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:block;" />`;
        }

        const { data, error } = await resend.emails.send({
          from: `${APP_NAME} <${FROM_EMAIL}>`,
          to: user.email,
          subject: draft.subject,
          html,
          headers: {
            "X-Preview-Text": draft.preheaderText || "",
          },
          tags: [
            { name: "category", value: "custom-email" },
            { name: "user_id", value: user.id.toString() },
            { name: "draft_id", value: draftId.toString() },
          ],
        });

        if (error) {
          throw new Error(`Resend API error: ${error.message}`);
        }

        // Track send in database
        await db.insert(customEmailSends).values({
          customEmailDraftId: draftId,
          userId: user.id,
          status: "sent",
          resendEmailId: data?.id || null,
        });

        sent++;

        // Add delay to avoid rate limiting (100ms between sends)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error sending email to ${user.email}:`, error);
        failed++;
        sendErrors.push(`${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // Track failed send
        await db.insert(customEmailSends).values({
          customEmailDraftId: draftId,
          userId: user.id,
          status: "failed",
        });
      }
    }

    // Update draft status
    await db
      .update(customEmailDrafts)
      .set({
        status: "sent",
        sentAt: new Date(),
        sentCount: sent,
        updatedAt: new Date(),
      })
      .where(eq(customEmailDrafts.id, draftId));

    return NextResponse.json({
      success: true,
      message: `Email sent successfully`,
      sent,
      failed,
      total: targetUsers.length,
      errors: sendErrors.length > 0 ? sendErrors : undefined,
    });
  } catch (error) {
    console.error("Error sending custom email:", error);
    return NextResponse.json(
      { error: "Failed to send custom email" },
      { status: 500 }
    );
  }
}
