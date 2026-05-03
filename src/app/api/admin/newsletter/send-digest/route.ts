import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

function buildDigestHtml(
  posts: Array<{ title: string; slug: string; excerpt: string | null; type: string }>,
  siteName: string,
  siteUrl: string
): string {
  const typeLabel: Record<string, string> = {
    MUSIC: "🎵 Music",
    NEWS: "📰 News",
    GIST: "💬 Gist",
    VIDEO: "🎬 Video",
    LYRICS: "📝 Lyrics",
    ALBUM: "💿 Album",
  };

  const postRows = posts
    .map((p) => {
      const label = typeLabel[p.type] ?? p.type;
      const url = `${siteUrl}/${p.slug}`;
      const excerpt = p.excerpt
        ? p.excerpt.slice(0, 140) + (p.excerpt.length > 140 ? "…" : "")
        : "";
      return `
        <div style="border-bottom: 1px solid #1e293b; padding: 16px 0;">
          <span style="display: inline-block; background: #e11d48; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-bottom: 6px;">${label}</span>
          <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 700;">
            <a href="${url}" style="color: #f1f5f9; text-decoration: none;">${p.title}</a>
          </h3>
          ${excerpt ? `<p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">${excerpt}</p>` : ""}
          <a href="${url}" style="display: inline-block; margin-top: 8px; color: #e11d48; font-size: 13px; font-weight: 600; text-decoration: none;">Read more →</a>
        </div>
      `;
    })
    .join("");

  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #f1f5f9; border-radius: 12px; overflow: hidden;">
      <div style="background: #e11d48; padding: 28px 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #fff;">${siteName}</h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Your weekly digest</p>
      </div>
      <div style="padding: 28px 32px;">
        <h2 style="margin: 0 0 4px; font-size: 18px; font-weight: 700; color: #f1f5f9;">What you missed this week</h2>
        <p style="margin: 0 0 20px; color: #64748b; font-size: 13px;">${posts.length} new post${posts.length !== 1 ? "s" : ""} since your last digest</p>
        ${postRows}
        <div style="text-align: center; padding-top: 24px;">
          <a href="${siteUrl}" style="display: inline-block; background: #e11d48; color: #fff; font-weight: 700; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px;">
            Visit ${siteName}
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #1e293b; margin: 28px 0 16px;" />
        <p style="margin: 0; color: #475569; font-size: 11px; text-align: center;">
          You're receiving this because you subscribed to ${siteName}.<br />
          <a href="${siteUrl}/unsubscribe" style="color: #64748b;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `;
}

export async function POST() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "default" },
      select: {
        emailDigestEnabled: true,
        siteName: true,
        siteUrl: true,
        emailFromAddress: true,
        emailFromName: true,
      },
    });

    if (!settings?.emailDigestEnabled) {
      return NextResponse.json(
        { error: "Digest emails are disabled in settings" },
        { status: 400 }
      );
    }

    const siteName = settings.siteName ?? "Soundloaded Blog";
    const siteUrl = settings.siteUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

    // Get posts published in the last 7 days, max 10
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await db.post.findMany({
      where: { status: "PUBLISHED", publishedAt: { gte: since } },
      orderBy: { publishedAt: "desc" },
      take: 10,
      select: { title: true, slug: true, excerpt: true, type: true },
    });

    if (posts.length === 0) {
      return NextResponse.json({ sent: 0, message: "No posts published in the last 7 days" });
    }

    const subscribers = await db.subscriber.findMany({
      where: { status: "CONFIRMED" },
      select: { email: true, name: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ sent: 0, message: "No confirmed subscribers" });
    }

    const { resend, getTransactionalFrom } = await import("@/lib/resend");
    const from = await getTransactionalFrom();
    const html = buildDigestHtml(posts, siteName, siteUrl);

    let sent = 0;
    let failed = 0;

    // Send in batches of 10 to avoid rate limits
    for (let i = 0; i < subscribers.length; i += 10) {
      const batch = subscribers.slice(i, i + 10);
      await Promise.allSettled(
        batch.map(async (sub) => {
          try {
            await resend.emails.send({
              from,
              to: sub.email,
              subject: `This week on ${siteName} 🎵`,
              html,
            });
            sent++;
          } catch {
            failed++;
          }
        })
      );
    }

    return NextResponse.json({
      sent,
      failed,
      total: subscribers.length,
      posts: posts.length,
    });
  } catch (err) {
    console.error("[POST /api/admin/newsletter/send-digest]", err);
    return NextResponse.json({ error: "Failed to send digest" }, { status: 500 });
  }
}
