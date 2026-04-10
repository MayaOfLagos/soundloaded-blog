import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Separate Redis import for lockout checking
let redis: {
  get: (key: string) => Promise<string | null>;
} | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  import("@upstash/redis").then(({ Redis }) => {
    redis = Redis.fromEnv() as typeof redis;
  });
}

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    if (!redis) {
      return NextResponse.json({ locked: false });
    }

    // Check the Redis lock key directly — no DB lookup needed.
    // This also prevents user enumeration: we check the lock key for any email,
    // so the response is identical whether or not the account exists.
    const lockKey = `sl_login_lock:${email}`;
    const lockVal = await redis.get(lockKey);

    if (lockVal) {
      // Return a fixed lockout duration (don't reveal DB settings)
      return NextResponse.json({ locked: true, minutes: 15 });
    }

    return NextResponse.json({ locked: false });
  } catch {
    return NextResponse.json({ locked: false });
  }
}
