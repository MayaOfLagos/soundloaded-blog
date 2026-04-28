import { Redis } from "@upstash/redis";
import { getRecommendationEngineVersion, isRecommendationCacheEnabled } from "./config";

type RecommendationRedis = Redis;

const BIGINT_MARKER = "__soundloadedRecommendationBigInt";
let client: RecommendationRedis | null | undefined;

function getRecommendationRedis() {
  if (!isRecommendationCacheEnabled()) return null;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  if (client !== undefined) return client;

  try {
    client = Redis.fromEnv();
  } catch {
    client = null;
  }

  return client;
}

export function createRecommendationCacheKey(parts: Array<string | number | null | undefined>) {
  const prefix = process.env.RECOMMENDATION_CACHE_PREFIX || "soundloaded:recommendation";
  const version = getRecommendationEngineVersion();
  const encoded = parts
    .filter((part) => part !== null && part !== undefined && part !== "")
    .map((part) => encodeURIComponent(String(part)))
    .join(":");

  return `${prefix}:${version}:${encoded}`;
}

export async function getRecommendationCache<T>(key: string): Promise<T | null> {
  const redis = getRecommendationRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get<string>(key);
    if (typeof raw !== "string") return (raw as T) ?? null;
    return deserializeCacheValue<T>(raw);
  } catch {
    return null;
  }
}

export async function setRecommendationCache<T>(key: string, value: T, ttlSeconds: number) {
  const redis = getRecommendationRedis();
  if (!redis) return;

  try {
    await redis.set(key, serializeCacheValue(value), { ex: ttlSeconds });
  } catch {
    // Cache failure should never affect recommendation serving.
  }
}

export async function withRecommendationCache<T>({
  key,
  ttlSeconds,
  load,
}: {
  key: string;
  ttlSeconds: number;
  load: () => Promise<T>;
}): Promise<T> {
  const cached = await getRecommendationCache<T>(key);
  if (cached !== null) return cached;

  const fresh = await load();
  await setRecommendationCache(key, fresh, ttlSeconds);
  return fresh;
}

function serializeCacheValue(value: unknown) {
  return JSON.stringify(value, (_key, item) => {
    if (typeof item === "bigint") {
      return { [BIGINT_MARKER]: item.toString() };
    }

    return item;
  });
}

function deserializeCacheValue<T>(value: string): T | null {
  try {
    return JSON.parse(value, (_key, item) => {
      if (
        item &&
        typeof item === "object" &&
        BIGINT_MARKER in item &&
        typeof item[BIGINT_MARKER] === "string"
      ) {
        return BigInt(item[BIGINT_MARKER]);
      }

      return item;
    }) as T;
  } catch {
    return null;
  }
}
