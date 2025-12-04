import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSends, users, newsletterDrafts } from "@/lib/db/schema";
import { and, desc, eq, isNull, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { Resend } from "resend";
import { buildHtmlForDraft } from "@/lib/services/newsletter-builder";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_NEWSLETTER =
  process.env.RESEND_FROM || "Ben from Tech Upkeep <ben@techupkeep.dev>";

// GET: list failed sends per draft (no resendEmailId)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const draftIdParam = searchParams.get("draftId");

    const baseWhere = and(
      eq(newsletterSends.status, "sent"),
      isNull(newsletterSends.resendEmailId)
    );

    const rows = await db
      .select({
        sendId: newsletterSends.id,
        userId: newsletterSends.userId,
        sentAt: newsletterSends.sentAt,
        draftId: newsletterSends.newsletterDraftId,
      })
      .from(newsletterSends)
      .where(
        draftIdParam
          ? and(
              baseWhere,
              eq(newsletterSends.newsletterDraftId, Number(draftIdParam))
            )
          : baseWhere
      )
      .orderBy(desc(newsletterSends.sentAt))
      .limit(1000);

    // Join users and drafts
    const userIds = Array.from(
      new Set(rows.map((r) => r.userId).filter(Boolean))
    ) as number[];
    const draftIds = Array.from(
      new Set(rows.map((r) => r.draftId).filter(Boolean))
    ) as number[];

    const usersList = userIds.length
      ? await db.select().from(users).where(inArray(users.id, userIds))
      : [];
    const draftsList = draftIds.length
      ? await db
          .select()
          .from(newsletterDrafts)
          .where(inArray(newsletterDrafts.id, draftIds))
      : [];

    const idToUser = new Map(usersList.map((u) => [u.id, u]));
    const idToDraft = new Map(draftsList.map((d) => [d.id, d]));

    const items = rows.map((r) => ({
      sendId: r.sendId,
      userId: r.userId,
      email: idToUser.get(r.userId!)?.email || "",
      sentAt: r.sentAt,
      draftId: r.draftId,
      draftSubject: r.draftId ? idToDraft.get(r.draftId!)?.subject || "" : "",
    }));

    return NextResponse.json({ count: items.length, items });
  } catch (error) {
    console.error("Failed to list failed newsletter sends:", error);
    return NextResponse.json(
      { error: "Failed to list failed sends" },
      { status: 500 }
    );
  }
}

// POST: resend to selected sendIds
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { sendIds } = body as { sendIds: number[] };
    if (!Array.isArray(sendIds) || sendIds.length === 0) {
      return NextResponse.json(
        { error: "sendIds is required" },
        { status: 400 }
      );
    }

    // Load sends
    const sends = await db
      .select()
      .from(newsletterSends)
      .where(inArray(newsletterSends.id, sendIds));

    let sent = 0;
    let failed = 0;

    for (const s of sends) {
      try {
        if (!s.userId || !s.newsletterDraftId) {
          failed++;
          continue;
        }

        // Load user and draft
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, s.userId))
          .limit(1);
        const [draft] = await db
          .select()
          .from(newsletterDrafts)
          .where(eq(newsletterDrafts.id, s.newsletterDraftId))
          .limit(1);
        if (!user || !draft) {
          failed++;
          continue;
        }

        // Build personalized HTML with tracking ids preserved
        const html = await buildHtmlForDraft(draft.id, {
          includeTracking: true,
          userId: user.id,
          newsletterSendId: s.id,
        });

        const { data } = await resend.emails.send({
          from: FROM_NEWSLETTER,
          to: user.email,
          subject: draft.subject,
          html,
          tags: [
            { name: "category", value: "newsletter" },
            { name: "user_id", value: String(user.id) },
            { name: "newsletter_send_id", value: String(s.id) },
            { name: "draft_id", value: String(draft.id) },
          ],
        });

        if (data?.id) {
          await db
            .update(newsletterSends)
            .set({ resendEmailId: data.id })
            .where(eq(newsletterSends.id, s.id));
          sent++;
        } else {
          failed++;
        }
      } catch (e) {
        console.error("Resend failed for sendId", s.id, e);
        failed++;
      }
    }

    return NextResponse.json({ sent, failed, total: sends.length });
  } catch (error) {
    console.error("Failed to resend failed newsletter sends:", error);
    return NextResponse.json({ error: "Failed to resend" }, { status: 500 });
  }
}
