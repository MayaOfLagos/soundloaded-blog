import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { UserRole } from "@prisma/client";

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
  // Rate limit by IP
  if (ratelimit) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }
  }

  try {
    const body = await req.json();
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
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
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

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
