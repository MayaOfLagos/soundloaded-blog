import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = baseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
    }

    const { name, email, password } = parsed.data;

    // Fetch settings for registration rules
    const settings = await db.siteSettings.findUnique({
      where: { id: "default" },
      select: {
        allowRegistration: true,
        defaultUserRole: true,
        requireStrongPasswords: true,
      },
    });

    const allowRegistration = settings?.allowRegistration ?? true;
    const defaultUserRole = (settings?.defaultUserRole ?? "READER") as UserRole;
    const requireStrongPasswords = settings?.requireStrongPasswords ?? false;

    if (!allowRegistration) {
      return NextResponse.json({ error: "Registration is currently disabled." }, { status: 403 });
    }

    if (requireStrongPasswords && !strongPasswordRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
        },
        { status: 422 }
      );
    }

    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: defaultUserRole,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
