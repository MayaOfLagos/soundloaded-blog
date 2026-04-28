import { db } from "@/lib/db";

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Returns true if Turnstile is enabled in both env vars and DB settings.
 * Defaults to true if DB is unreachable (fail-safe).
 */
export async function isTurnstileEnabled(): Promise<boolean> {
  if (!TURNSTILE_SECRET || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return false;
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "default" },
      select: { enableTurnstile: true },
    });
    return settings?.enableTurnstile ?? true;
  } catch {
    return true; // fail-safe: keep enabled if DB is down
  }
}

/**
 * Verify a Cloudflare Turnstile token server-side.
 * Returns true if verification passes, if Turnstile is not configured, or if disabled in settings.
 */
export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  // Skip if env keys are missing
  if (!TURNSTILE_SECRET) return true;

  // Skip if disabled in DB settings
  const enabled = await isTurnstileEnabled();
  if (!enabled) return true;

  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET,
        response: token,
      }),
    });

    const data: TurnstileVerifyResponse = await res.json();
    return data.success;
  } catch {
    // If verification service is down, fail open (allow login)
    return true;
  }
}
