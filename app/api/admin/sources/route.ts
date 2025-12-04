import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    // Fetch all sources from database
    const allSources = await db.select().from(sources);

    // Group sources by type for the UI
    const groupedSources = {
      rssFeeds: allSources
        .filter(s => s.type === 'blog' || s.type === 'rss')
        .map(s => ({
          id: s.id,
          name: s.name,
          url: s.url,
          type: s.type,
          active: s.isActive,
        })),
      substackFeeds: allSources
        .filter(s => s.type === 'substack')
        .map(s => ({
          id: s.id,
          name: s.name,
          url: s.url,
          type: s.type,
          active: s.isActive,
        })),
      podcastFeeds: allSources
        .filter(s => s.type === 'podcast')
        .map(s => ({
          id: s.id,
          name: s.name,
          url: s.url,
          type: s.type,
          active: s.isActive,
        })),
      redditSubs: allSources
        .filter(s => s.type === 'reddit')
        .map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          active: s.isActive,
        })),
      youtubeChannels: allSources
        .filter(s => s.type === 'youtube')
        .map(s => {
          const metadata = s.metadata ? JSON.parse(s.metadata) : {};
          return {
            id: s.id,
            name: s.name,
            channelId: metadata.channelId,
            type: s.type,
            active: s.isActive,
          };
        }),
    };

    return NextResponse.json(groupedSources);
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

// Add new source
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, url, type, metadata } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Insert new source
    const [newSource] = await db
      .insert(sources)
      .values({
        name,
        slug,
        type,
        url: url || '',
        metadata: metadata ? JSON.stringify(metadata) : null,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      message: "Source added successfully",
      source: newSource
    });
  } catch (error) {
    console.error("Error adding source:", error);
    return NextResponse.json(
      { error: "Failed to add source" },
      { status: 500 }
    );
  }
}

// Update source (toggle active or edit)
export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, isActive, name, url, metadata } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Source ID is required" },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {};
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (name) updates.name = name;
    if (url) updates.url = url;
    if (metadata) updates.metadata = JSON.stringify(metadata);

    // Update source
    const [updatedSource] = await db
      .update(sources)
      .set(updates)
      .where(eq(sources.id, id))
      .returning();

    return NextResponse.json({
      message: "Source updated successfully",
      source: updatedSource
    });
  } catch (error) {
    console.error("Error updating source:", error);
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    );
  }
}

// Delete source
export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Source ID is required" },
        { status: 400 }
      );
    }

    await db.delete(sources).where(eq(sources.id, parseInt(id)));

    return NextResponse.json({
      message: "Source deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting source:", error);
    return NextResponse.json(
      { error: "Failed to delete source" },
      { status: 500 }
    );
  }
}
