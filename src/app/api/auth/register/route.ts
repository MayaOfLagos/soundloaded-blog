import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { verifyTurnstile } from "@/lib/turnstile";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { UserRole } from "@prisma/client";

async function sendWelcomeEmail(name: string, email: string) {
  const { resend, getTransactionalFrom } = await import("@/lib/resend");
  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { siteName: true, siteUrl: true },
  });
  const siteName = settings?.siteName ?? "Soundloaded Blog";
  const siteUrl = settings?.siteUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const from = await getTransactionalFrom();

  await resend.emails.send({
    from,
    to: email,
    subject: `Welcome to ${siteName}! 🎵`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; color: #f1f5f9; border-radius: 12px; overflow: hidden;">
        <div style="background: #e11d48; padding: 32px 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #fff; letter-spacing: -0.5px;">${siteName}</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #f1f5f9;">Hey ${name}, welcome aboard! 🙌</h2>
          <p style="margin: 0 0 20px; color: #94a3b8; line-height: 1.6;">
            Your account is all set. Explore the latest music, news, and entertainment on ${siteName}.
          </p>
          <a href="${siteUrl}"
             style="display: inline-block; background: #e11d48; color: #fff; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px;">
            Explore Now
          </a>
          <hr style="border: none; border-top: 1px solid #1e293b; margin: 28px 0;" />
          <p style="margin: 0; color: #475569; font-size: 12px;">
            You're receiving this because you just created an account at ${siteName}.
          </p>
        </div>
      </div>
    `,
  });
}

const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        prefix: "ratelimit:register",
      })
    : null;

const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export async function POST(req: NextRequest) {
  // Rate limit by IP — fail-closed if Upstash is not configured in production
  if (ratelimit) {
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[register] Rate limiter unavailable in production — blocking request");
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();

    // Verify Cloudflare Turnstile
    const turnstileValid = await verifyTurnstile(body.turnstileToken);
    if (!turnstileValid) {
      return NextResponse.json(
        { error: "Security check failed. Please try again." },
        { status: 403 }
      );
    }

    const parsed = baseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
    }

    const { name, email, password } = parsed.data;

    // Fetch settings for registration rules
    const settings = await db.siteSettings.findUnique({
      where: { id: "default" },
      select: {
        allowRegistration: true,
        defaultUserRole: true,
        requireStrongPasswords: true,
        emailWelcomeEnabled: true,
        siteName: true,
      },
    });

    const allowRegistration = settings?.allowRegistration ?? true;
    const defaultUserRole = (settings?.defaultUserRole ?? "READER") as UserRole;
    const requireStrongPasswords = settings?.requireStrongPasswords ?? false;

    if (!allowRegistration) {
      return NextResponse.json({ error: "Registration is currently disabled." }, { status: 403 });
    }

    if (requireStrongPasswords && !strongPasswordRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
        },
        { status: 422 }
      );
    }

    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      // Return generic success to prevent email enumeration
      return NextResponse.json({ message: "Check your email to continue." });
    }

    const hashed = await bcrypt.hash(password, 12);

    // Generate a default username from the name (slug-ified + random suffix)
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 20);
    const suffix = crypto.randomUUID().slice(0, 6);
    const username = `${baseSlug}-${suffix}`;

    await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: defaultUserRole,
        username,
      },
    });

    // Fire-and-forget welcome email — never block registration on email failure
    if (settings?.emailWelcomeEnabled !== false) {
      sendWelcomeEmail(name, email.toLowerCase()).catch(() => {});
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
