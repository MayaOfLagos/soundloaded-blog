import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const schema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Must include uppercase, lowercase, and a number"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
    }

    const { token, email, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    // Extract reset token from socialLinks JSON field
    const links =
      typeof user.socialLinks === "object" && user.socialLinks !== null
        ? (user.socialLinks as Record<string, unknown>)
        : {};

    const storedHash = links._resetToken as string | undefined;
    const expiresStr = links._resetExpires as string | undefined;

    if (!storedHash || !expiresStr) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    // Helper to strip reset fields from socialLinks
    function stripResetFields(obj: Record<string, unknown>) {
      const { _resetToken: _t, _resetExpires: _e, ...rest } = obj;
      return rest as Record<string, string>;
    }

    // Check expiration
    const expiresAt = new Date(expiresStr);
    if (Date.now() > expiresAt.getTime()) {
      await db.user.update({
        where: { id: user.id },
        data: { socialLinks: stripResetFields(links) },
      });
      return NextResponse.json(
        { error: "Reset link has expired. Request a new one." },
        { status: 400 }
      );
    }

    // Verify token
    const valid = await bcrypt.compare(token, storedHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    // Hash new password and update, remove reset token
    const hashedPassword = await bcrypt.hash(password, 12);
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        socialLinks: stripResetFields(links),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
