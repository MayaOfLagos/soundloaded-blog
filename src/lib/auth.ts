import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { verifyTurnstile } from "./turnstile";

const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

// Login attempt tracking via Upstash Redis (if available)
let redis: {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex: number }) => Promise<unknown>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
} | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  import("@upstash/redis").then(({ Redis }) => {
    redis = Redis.fromEnv() as typeof redis;
  });
}

async function checkLoginLockout(email: string): Promise<{ locked: boolean; remaining?: number }> {
  if (!redis) return { locked: false };

  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "default" },
      select: { maxLoginAttempts: true, loginLockoutDuration: true },
    });

    const maxAttempts = settings?.maxLoginAttempts ?? 0;
    if (maxAttempts <= 0) return { locked: false };

    const lockoutMinutes = settings?.loginLockoutDuration ?? 15;
    const lockKey = `sl_login_lock:${email}`;
    const attemptsKey = `sl_login_attempts:${email}`;

    const lockVal = await redis.get(lockKey);
    if (lockVal) {
      return { locked: true, remaining: lockoutMinutes };
    }

    const attempts = parseInt((await redis.get(attemptsKey)) ?? "0", 10);
    if (attempts >= maxAttempts) {
      await redis.set(lockKey, "1", { ex: lockoutMinutes * 60 });
      return { locked: true, remaining: lockoutMinutes };
    }

    return { locked: false };
  } catch {
    return { locked: false };
  }
}

async function recordFailedLogin(email: string): Promise<void> {
  if (!redis) return;

  try {
    const attemptsKey = `sl_login_attempts:${email}`;
    await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, 3600); // Reset attempts after 1 hour
  } catch {
    // Silently fail
  }
}

async function clearLoginAttempts(email: string): Promise<void> {
  if (!redis) return;

  try {
    const attemptsKey = `sl_login_attempts:${email}`;
    const lockKey = `sl_login_lock:${email}`;
    await redis.set(attemptsKey, "0", { ex: 1 });
    await redis.set(lockKey, "0", { ex: 1 });
  } catch {
    // Silently fail
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Turnstile", type: "text" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(8),
            turnstileToken: z.string().optional(),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;
        const { email, password, turnstileToken } = parsed.data;

        // Verify Cloudflare Turnstile
        const turnstileValid = await verifyTurnstile(turnstileToken);
        if (!turnstileValid) return null;

        // Check lockout
        const { locked } = await checkLoginLockout(email);
        if (locked) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.password) {
          await recordFailedLogin(email);
          return null;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          await recordFailedLogin(email);
          return null;
        }

        // Clear failed attempts on successful login
        await clearLoginAttempts(email);

        // Check for linked creator profiles
        const [artistProfile, labelProfile] = await Promise.all([
          db.artist.findUnique({ where: { ownerId: user.id }, select: { id: true } }),
          db.label.findUnique({ where: { ownerId: user.id }, select: { id: true } }),
        ]);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
          artistProfileId: artistProfile?.id ?? null,
          labelProfileId: labelProfile?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, account }) {
      if (user) {
        token.id = user.id;

        if (account?.provider === "google") {
          // OAuth sign-in: fetch role and creator profiles from DB
          const [dbUser, artistProfile, labelProfile] = await Promise.all([
            db.user.findUnique({ where: { id: user.id as string }, select: { role: true } }),
            db.artist.findUnique({ where: { ownerId: user.id as string }, select: { id: true } }),
            db.label.findUnique({ where: { ownerId: user.id as string }, select: { id: true } }),
          ]);
          token.role = dbUser?.role ?? "USER";
          token.artistProfileId = artistProfile?.id ?? null;
          token.labelProfileId = labelProfile?.id ?? null;
        } else {
          token.role = (user as { role?: string }).role;
          token.artistProfileId =
            (user as { artistProfileId?: string | null }).artistProfileId ?? null;
          token.labelProfileId =
            (user as { labelProfileId?: string | null }).labelProfileId ?? null;
        }
      }
      // Re-fetch profiles on session update (e.g. after application approval)
      if (trigger === "update" && token.id) {
        const [artistProfile, labelProfile] = await Promise.all([
          db.artist.findUnique({ where: { ownerId: token.id as string }, select: { id: true } }),
          db.label.findUnique({ where: { ownerId: token.id as string }, select: { id: true } }),
        ]);
        token.artistProfileId = artistProfile?.id ?? null;
        token.labelProfileId = labelProfile?.id ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { artistProfileId?: string | null }).artistProfileId =
          token.artistProfileId as string | null;
        (session.user as { labelProfileId?: string | null }).labelProfileId =
          token.labelProfileId as string | null;
      }
      return session;
    },
  },
});
