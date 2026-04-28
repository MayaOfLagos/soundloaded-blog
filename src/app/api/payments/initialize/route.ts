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
  /** Legacy: "monthly" | "yearly" — used when planId is not provided */
  plan: z.enum(["monthly", "yearly"]).optional().default("monthly"),
  /** New: DB Plan id — takes precedence over legacy plan field */
  planId: z.string().optional(),
  /** Billing interval for planId-based subscriptions */
  interval: z.enum(["monthly", "yearly"]).optional().default("monthly"),
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
    let resolvedPlanId: string | null = null;
    let paystackPlanCode: string | null = null;

    if (body.type === "download") {
      if (!body.musicId) {
        return NextResponse.json({ error: "musicId required for download" }, { status: 400 });
      }
      const music = await db.music.findUnique({
        where: { id: body.musicId },
        select: { id: true, price: true, creatorPrice: true, isExclusive: true, accessModel: true },
      });
      if (!music) {
        return NextResponse.json({ error: "Track not found" }, { status: 404 });
      }
      if (music.accessModel === "free") {
        return NextResponse.json({ error: "Track is free — no payment required" }, { status: 400 });
      }
      // Creator price takes priority, then track price, then global default
      amount = music.creatorPrice ?? music.price ?? PRICES.DOWNLOAD_DEFAULT;
      musicId = music.id;
    } else {
      // ── Subscription: resolve Plan from DB ──────────────────────────
      if (body.planId) {
        const dbPlan = await db.plan.findUnique({ where: { id: body.planId } });
        if (!dbPlan || !dbPlan.isActive) {
          return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }
        if (dbPlan.priceMonthly === 0 && dbPlan.priceYearly === 0) {
          return NextResponse.json({ error: "Free plan requires no payment" }, { status: 400 });
        }
        resolvedPlanId = dbPlan.id;
        if (body.interval === "yearly") {
          amount = dbPlan.priceYearly;
          paystackPlanCode = dbPlan.paystackPlanCodeYearly;
        } else {
          amount = dbPlan.priceMonthly;
          paystackPlanCode = dbPlan.paystackPlanCodeMonthly;
        }
      } else {
        // Legacy fallback
        amount = body.plan === "yearly" ? PRICES.YEARLY_SUB : PRICES.MONTHLY_SUB;
      }
    }

    const reference = `sl_${body.type}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soundloaded.ng";

    await db.transaction.create({
      data: {
        userId: user.id,
        type: body.type,
        amount,
        paystackRef: reference,
        status: "pending",
        musicId,
        metadata: {
          plan: body.plan,
          planId: resolvedPlanId,
          interval: body.interval,
          paystackPlanCode,
        },
      },
    });

    const txParams: Parameters<typeof initializeTransaction>[0] = {
      email: user.email,
      amount,
      reference,
      callback_url: `${appUrl}/api/payments/verify?reference=${reference}`,
      metadata: {
        userId: user.id,
        type: body.type,
        musicId,
        plan: body.plan,
        planId: resolvedPlanId,
        interval: body.interval,
      },
    };

    // If Paystack plan code is available, set it to enable auto-renewal
    if (paystackPlanCode) {
      (txParams as Record<string, unknown>).plan = paystackPlanCode;
    }

    const result = await initializeTransaction(txParams);

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
