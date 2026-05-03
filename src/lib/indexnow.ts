import { db } from "@/lib/db";

export async function submitToIndexNow(urls: string[]): Promise<void> {
  if (!urls.length) return;

  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { indexNowKey: true, siteUrl: true },
  });

  const key = settings?.indexNowKey;
  const siteUrl = (settings?.siteUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  if (!key || !siteUrl) return;

  let host: string;
  try {
    host = new URL(siteUrl).hostname;
  } catch {
    return;
  }

  try {
    await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${siteUrl}/api/indexnow`,
        urlList: urls,
      }),
    });
  } catch {
    // Fire-and-forget — never block a publish on indexing failure
  }
}
