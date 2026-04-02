import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getLatestPosts } from "@/lib/api/posts";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const settings = await getSettings();
    results.settings = { ok: true, siteName: settings.siteName };
  } catch (e) {
    results.settings = { ok: false, error: String(e) };
  }

  try {
    const count = await db.post.count({ where: { status: "PUBLISHED" } });
    results.postCount = { ok: true, count };
  } catch (e) {
    results.postCount = { ok: false, error: String(e) };
  }

  try {
    const posts = await getLatestPosts({ limit: 1 });
    results.latestPost = { ok: true, count: posts.length, title: posts[0]?.title };
  } catch (e) {
    results.latestPost = { ok: false, error: String(e) };
  }

  try {
    const playlist = await db.playlist.count();
    results.playlist = { ok: true, count: playlist };
  } catch (e) {
    results.playlist = { ok: false, error: String(e) };
  }

  return NextResponse.json(results);
}
