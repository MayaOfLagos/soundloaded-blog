import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { resend, FROM_EMAIL } from "@/lib/resend";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json(
      { message: "If an account exists with that email, a reset link has been sent." },
      { status: 200 }
    );

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return successResponse;
    }

    // Delete any existing tokens for this email
    await db.passwordResetToken.deleteMany({
      where: { email: user.email },
    });

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordResetToken.create({
      data: {
        email: user.email,
        token: hashedToken,
        expires,
      },
    });

    // Build reset URL
    const baseUrl =
      process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send email via Resend
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: "Reset your password – Soundloaded",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #111; margin-bottom: 8px;">Reset your password</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            Hi ${user.name ?? "there"},<br><br>
            We received a request to reset your password. Click the button below to choose a new one.
            This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #f97316; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
            Reset Password
          </a>
          <p style="color: #888; font-size: 13px; margin-top: 24px;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px;">Soundloaded · This is an automated email</p>
        </div>
      `,
    });

    return successResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    console.error("[forgot-password] Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
