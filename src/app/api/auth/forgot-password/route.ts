import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 422 });
    }

    const { email } = parsed.data;

    // Always return success to prevent email enumeration
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal that the user doesn't exist
      return NextResponse.json({ ok: true });
    }

    // Generate secure reset token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store the hashed token in the user record
    await db.user.update({
      where: { id: user.id },
      data: {
        // Store in socialLinks as JSON (reusing existing JSON field to avoid schema change)
        socialLinks: {
          ...(typeof user.socialLinks === "object" && user.socialLinks !== null
            ? (user.socialLinks as Record<string, string>)
            : {}),
          _resetToken: hashedToken,
          _resetExpires: expiresAt.toISOString(),
        },
      },
    });

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soundloaded.ng";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    // Send email via Resend if configured
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_your_resend_api_key") {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "noreply@soundloaded.ng",
          to: email,
          subject: "Reset your password — Soundloaded",
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <h2 style="margin: 0 0 16px;">Reset your password</h2>
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                You requested a password reset. Click the button below to set a new password.
                This link expires in 1 hour.
              </p>
              <a href="${resetUrl}" style="display: inline-block; background: #e11d48; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 24px 0;">
                Reset Password
              </a>
              <p style="color: #999; font-size: 12px; margin-top: 32px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      } catch {
        // Email sending failed but we still return success
        console.error("[forgot-password] Failed to send email");
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
