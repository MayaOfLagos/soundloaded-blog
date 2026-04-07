const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Verify a Cloudflare Turnstile token server-side.
 * Returns true if verification passes or if Turnstile is not configured.
 */
export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  // Skip if Turnstile is not configured
  if (!TURNSTILE_SECRET) return true;
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
    // Change to `return false` for strict mode
    return true;
  }
}
