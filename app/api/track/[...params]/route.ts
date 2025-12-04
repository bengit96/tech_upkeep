import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clickTracking, content, newsletterSends } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getClientIP, getLocationFromIP } from "@/lib/utils/geolocation";

// Force dynamic rendering - this route should never be statically generated
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Click tracking and redirect endpoint
 * URL format: /api/track/{contentId}/{userId?}/{newsletterSendId?}
 *
 * This endpoint:
 * 1. Logs the click to the database with newsletter send tracking
 * 2. Redirects the user to the actual content URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const [contentIdStr, userIdStr, newsletterSendIdStr] = params.params;

    if (!contentIdStr) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    const contentId = parseInt(contentIdStr);
    const userId = userIdStr ? parseInt(userIdStr) : null;
    const newsletterSendId = newsletterSendIdStr
      ? parseInt(newsletterSendIdStr)
      : null;

    // Get the content item
    const [contentItem] = await db
      .select()
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (!contentItem) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Extract user agent and IP address for analytics
    const userAgent = request.headers.get("user-agent") || undefined;
    const ipAddress = getClientIP(request.headers);

    // Get location data from IP
    const locationData = await getLocationFromIP(ipAddress);

    // Ensure uniqueness per user/newsletter/article to avoid duplicate clicks
    let exists = false;
    try {
      if (userId && newsletterSendId) {
        const rows = await db
          .select()
          .from(clickTracking)
          .where(eq(clickTracking.contentId, contentId));
        exists = rows.some(
          (r) => r.userId === userId && r.newsletterSendId === newsletterSendId
        );
      } else if (newsletterSendId) {
        const rows = await db
          .select()
          .from(clickTracking)
          .where(eq(clickTracking.contentId, contentId));
        exists = rows.some((r) => r.newsletterSendId === newsletterSendId);
      } else if (userId) {
        const rows = await db
          .select()
          .from(clickTracking)
          .where(eq(clickTracking.contentId, contentId));
        exists = rows.some((r) => r.userId === userId);
      }
    } catch {
      // ignore and proceed to insert best-effort
    }

    if (!exists) {
      await db.insert(clickTracking).values({
        contentId,
        userId,
        newsletterSendId,
        userAgent,
        ipAddress,
        country: locationData.country,
        city: locationData.city,
      });
    }

    // Attribute an email open to the newsletter when a user clicks any article link
    // (Opening the article implies the email was opened)
    if (newsletterSendId) {
      await db
        .update(newsletterSends)
        .set({ openedAt: new Date() })
        .where(eq(newsletterSends.id, newsletterSendId));
    }

    // Add UTM parameters to track newsletter traffic
    const destinationUrl = new URL(contentItem.link);
    destinationUrl.searchParams.set("utm_source", "product_pulse_newsletter");
    destinationUrl.searchParams.set("utm_medium", "email");
    destinationUrl.searchParams.set("utm_campaign", "daily_digest");

    // Add content metadata for better tracking
    destinationUrl.searchParams.set("utm_content", contentItem.sourceType);

    // Redirect to the actual content URL with UTM parameters
    return NextResponse.redirect(destinationUrl.toString(), { status: 302 });
  } catch (error) {
    console.error("Error tracking click:", error);
    // Even if tracking fails, try to redirect anyway
    const [contentIdStr] = params.params;
    if (contentIdStr) {
      try {
        const contentId = parseInt(contentIdStr);
        const [contentItem] = await db
          .select()
          .from(content)
          .where(eq(content.id, contentId))
          .limit(1);

        if (contentItem) {
          // Add UTM parameters even on fallback redirect
          const destinationUrl = new URL(contentItem.link);
          destinationUrl.searchParams.set(
            "utm_source",
            "product_pulse_newsletter"
          );
          destinationUrl.searchParams.set("utm_medium", "email");
          destinationUrl.searchParams.set("utm_campaign", "daily_digest");
          destinationUrl.searchParams.set(
            "utm_content",
            contentItem.sourceType
          );

          return NextResponse.redirect(destinationUrl.toString(), {
            status: 302,
          });
        }
      } catch (e) {
        console.error("Error tracking click:", e);
        // Silently fail
      }
    }

    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 500 }
    );
  }
}
