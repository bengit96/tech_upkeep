import { db } from "@/lib/db";
import { outreachProspects, outreachCampaigns, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find prospect by email
    const prospects = await db
      .select()
      .from(outreachProspects)
      .where(eq(outreachProspects.email, email));

    if (prospects.length === 0) {
      return NextResponse.json({ success: true, message: "No prospect found" });
    }

    const prospect = prospects[0];

    // Update prospect status to converted
    await db
      .update(outreachProspects)
      .set({
        status: "converted",
        convertedAt: new Date(),
      })
      .where(eq(outreachProspects.id, prospect.id));

    // Update campaign stats
    if (prospect.campaignId) {
      const allProspects = await db
        .select()
        .from(outreachProspects)
        .where(eq(outreachProspects.campaignId, prospect.campaignId));

      const converted = allProspects.filter(
        (p) => p.status === "converted" || p.id === prospect.id
      ).length;

      await db
        .update(outreachCampaigns)
        .set({ totalConverted: converted })
        .where(eq(outreachCampaigns.id, prospect.campaignId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking conversion:", error);
    return NextResponse.json(
      { error: "Failed to track conversion" },
      { status: 500 }
    );
  }
}
