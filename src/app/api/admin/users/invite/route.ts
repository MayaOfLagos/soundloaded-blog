import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !ADMIN_ROLES.includes(role)) return null;
  return session;
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["READER", "CONTRIBUTOR", "EDITOR", "ADMIN"]).default("CONTRIBUTOR"),
});

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { email, role } = inviteSchema.parse(body);

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

    // TODO: Send invite email via Resend
    // await resend.emails.send({ to: email, subject: "You're invited", ... });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 });
  }
}
