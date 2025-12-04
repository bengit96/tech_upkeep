import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, newsletterDrafts, newsletterSends } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { z } from "zod";
import {
  buildHtmlForDraft,
  getTaggedContentForDraft,
} from "@/lib/services/newsletter-builder";
import { Resend } from "resend";
import { logNewSubscriber } from "@/lib/utils/discord";
import {
  getClientIP,
  getLocationFromIP,
  detectAudience,
} from "@/lib/utils/geolocation";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_NEWSLETTER = "Ben from Tech Upkeep <ben@techupkeep.dev>";

const registerSchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
  sourcePage: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      source = "landing-page",
      sourcePage,
    } = registerSchema.parse(body);
    console.log("source", source);
    console.log("sourcePage", sourcePage);
    console.log("email", email);

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Get client IP and location data
    const clientIP = getClientIP(request.headers);
    const locationData = await getLocationFromIP(clientIP);
    const audienceData = detectAudience(email);

    // Create user with location and audience data
    const [user] = await db
      .insert(users)
      .values({
        email,
        registrationIp: clientIP,
        country: locationData.country,
        countryName: locationData.countryName,
        region: locationData.region,
        city: locationData.city,
        timezone: locationData.timezone,
        audience: audienceData.audience,
        companySize: audienceData.companySize,
        seniority: audienceData.seniority,
        registrationSource: source,
        registrationSourcePage: sourcePage,
      })
      .returning();
    console.log(
      `✅ User created: ${user.email} (${locationData.city}, ${locationData.country})`
    );

    // Get total subscriber count
    const totalSubscribers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));

    // Log to Discord
    await logNewSubscriber({
      email: user.email,
      source: sourcePage ? `${source}: ${sourcePage}` : source,
      totalSubscribers: totalSubscribers[0]?.count || 0,
    });

    // Track outreach conversion if applicable
    try {
      await fetch(
        `https://techupkeep.dev/api/admin/outreach/track-conversion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        }
      );
    } catch (err) {
      console.error("Failed to track outreach conversion:", err);
    }

    // Send the most recent newsletter to this new user asynchronously
    try {
      // Prefer the most recently sent draft; otherwise fall back to latest draft
      const [latestSent] = await db
        .select()
        .from(newsletterDrafts)
        .where(eq(newsletterDrafts.status, "sent"))
        .orderBy(desc(newsletterDrafts.sentAt))
        .limit(1);

      const draft =
        latestSent ||
        (
          await db
            .select()
            .from(newsletterDrafts)
            .orderBy(desc(newsletterDrafts.createdAt))
            .limit(1)
        )[0];

      if (!draft) {
        console.log("No newsletter drafts found to send to new user");
        return;
      }

      const tagged = await getTaggedContentForDraft(draft.id);
      const [newsletterSend] = await db
        .insert(newsletterSends)
        .values({
          userId: user.id,
          newsletterDraftId: draft.id,
          contentCount: tagged.length,
          status: "sent",
        })
        .returning();

      const html = await buildHtmlForDraft(draft.id, {
        includeTracking: true,
        userId: user.id,
        newsletterSendId: newsletterSend.id,
      });

      const result = await resend.emails.send({
        from: `${FROM_NEWSLETTER}`,
        to: user.email,
        subject: draft.subject,
        html,
        tags: [
          { name: "category", value: "newsletter" },
          { name: "user_id", value: String(user.id) },
          { name: "newsletter_send_id", value: String(newsletterSend.id) },
          { name: "draft_id", value: String(draft.id) },
        ],
      });

      const resendId = (result as { data?: { id?: string } }).data?.id;
      if (resendId) {
        await db
          .update(newsletterSends)
          .set({ resendEmailId: resendId })
          .where(eq(newsletterSends.id, newsletterSend.id));
      }

      console.log(
        `✅ Sent most recent newsletter (draft ${draft.id}) to ${user.email}`
      );
    } catch (err) {
      console.error(
        `Failed to send most recent newsletter to ${user.email}:`,
        err
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Successfully registered! Check your inbox for your welcome newsletter.",
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
