import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { shouldTrackRecommendationImpressions } from "./config";
import {
  RECOMMENDATION_STRATEGY_VERSION,
  type TrackInteractionEventInput,
  type TrackRecommendationImpressionsInput,
} from "./types";

export function buildRecommendationDedupeKey(
  parts: Array<string | number | boolean | null | undefined>
) {
  return parts
    .filter((part) => part !== null && part !== undefined && part !== "")
    .map((part) => String(part))
    .join(":");
}

export function createRecommendationRequestId(prefix = "recommendation") {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

export function trackInteractionEvent(input: TrackInteractionEventInput) {
  writeInteractionEvent(input).catch(() => {});
}

export async function writeInteractionEvent(input: TrackInteractionEventInput) {
  try {
    return await db.interactionEvent.create({
      data: {
        eventName: input.eventName,
        entityType: input.entityType,
        entityId: input.entityId,
        userId: input.userId,
        anonymousId: input.anonymousId,
        sessionId: input.sessionId,
        surface: input.surface,
        placement: input.placement,
        position: input.position,
        occurredAt: input.occurredAt,
        recommendationRequestId: input.recommendationRequestId,
        candidateSource: input.candidateSource,
        reasonKey: input.reasonKey,
        referrerEntityType: input.referrerEntityType,
        referrerEntityId: input.referrerEntityId,
        queryText: input.queryText,
        artistId: input.artistId,
        albumId: input.albumId,
        categoryId: input.categoryId,
        tagSlug: input.tagSlug,
        genre: input.genre,
        weightHint: input.weightHint,
        metadata: input.metadata ?? undefined,
        dedupeKey: input.dedupeKey,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }

    if (process.env.NODE_ENV === "development") {
      console.error("[recommendation:event]", error);
    }
    return null;
  }
}

export function trackRecommendationImpressions(input: TrackRecommendationImpressionsInput) {
  if (!shouldTrackRecommendationImpressions()) return;
  writeRecommendationImpressions(input).catch(() => {});
}

export async function writeRecommendationImpressions(input: TrackRecommendationImpressionsInput) {
  if (!shouldTrackRecommendationImpressions()) return { count: 0 };
  if (input.items.length === 0) return { count: 0 };

  try {
    return await db.recommendationImpression.createMany({
      data: input.items.map((item) => ({
        requestId: input.requestId,
        userId: input.userId,
        anonymousId: input.anonymousId,
        sessionId: input.sessionId,
        surface: input.surface,
        strategy: input.strategy ?? RECOMMENDATION_STRATEGY_VERSION,
        entityType: item.entityType,
        entityId: item.entityId,
        position: item.position,
        candidateSource: item.candidateSource,
        reasonKey: item.reasonKey,
        score: item.score,
        metadata: item.metadata ?? undefined,
      })),
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[recommendation:impressions]", error);
    }
    return { count: 0 };
  }
}
