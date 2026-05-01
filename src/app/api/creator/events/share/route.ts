import { NextRequest, NextResponse } from "next/server";
import {
  RecommendationEntityType,
  RecommendationEventName,
  RecommendationSurface,
} from "@prisma/client";

import { auth } from "@/lib/auth";
import {
  mergeCreatorEventMetadata,
  readCreatorEntityType,
  readCreatorEventContext,
  writeArtistActionEvent,
  writeMusicActionEvent,
  writePostShareEvent,
} from "@/lib/creator-growth-events";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const entityType = readCreatorEntityType((body as Record<string, unknown>).entityType);
  const entityId = readString((body as Record<string, unknown>).entityId);

  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 });
  }

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const context = readCreatorEventContext(body, defaultShareSurface(entityType));
  const metadata = mergeCreatorEventMetadata({
    eventKind: `${entityType.toLowerCase()}_share_click`,
    shareChannel: context.shareChannel ?? "unknown",
    href: context.href,
  });

  if (entityType === RecommendationEntityType.MUSIC) {
    await writeMusicActionEvent({
      eventName: RecommendationEventName.MUSIC_DETAIL_OPEN,
      musicId: entityId,
      userId,
      context,
      weightHint: 4,
      metadata,
    });
    return NextResponse.json({ ok: true });
  }

  if (entityType === RecommendationEntityType.ARTIST) {
    await writeArtistActionEvent({
      eventName: RecommendationEventName.ARTIST_DETAIL_OPEN,
      artistId: entityId,
      userId,
      context,
      weightHint: 5,
      metadata,
    });
    return NextResponse.json({ ok: true });
  }

  if (entityType === RecommendationEntityType.POST) {
    await writePostShareEvent({
      postId: entityId,
      userId,
      context,
      metadata,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, skipped: true });
}

function defaultShareSurface(entityType: RecommendationEntityType) {
  if (entityType === RecommendationEntityType.ARTIST) return RecommendationSurface.ARTIST_DETAIL;
  if (entityType === RecommendationEntityType.POST) return RecommendationSurface.POST_DETAIL;
  if (entityType === RecommendationEntityType.PLAYLIST)
    return RecommendationSurface.PLAYLIST_DETAIL;
  return RecommendationSurface.MUSIC_DETAIL;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
