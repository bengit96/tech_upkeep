import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterConfig } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/**
 * Get newsletter configuration (header/footer content)
 */
export async function GET() {
  try {
    await requireAdmin();
    // Get the latest config (there should only be one row)
    const [config] = await db
      .select()
      .from(newsletterConfig)
      .limit(1);

    if (!config) {
      // Return empty config if none exists
      return NextResponse.json({
        headerContent: '',
        footerContent: '',
      });
    }

    return NextResponse.json({
      headerContent: config.headerContent || '',
      footerContent: config.footerContent || '',
    });
  } catch (error) {
    console.error("Error fetching newsletter config:", error);
    return NextResponse.json(
      { error: "Failed to fetch newsletter config" },
      { status: 500 }
    );
  }
}

/**
 * Update newsletter configuration
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { headerContent, footerContent } = await request.json();

    // Check if config exists
    const [existingConfig] = await db
      .select()
      .from(newsletterConfig)
      .limit(1);

    if (existingConfig) {
      // Update existing config
      await db
        .update(newsletterConfig)
        .set({
          headerContent: headerContent || null,
          footerContent: footerContent || null,
          updatedAt: sql`now()`,
        })
        .where(sql`id = ${existingConfig.id}`);
    } else {
      // Create new config
      await db.insert(newsletterConfig).values({
        headerContent: headerContent || null,
        footerContent: footerContent || null,
      });
    }

    return NextResponse.json({
      message: "Newsletter config updated successfully",
    });
  } catch (error) {
    console.error("Error updating newsletter config:", error);
    return NextResponse.json(
      { error: "Failed to update newsletter config" },
      { status: 500 }
    );
  }
}
