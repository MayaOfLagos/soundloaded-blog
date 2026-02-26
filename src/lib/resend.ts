import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@soundloadedblog.ng";
export const NEWSLETTER_FROM =
  process.env.RESEND_NEWSLETTER_FROM ?? "newsletter@soundloadedblog.ng";
