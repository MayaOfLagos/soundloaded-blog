export type RecommendationEngineVersion = "legacy" | "v1";
export type RecommendationCacheKind =
  | "feed"
  | "explore"
  | "relatedPosts"
  | "relatedMusic"
  | "affinity";

const DEFAULT_CACHE_TTLS: Record<RecommendationCacheKind, number> = {
  feed: 60,
  explore: 120,
  relatedPosts: 600,
  relatedMusic: 600,
  affinity: 300,
};

export function getRecommendationEngineVersion(): RecommendationEngineVersion {
  const raw = process.env.RECOMMENDATION_ENGINE_VERSION?.trim().toLowerCase();
  return raw === "legacy" ? "legacy" : "v1";
}

export function isRecommendationV1Enabled() {
  return getRecommendationEngineVersion() === "v1";
}

export function shouldTrackRecommendationImpressions() {
  return process.env.RECOMMENDATION_IMPRESSIONS_ENABLED !== "false";
}

export function isRecommendationCacheEnabled() {
  return process.env.RECOMMENDATION_CACHE_ENABLED !== "false";
}

export function isRecommendationDebugEnabled() {
  return process.env.RECOMMENDATION_DEBUG === "true";
}

export function getRecommendationCacheTtlSeconds(kind: RecommendationCacheKind) {
  const specific = readPositiveInt(
    process.env[`RECOMMENDATION_${kind.toUpperCase()}_CACHE_TTL_SECONDS`]
  );
  if (specific !== null) return specific;

  const global = readPositiveInt(process.env.RECOMMENDATION_CACHE_TTL_SECONDS);
  return global ?? DEFAULT_CACHE_TTLS[kind];
}

function readPositiveInt(value: string | undefined) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
