import type {
  Prisma,
  RecommendationEntityType,
  RecommendationEventName,
  RecommendationSurface,
} from "@prisma/client";

export const RECOMMENDATION_STRATEGY_VERSION = "recommendation-v1";

export interface TrackInteractionEventInput {
  eventName: RecommendationEventName;
  entityType: RecommendationEntityType;
  entityId?: string | null;
  userId?: string | null;
  anonymousId?: string | null;
  sessionId?: string | null;
  surface: RecommendationSurface;
  placement?: string | null;
  position?: number | null;
  occurredAt?: Date;
  recommendationRequestId?: string | null;
  candidateSource?: string | null;
  reasonKey?: string | null;
  referrerEntityType?: RecommendationEntityType | null;
  referrerEntityId?: string | null;
  queryText?: string | null;
  artistId?: string | null;
  albumId?: string | null;
  categoryId?: string | null;
  tagSlug?: string | null;
  genre?: string | null;
  weightHint?: number | null;
  metadata?: Prisma.InputJsonValue;
  dedupeKey?: string | null;
}

export interface RecommendationImpressionItem {
  entityType: RecommendationEntityType;
  entityId: string;
  position: number;
  candidateSource?: string | null;
  reasonKey?: string | null;
  score?: number | null;
  metadata?: Prisma.InputJsonValue;
}

export interface TrackRecommendationImpressionsInput {
  requestId: string;
  userId?: string | null;
  anonymousId?: string | null;
  sessionId?: string | null;
  surface: RecommendationSurface;
  strategy?: string;
  items: RecommendationImpressionItem[];
}
