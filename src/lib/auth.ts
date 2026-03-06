import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "./db";

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
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsed.success) return null;
        const { email, password } = parsed.data;

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

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
