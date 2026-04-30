import { Redis } from "@upstash/redis";

/**
 * Upstash Redis HTTP client.
 * Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars.
 * Works on both Node.js and Edge runtimes.
 */
let redisClient: Redis | null = null;

export function getRedis() {
  if (!redisClient) {
    redisClient = Redis.fromEnv();
  }

  return redisClient;
}
