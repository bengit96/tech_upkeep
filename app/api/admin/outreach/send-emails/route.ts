import { db } from "@/lib/db";
import {
  outreachCampaigns,
  outreachProspects,
  outreachEmails,
  users,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function replaceVariables(
  template: string,
  prospect: {
    name: string | null;
    topRepo: string | null;
    stack: string | null;
    level: string | null;
  },
  campaign: {
    targetLanguage: string | null;
  }
): string {
  return template
    .replace(/\{\{name\}\}/g, prospect.name || "there")
    .replace(/\{\{topRepo\}\}/g, prospect.topRepo || "your projects")
    .replace(/\{\{language\}\}/g, campaign.targetLanguage || "your language")
    .replace(/\{\{stack\}\}/g, prospect.stack || "your stack")
    .replace(/\{\{level\}\}/g, prospect.level || "developer");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, prospectIds } = body;

    if (!campaignId || !prospectIds || prospectIds.length === 0) {
      return NextResponse.json(
        { error: "Campaign ID and prospect IDs are required" },
        { status: 400 }
      );
    }

    // Get campaign details
    const [campaign] = await db
      .select()
      .from(outreachCampaigns)
      .where(eq(outreachCampaigns.id, campaignId));

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Get prospects
    const prospects = await db
      .select()
      .from(outreachProspects)
      .where(inArray(outreachProspects.id, prospectIds));

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const prospect of prospects) {
      // Skip if no email
      if (!prospect.email) {
        errors.push(`${prospect.name || "Unknown"}: No email address`);
        failed++;
        continue;
      }

      // Skip if already contacted
      if (prospect.status === "contacted" || prospect.status === "converted") {
        errors.push(`${prospect.name || "Unknown"}: Already contacted`);
        failed++;
        continue;
      }

      try {
        // Generate personalized email
        const personalizedBody = replaceVariables(
          campaign.emailTemplate || "",
          prospect,
          campaign
        );

        // Personalize subject line with prospect's name for better deliverability
        const personalizedSubject = (campaign.emailSubject || "Quick note from Tech Upkeep")
          .replace(/\{\{name\}\}/g, prospect.name || "there")
          .replace(/\{\{language\}\}/g, campaign.targetLanguage || "your language");

        // Send email via Resend with spam prevention best practices
        const result = await resend.emails.send({
          from: "Ben from Tech Upkeep <ben@techupkeep.dev>",
          to: prospect.email,
          subject: personalizedSubject,
          text: personalizedBody,
          replyTo: "ben@techupkeep.dev", // Ensures replies go to your inbox
          headers: {
            "X-Entity-Ref-ID": `outreach-${prospect.id}`, // Track campaign
          },
          tags: [
            { name: "type", value: "outreach" },
            { name: "campaign_id", value: String(campaignId) },
            { name: "prospect_id", value: String(prospect.id) },
          ],
        });

        // Track email send
        await db.insert(outreachEmails).values({
          prospectId: prospect.id,
          campaignId,
          subject: campaign.emailSubject || "Quick note from Tech Upkeep",
          body: personalizedBody,
          sentAt: new Date(),
          status: "sent",
          resendEmailId: result.data?.id || null,
        });

        // Update prospect status
        await db
          .update(outreachProspects)
          .set({
            status: "contacted",
            contactedAt: new Date(),
          })
          .where(eq(outreachProspects.id, prospect.id));

        sent++;

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error sending email to ${prospect.email}:`, error);
        errors.push(
          `${prospect.name || "Unknown"}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        failed++;
      }
    }

    // Update campaign stats
    const allProspects = await db
      .select()
      .from(outreachProspects)
      .where(eq(outreachProspects.campaignId, campaignId));

    const contacted = allProspects.filter(
      (p) => p.status === "contacted" || p.status === "responded" || p.status === "converted"
    ).length;
    const converted = allProspects.filter((p) => p.status === "converted").length;

    await db
      .update(outreachCampaigns)
      .set({
        totalContacted: contacted,
        totalConverted: converted,
      })
      .where(eq(outreachCampaigns.id, campaignId));

    return NextResponse.json({
      success: true,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error sending emails:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send emails",
      },
      { status: 500 }
    );
  }
}
