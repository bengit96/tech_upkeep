import { db } from "@/lib/db";
import { outreachCampaigns } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, target, targetLanguage, targetLevel, emailSubject, emailTemplate } = body;

    // Validate required fields
    if (!name || !target || !emailSubject || !emailTemplate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create campaign
    const [campaign] = await db
      .insert(outreachCampaigns)
      .values({
        name,
        target,
        targetLanguage,
        targetLevel,
        emailSubject,
        emailTemplate,
        status: "draft",
      })
      .returning();

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      campaign
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const campaigns = await db.select().from(outreachCampaigns);
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}
