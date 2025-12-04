import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSends } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getClientIP, getLocationFromIP } from "@/lib/utils/geolocation";

/**
 * Email open tracking endpoint
 * Returns a 1x1 transparent pixel
 * URL format: /api/track/open/{newsletterSendId}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { newsletterSendId: string } }
) {
  try {
    const newsletterSendId = parseInt(params.newsletterSendId);

    if (!newsletterSendId || isNaN(newsletterSendId)) {
      // Return pixel anyway, but don't track
      return new NextResponse(TRANSPARENT_PIXEL, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Expires": "0",
        },
      });
    }

    // Get client IP and location data
    const clientIP = getClientIP(request.headers);
    const locationData = await getLocationFromIP(clientIP);

    // Update newsletter send record with opened timestamp and location
    await db
      .update(newsletterSends)
      .set({
        openedAt: new Date(),
        openIpAddress: clientIP,
        openCountry: locationData.country,
        openCity: locationData.city,
      })
      .where(eq(newsletterSends.id, newsletterSendId));

    // Return 1x1 transparent PNG pixel
    return new NextResponse(TRANSPARENT_PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error tracking email open:", error);
    // Return pixel anyway, don't break email rendering
    return new NextResponse(TRANSPARENT_PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Expires": "0",
      },
    });
  }
}

// 1x1 transparent PNG pixel (base64 encoded)
const TRANSPARENT_PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);
