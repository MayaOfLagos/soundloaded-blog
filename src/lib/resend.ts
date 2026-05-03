import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@soundloaded.ng";
export const NEWSLETTER_FROM = process.env.RESEND_NEWSLETTER_FROM ?? "newsletter@soundloaded.ng";

/**
 * Returns the configured from-address for transactional emails.
 * Uses admin settings emailFromName + emailFromAddress when set,
 * otherwise falls back to the env-var constant.
 */
export async function getTransactionalFrom(): Promise<string> {
  try {
    const { db } = await import("@/lib/db");
    const s = await db.siteSettings.findUnique({
      where: { id: "default" },
      select: { emailFromAddress: true, emailFromName: true },
    });
    if (s?.emailFromAddress) {
      return s.emailFromName ? `${s.emailFromName} <${s.emailFromAddress}>` : s.emailFromAddress;
    }
  } catch {
    // DB unavailable — fall back to env
  }
  return FROM_EMAIL;
}
