import { Redis } from "@upstash/redis";

/**
 * Upstash Redis HTTP client.
 * Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars.
 * Works on both Node.js and Edge runtimes.
 */
export const redis = Redis.fromEnv();
