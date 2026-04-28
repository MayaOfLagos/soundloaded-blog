import {
  AffinityDimensionType,
  RecommendationEntityType,
  RecommendationEventName,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  createRecommendationCacheKey,
  getRecommendationCache,
  setRecommendationCache,
} from "./cache";
import { getRecommendationCacheTtlSeconds } from "./config";

const EVENT_WEIGHTS: Partial<Record<RecommendationEventName, number>> = {
  POST_VIEW: 1,
  POST_REACTION_ADD: 3,
  POST_COMMENT_CREATE: 5,
  POST_BOOKMARK_ADD: 5,
  POST_FAVORITE_ADD: 5,
  POST_DOWNLOAD: 6,
  POST_HIDE: -8,
  MUSIC_PLAY_QUALIFIED: 2,
  MUSIC_DOWNLOAD: 7,
  MUSIC_BOOKMARK_ADD: 5,
  MUSIC_FAVORITE_ADD: 5,
  MUSIC_PLAYLIST_ADD: 6,
  ARTIST_FOLLOW: 8,
  USER_FOLLOW: 5,
  SEARCH_QUERY: 0.5,
  SEARCH_RESULT_CLICK: 4,
  RECOMMENDATION_CLICK: 4,
  RECOMMENDATION_DISMISS: -6,
};

interface AffinitySnapshotDTO {
  dimensionType: AffinityDimensionType;
  dimensionKey: string;
  score: number;
  eventCount: number;
  lastEventAt: string | Date | null;
}

export interface UserAffinityProfile {
  authorScores: Map<string, number>;
  categoryScores: Map<string, number>;
  postTypeScores: Map<string, number>;
  artistScores: Map<string, number>;
  genreScores: Map<string, number>;
  tagScores: Map<string, number>;
}

interface AffinityAccumulator {
  score: number;
  eventCount: number;
  lastEventAt: Date | null;
}

export async function getUserAffinityProfile({
  userId,
  windowDays = 30,
  limitPerDimension = 25,
}: {
  userId: string;
  windowDays?: number;
  limitPerDimension?: number;
}): Promise<UserAffinityProfile> {
  const key = createRecommendationCacheKey(["affinity", userId, windowDays, limitPerDimension]);
  const cached = await getRecommendationCache<AffinitySnapshotDTO[]>(key);
  const snapshots =
    cached ??
    (await db.userAffinitySnapshot.findMany({
      where: { userId, windowDays },
      orderBy: { score: "desc" },
      take: limitPerDimension * 6,
      select: {
        dimensionType: true,
        dimensionKey: true,
        score: true,
        eventCount: true,
        lastEventAt: true,
      },
    }));

  if (!cached) {
    await setRecommendationCache(key, snapshots, getRecommendationCacheTtlSeconds("affinity"));
  }

  return {
    authorScores: buildScoreMap(snapshots, AffinityDimensionType.AUTHOR, limitPerDimension),
    categoryScores: buildScoreMap(snapshots, AffinityDimensionType.CATEGORY, limitPerDimension),
    postTypeScores: buildScoreMap(snapshots, AffinityDimensionType.POST_TYPE, limitPerDimension),
    artistScores: buildScoreMap(snapshots, AffinityDimensionType.ARTIST, limitPerDimension),
    genreScores: buildScoreMap(snapshots, AffinityDimensionType.GENRE, limitPerDimension),
    tagScores: buildScoreMap(snapshots, AffinityDimensionType.TAG, limitPerDimension),
  };
}

export async function refreshUserAffinitySnapshots({
  userId,
  windowDays = 30,
  eventLimit = 750,
  limitPerDimension = 25,
}: {
  userId: string;
  windowDays?: number;
  eventLimit?: number;
  limitPerDimension?: number;
}) {
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const events = await db.interactionEvent.findMany({
    where: {
      userId,
      occurredAt: { gte: cutoff },
      eventName: { in: Object.keys(EVENT_WEIGHTS) as RecommendationEventName[] },
    },
    orderBy: { occurredAt: "desc" },
    take: eventLimit,
    select: {
      eventName: true,
      entityType: true,
      entityId: true,
      occurredAt: true,
      artistId: true,
      categoryId: true,
      tagSlug: true,
      genre: true,
      weightHint: true,
    },
  });

  if (events.length === 0) {
    return { eventCount: 0, snapshotCount: 0 };
  }

  const postIds = uniqueIds(
    events
      .filter((event) => event.entityType === RecommendationEntityType.POST)
      .map((event) => event.entityId)
  );
  const musicIds = uniqueIds(
    events
      .filter((event) => event.entityType === RecommendationEntityType.MUSIC)
      .map((event) => event.entityId)
  );

  const [posts, tracks] = await Promise.all([
    postIds.length > 0
      ? db.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            authorId: true,
            categoryId: true,
            category: { select: { slug: true } },
            type: true,
            tags: { select: { tag: { select: { slug: true } } } },
            music: { select: { artistId: true, genre: true } },
          },
        })
      : Promise.resolve([]),
    musicIds.length > 0
      ? db.music.findMany({
          where: { id: { in: musicIds } },
          select: { id: true, artistId: true, genre: true },
        })
      : Promise.resolve([]),
  ]);

  const postById = new Map(posts.map((post) => [post.id, post]));
  const trackById = new Map(tracks.map((track) => [track.id, track]));
  const scores = new Map<string, AffinityAccumulator>();

  for (const event of events) {
    const baseWeight = event.weightHint ?? EVENT_WEIGHTS[event.eventName] ?? 1;
    const ageMs = Date.now() - event.occurredAt.getTime();
    const ageDays = Math.max(0, ageMs / 86400000);
    const recencyMultiplier = 1 / Math.pow(ageDays + 1, 0.35);
    const weight = baseWeight * recencyMultiplier;

    addScore(scores, AffinityDimensionType.ARTIST, event.artistId, weight, event.occurredAt);
    addScore(scores, AffinityDimensionType.CATEGORY, event.categoryId, weight, event.occurredAt);
    addScore(scores, AffinityDimensionType.TAG, event.tagSlug, weight, event.occurredAt);
    addScore(
      scores,
      AffinityDimensionType.GENRE,
      normalizeKey(event.genre),
      weight,
      event.occurredAt
    );

    if (event.entityType === RecommendationEntityType.POST && event.entityId) {
      const post = postById.get(event.entityId);
      if (post) {
        addScore(scores, AffinityDimensionType.AUTHOR, post.authorId, weight, event.occurredAt);
        addScore(
          scores,
          AffinityDimensionType.CATEGORY,
          post.category?.slug ?? post.categoryId,
          weight,
          event.occurredAt
        );
        addScore(scores, AffinityDimensionType.POST_TYPE, post.type, weight, event.occurredAt);
        addScore(
          scores,
          AffinityDimensionType.ARTIST,
          post.music?.artistId,
          weight,
          event.occurredAt
        );
        addScore(
          scores,
          AffinityDimensionType.GENRE,
          normalizeKey(post.music?.genre),
          weight,
          event.occurredAt
        );

        for (const { tag } of post.tags) {
          addScore(scores, AffinityDimensionType.TAG, tag.slug, weight * 0.7, event.occurredAt);
        }
      }
    }

    if (event.entityType === RecommendationEntityType.MUSIC && event.entityId) {
      const track = trackById.get(event.entityId);
      if (track) {
        addScore(scores, AffinityDimensionType.ARTIST, track.artistId, weight, event.occurredAt);
        addScore(
          scores,
          AffinityDimensionType.GENRE,
          normalizeKey(track.genre),
          weight,
          event.occurredAt
        );
      }
    }
  }

  const snapshots = topAffinityRows(scores, limitPerDimension);

  await Promise.all(
    snapshots.map((snapshot) =>
      db.userAffinitySnapshot.upsert({
        where: {
          userId_dimensionType_dimensionKey_windowDays: {
            userId,
            dimensionType: snapshot.dimensionType,
            dimensionKey: snapshot.dimensionKey,
            windowDays,
          },
        },
        create: {
          userId,
          dimensionType: snapshot.dimensionType,
          dimensionKey: snapshot.dimensionKey,
          score: snapshot.score,
          eventCount: snapshot.eventCount,
          windowDays,
          lastEventAt: snapshot.lastEventAt,
          metadata: snapshot.metadata,
        },
        update: {
          score: snapshot.score,
          eventCount: snapshot.eventCount,
          lastEventAt: snapshot.lastEventAt,
          metadata: snapshot.metadata,
        },
      })
    )
  );

  return { eventCount: events.length, snapshotCount: snapshots.length };
}

export async function refreshActiveUserAffinitySnapshots({
  windowDays = 30,
  eventLookbackDays = 30,
  batchSize = 50,
  eventLimit = 750,
  limitPerDimension = 25,
}: {
  windowDays?: number;
  eventLookbackDays?: number;
  batchSize?: number;
  eventLimit?: number;
  limitPerDimension?: number;
} = {}) {
  const cutoff = new Date(Date.now() - eventLookbackDays * 24 * 60 * 60 * 1000);
  const safeBatchSize = Math.min(Math.max(batchSize, 1), 250);
  const activeUsers = await db.interactionEvent.findMany({
    where: {
      userId: { not: null },
      occurredAt: { gte: cutoff },
    },
    distinct: ["userId"],
    orderBy: { occurredAt: "desc" },
    take: safeBatchSize,
    select: { userId: true },
  });

  const results: Array<{ userId: string; eventCount: number; snapshotCount: number }> = [];

  for (const user of activeUsers) {
    if (!user.userId) continue;
    const result = await refreshUserAffinitySnapshots({
      userId: user.userId,
      windowDays,
      eventLimit,
      limitPerDimension,
    });
    results.push({ userId: user.userId, ...result });
  }

  return {
    userCount: results.length,
    eventCount: results.reduce((sum, result) => sum + result.eventCount, 0),
    snapshotCount: results.reduce((sum, result) => sum + result.snapshotCount, 0),
    results,
  };
}

function buildScoreMap(
  snapshots: AffinitySnapshotDTO[],
  dimensionType: AffinityDimensionType,
  limit: number
) {
  return new Map(
    snapshots
      .filter((snapshot) => snapshot.dimensionType === dimensionType)
      .slice(0, limit)
      .map((snapshot) => [snapshot.dimensionKey, snapshot.score])
  );
}

function addScore(
  scores: Map<string, AffinityAccumulator>,
  dimensionType: AffinityDimensionType,
  dimensionKey: string | null | undefined,
  weight: number,
  occurredAt: Date
) {
  if (!dimensionKey) return;
  const key = `${dimensionType}:${dimensionKey}`;
  const existing = scores.get(key) ?? { score: 0, eventCount: 0, lastEventAt: null };

  existing.score += weight;
  existing.eventCount += 1;
  if (!existing.lastEventAt || occurredAt > existing.lastEventAt) {
    existing.lastEventAt = occurredAt;
  }

  scores.set(key, existing);
}

function topAffinityRows(scores: Map<string, AffinityAccumulator>, limitPerDimension: number) {
  const byDimension = new Map<
    AffinityDimensionType,
    Array<AffinityAccumulator & { key: string }>
  >();

  for (const [compoundKey, value] of scores) {
    const [dimensionType, ...dimensionKeyParts] = compoundKey.split(":");
    const dimensionKey = dimensionKeyParts.join(":");
    const bucket = byDimension.get(dimensionType as AffinityDimensionType) ?? [];

    bucket.push({ ...value, key: dimensionKey });
    byDimension.set(dimensionType as AffinityDimensionType, bucket);
  }

  return Array.from(byDimension.entries()).flatMap(([dimensionType, rows]) =>
    rows
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limitPerDimension)
      .map((row) => ({
        dimensionType,
        dimensionKey: row.key,
        score: roundScore(row.score),
        eventCount: row.eventCount,
        lastEventAt: row.lastEventAt,
        metadata: {
          strategy: "recommendation-affinity-v1",
        } satisfies Prisma.InputJsonObject,
      }))
  );
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter(Boolean))) as string[];
}

function normalizeKey(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function roundScore(score: number) {
  return Math.round(score * 1000) / 1000;
}
