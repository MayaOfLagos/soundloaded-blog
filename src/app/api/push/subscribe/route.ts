import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  try {
    const body = await req.json();
    const { endpoint, keys } = schema.parse(body);

    await db.pushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId },
      update: { p256dh: keys.p256dh, auth: keys.auth, ...(userId ? { userId } : {}) },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}
