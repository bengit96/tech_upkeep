import { db } from "@/lib/db";
import { outreachProspects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = parseInt(params.id);

    const prospects = await db
      .select()
      .from(outreachProspects)
      .where(eq(outreachProspects.campaignId, campaignId));

    return NextResponse.json({ prospects });
  } catch (error) {
    console.error("Error fetching prospects:", error);
    return NextResponse.json(
      { error: "Failed to fetch prospects" },
      { status: 500 }
    );
  }
}
