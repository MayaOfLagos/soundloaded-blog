import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    // Upsert subscriber
    const subscriber = await db.subscriber.upsert({
      where: { email },
      update: {},
      create: { email, status: "PENDING" },
    });

    // TODO: send confirmation email via Resend when credentials are set
    // await sendConfirmationEmail(email);

    return NextResponse.json({ success: true, id: subscriber.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    console.error("[POST /api/newsletter]", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
