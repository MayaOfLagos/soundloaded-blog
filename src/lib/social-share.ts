import { db } from "@/lib/db";

interface SharePost {
  title: string;
  url: string;
  excerpt?: string | null;
  type: string;
}

/**
 * Auto-share a published post to configured social channels.
 * Called fire-and-forget from admin publish endpoints.
 */
export async function autoSharePost(post: SharePost) {
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "default" },
      select: {
        siteUrl: true,
        siteName: true,
        autoShareTwitter: true,
        autoShareTelegram: true,
        telegramBotToken: true,
        telegramChatId: true,
        discordWebhookUrl: true,
        notifyOnPublish: true,
      },
    });

    if (!settings) return;

    const fullUrl = `${settings.siteUrl}${post.url}`;
    const text = formatShareText(post, settings.siteName, fullUrl);
    const tasks: Promise<void>[] = [];

    // Twitter/X via API v2
    if (settings.autoShareTwitter && process.env.TWITTER_BEARER_TOKEN) {
      tasks.push(shareToTwitter(text));
    }

    // Telegram
    if (settings.autoShareTelegram && settings.telegramBotToken && settings.telegramChatId) {
      tasks.push(
        shareToTelegram(text, fullUrl, settings.telegramBotToken, settings.telegramChatId)
      );
    }

    // Discord webhook
    if (settings.notifyOnPublish && settings.discordWebhookUrl) {
      tasks.push(shareToDiscord(post, fullUrl, settings.discordWebhookUrl));
    }

    await Promise.allSettled(tasks);
  } catch (err) {
    console.error("[autoSharePost] error:", err);
  }
}

function formatShareText(post: SharePost, siteName: string, url: string): string {
  const emoji = post.type === "MUSIC" ? "🎵" : post.type === "VIDEO" ? "🎬" : "📰";
  const excerpt = post.excerpt ? `\n\n${post.excerpt.slice(0, 200)}` : "";
  return `${emoji} ${post.title}${excerpt}\n\n${url}\n\n#${siteName.replace(/\s+/g, "")}`;
}

async function shareToTwitter(text: string) {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) return;

  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: text.slice(0, 280) }),
  });

  if (!res.ok) {
    console.error("[Twitter] share failed:", res.status, await res.text());
  }
}

async function shareToTelegram(text: string, url: string, botToken: string, chatId: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });

  if (!res.ok) {
    console.error("[Telegram] share failed:", res.status, await res.text());
  }
}

async function shareToDiscord(post: SharePost, url: string, webhookUrl: string) {
  const color = post.type === "MUSIC" ? 0xe11d48 : post.type === "VIDEO" ? 0x7c3aed : 0x2563eb;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: post.title,
          url,
          description: post.excerpt?.slice(0, 300) ?? "",
          color,
          footer: { text: `New ${post.type.toLowerCase()} published` },
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("[Discord] share failed:", res.status, await res.text());
  }
}
