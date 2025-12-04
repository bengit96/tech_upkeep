import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customEmailSends } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// 1x1 transparent PNG pixel
const TRACKING_PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

export async function GET(
  request: Request,
  { params }: { params: { draftId: string; userId: string } }
) {
  try {
    const draftId = parseInt(params.draftId);
    const userId = parseInt(params.userId);

    if (!isNaN(draftId) && !isNaN(userId)) {
      // Update the customEmailSends record to mark as opened
      const [existingSend] = await db
        .select()
        .from(customEmailSends)
        .where(
          and(
            eq(customEmailSends.customEmailDraftId, draftId),
            eq(customEmailSends.userId, userId)
          )
        )
        .limit(1);

      if (existingSend && !existingSend.openedAt) {
        // Get device and location info from headers
        const userAgent = request.headers.get("user-agent") || "unknown";
        const ip = request.headers.get("x-forwarded-for") ||
                   request.headers.get("x-real-ip") ||
                   "unknown";

        // Basic device type detection
        let deviceType = "unknown";
        if (userAgent.includes("Mobile")) deviceType = "mobile";
        else if (userAgent.includes("Tablet")) deviceType = "tablet";
        else deviceType = "desktop";

        // Basic email client detection
        let emailClient = "unknown";
        if (userAgent.includes("Gmail")) emailClient = "gmail";
        else if (userAgent.includes("Outlook")) emailClient = "outlook";
        else if (userAgent.includes("Apple")) emailClient = "apple";
        else if (userAgent.includes("Yahoo")) emailClient = "yahoo";

        await db
          .update(customEmailSends)
          .set({
            openedAt: new Date(),
            deviceType,
            emailClient,
            openIpAddress: ip,
          })
          .where(eq(customEmailSends.id, existingSend.id));
      }
    }
  } catch (error) {
    console.error("Error tracking custom email open:", error);
  }

  // Always return the tracking pixel regardless of whether tracking succeeded
  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
