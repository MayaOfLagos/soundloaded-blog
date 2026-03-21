import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { initializeTransaction, PRICES } from "@/lib/paystack";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        prefix: "ratelimit:payment",
      })
    : null;

const schema = z.object({
  type: z.enum(["subscription", "download"]),
  musicId: z.string().optional(),
  plan: z.enum(["monthly", "yearly"]).optional().default("monthly"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = session.user as { id: string; email?: string | null };

  // Rate limit per user
  if (ratelimit) {
    const { success } = await ratelimit.limit(user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Too many payment requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  if (!user.email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const body = schema.parse(await req.json());
    let amount: number;
    let musicId: string | null = null;

    if (body.type === "download") {
      if (!body.musicId) {
        return NextResponse.json({ error: "musicId required for download" }, { status: 400 });
      }
      const music = await db.music.findUnique({
        where: { id: body.musicId },
        select: { id: true, price: true, isExclusive: true },
      });
      if (!music || !music.isExclusive) {
        return NextResponse.json({ error: "Track not found or not premium" }, { status: 404 });
      }
      amount = music.price ?? PRICES.DOWNLOAD_DEFAULT;
      musicId = music.id;
    } else {
      amount = body.plan === "yearly" ? PRICES.YEARLY_SUB : PRICES.MONTHLY_SUB;
    }

    const reference = `sl_${body.type}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soundloadedblog.ng";

    await db.transaction.create({
      data: {
        userId: user.id,
        type: body.type,
        amount,
        paystackRef: reference,
        status: "pending",
        musicId,
        metadata: { plan: body.plan },
      },
    });

    const result = await initializeTransaction({
      email: user.email,
      amount,
      reference,
      callback_url: `${appUrl}/api/payments/verify?reference=${reference}`,
      metadata: {
        userId: user.id,
        type: body.type,
        musicId,
        plan: body.plan,
      },
    });

    return NextResponse.json({
      authorization_url: result.data.authorization_url,
      reference: result.data.reference,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[POST /api/payments/initialize]", err);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
