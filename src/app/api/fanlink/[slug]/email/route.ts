import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const fanlink = await db.fanlink.findUnique({
    where: { slug },
    select: { id: true, status: true, emailCaptureEnabled: true },
  });

  if (!fanlink || fanlink.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!fanlink.emailCaptureEnabled) {
    return NextResponse.json({ error: "Email capture not enabled" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 422 });
  }

  try {
    await db.fanlinkEmail.create({
      data: { fanlinkId: fanlink.id, email: parsed.data.email },
    });
  } catch {
    // Duplicate email — silently succeed (@@unique constraint)
  }

  return NextResponse.json({ success: true });
}
