import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  requireAdmin,
  isSuperAdmin,
  forbiddenResponse,
  unauthorizedResponse,
} from "@/lib/admin-auth";
import { resend, FROM_EMAIL } from "@/lib/resend";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["READER", "CONTRIBUTOR", "EDITOR", "ADMIN"]).default("CONTRIBUTOR"),
});

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { email, role } = inviteSchema.parse(body);

    // Only SUPER_ADMIN can invite as ADMIN
    const currentUserRole = (session.user as { role?: string }).role ?? "";
    if (role === "ADMIN" && !isSuperAdmin(currentUserRole)) {
      return forbiddenResponse("Only SUPER_ADMIN can invite users with ADMIN role");
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Create user with a temporary password — they should reset via forgot password
    const tempPassword = Math.random().toString(36).slice(-12);
    const hashed = await bcrypt.hash(tempPassword, 12);

    // Generate a default username from the email prefix
    const emailPrefix = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 20);
    const suffix = crypto.randomUUID().slice(0, 6);
    const username = `${emailPrefix}-${suffix}`;

    const user = await db.user.create({
      data: { email, role, password: hashed, username },
      select: { id: true, email: true, role: true },
    });

    // Generate a password reset token so the invited user can set their own password
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days for invites

    await db.passwordResetToken.create({
      data: { email, token, expires },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";
    const setupUrl = `${baseUrl}/reset-password?token=${token}`;
    const inviterName = (session.user as { name?: string }).name ?? "An admin";

    // Send invite email via Resend
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "You're invited to Soundloaded",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #111; margin-bottom: 8px;">Welcome to Soundloaded!</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              ${inviterName} has invited you as a <strong>${role}</strong> on Soundloaded.
              Click below to set your password and get started.
            </p>
            <a href="${setupUrl}" style="display: inline-block; background: #f97316; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
              Set Up Your Account
            </a>
            <p style="color: #888; font-size: 13px; margin-top: 24px;">
              This link expires in 7 days. If you didn't expect this invitation, you can ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #aaa; font-size: 12px;">Soundloaded · This is an automated email</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("[invite] Failed to send invite email:", emailError);
      // User was created — don't fail the whole request
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 });
  }
}
