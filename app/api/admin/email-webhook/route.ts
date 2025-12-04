import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, newsletterSends } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Webhook } from "svix";

/**
 * POST /api/admin/email-webhook
 * Handle Resend webhooks for bounces/complaints.
 * In Resend dashboard, configure webhook to this endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("RESEND_WEBHOOK_SECRET not set; skipping verification");
    }

    const payload = await request.text();
    if (secret) {
      const wh = new Webhook(secret);
      const headers = {
        "svix-id": request.headers.get("svix-id") || "",
        "svix-timestamp": request.headers.get("svix-timestamp") || "",
        "svix-signature": request.headers.get("svix-signature") || "",
      };
      try {
        wh.verify(payload, headers);
      } catch {
        return NextResponse.json(
          { error: "invalid signature" },
          { status: 401 }
        );
      }
    }

    const body = JSON.parse(payload || "{}");
    const event = body?.type as string | undefined;
    const email = body?.data?.to as string | undefined;
    const metadata = (body?.data?.metadata || {}) as Record<string, string>;

    if (!event || !email) {
      return NextResponse.json({ ok: true });
    }

    // Deactivate users on hard bounce or complaint
    if (event === "email.bounced" || event === "email.complained") {
      await db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.email, email));
    }

    // Mark open based on provider event if we have the newsletter_send_id metadata
    if (event === "email.opened" && metadata.newsletter_send_id) {
      const id = parseInt(metadata.newsletter_send_id);
      if (!isNaN(id)) {
        await db
          .update(newsletterSends)
          .set({ openedAt: new Date() })
          .where(eq(newsletterSends.id, id));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Email webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
