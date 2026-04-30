import { NextRequest, NextResponse } from "next/server";
import {
  Prisma,
  RecommendationEntityType,
  RecommendationEventName,
  RecommendationSurface,
} from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRedis } from "@/lib/redis";
import { trackInteractionEvent } from "@/lib/recommendation";

// Increment stream count — called client-side after 30s of actual playback
// Deduped: one count per user/session/IP per track per 5 minutes
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  try {
    const body = await readPlayCountBody(req);
    const music = await db.music.findUnique({
      where: { id },
      select: {
        id: true,
        duration: true,
        artistId: true,
        albumId: true,
        genre: true,
        accessModel: true,
        streamAccess: true,
        isExclusive: true,
      },
    });

    if (!music) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const actorKey = userId
      ? `user:${userId}`
      : body.sessionId
        ? `session:${body.sessionId}`
        : body.anonymousId
          ? `anonymous:${body.anonymousId}`
          : `ip:${ip}`;

    // De-duplicate via Redis (one play per actor per track per 5 min)
    const redisKey = `sl:playcount:${id}:${actorKey}`;
    try {
      const redis = getRedis();
      const isNew = await redis.set(redisKey, "1", { nx: true, ex: 300 });
      if (!isNew) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
    } catch {
      // Redis unavailable — reject to prevent abuse (fail-closed)
      return NextResponse.json({ ok: true, skipped: true });
    }

    await db.music.update({
      where: { id },
      data: { streamCount: { increment: 1 } },
    });

    trackInteractionEvent({
      eventName: RecommendationEventName.MUSIC_PLAY_QUALIFIED,
      entityType: RecommendationEntityType.MUSIC,
      entityId: id,
      userId,
      anonymousId: body.anonymousId,
      sessionId: body.sessionId,
      surface: body.surface,
      placement: body.placement,
      recommendationRequestId: body.recommendationRequestId,
      candidateSource: body.candidateSource,
      reasonKey: body.reasonKey,
      artistId: music.artistId,
      albumId: music.albumId,
      genre: music.genre,
      weightHint: 2,
      metadata: {
        dedupeWindowSeconds: 300,
        actorKind: actorKey.split(":")[0],
        listenedSeconds: body.listenedSeconds,
        clientDuration: body.duration,
        trackDuration: music.duration,
        accessModel: music.accessModel,
        streamAccess: music.streamAccess,
        isExclusive: music.isExclusive,
      } satisfies Prisma.InputJsonValue,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

interface PlayCountBody {
  anonymousId: string | null;
  sessionId: string | null;
  surface: RecommendationSurface;
  placement: string | null;
  recommendationRequestId: string | null;
  candidateSource: string | null;
  reasonKey: string | null;
  listenedSeconds: number | null;
  duration: number | null;
}

async function readPlayCountBody(req: NextRequest): Promise<PlayCountBody> {
  let raw: Record<string, unknown> = {};

  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    raw = {};
  }

  return {
    anonymousId: stringOrNull(raw.anonymousId),
    sessionId: stringOrNull(raw.sessionId),
    surface: parseSurface(raw.surface),
    placement: stringOrNull(raw.placement),
    recommendationRequestId: stringOrNull(raw.recommendationRequestId),
    candidateSource: stringOrNull(raw.candidateSource),
    reasonKey: stringOrNull(raw.reasonKey),
    listenedSeconds: numberOrNull(raw.listenedSeconds),
    duration: numberOrNull(raw.duration),
  };
}

function parseSurface(value: unknown): RecommendationSurface {
  if (
    typeof value === "string" &&
    (Object.values(RecommendationSurface) as string[]).includes(value)
  ) {
    return value as RecommendationSurface;
  }

  return RecommendationSurface.MUSIC_DETAIL;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 200) : null;
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : null;
}
