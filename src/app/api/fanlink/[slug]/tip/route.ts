import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { initializeTransaction } from "@/lib/paystack";

const schema = z.object({
  amount: z.number().int().positive(),
  email: z.string().email(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const fanlink = await db.fanlink.findUnique({
    where: { slug },
    select: {
      id: true,
      status: true,
      tipEnabled: true,
      tipAmounts: true,
      title: true,
      artistName: true,
    },
  });

  if (!fanlink || fanlink.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!fanlink.tipEnabled) {
    return NextResponse.json({ error: "Tips not enabled" }, { status: 400 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { amount, email } = body.data;
  const allowedAmounts = (fanlink.tipAmounts as number[]) ?? [];
  if (allowedAmounts.length > 0 && !allowedAmounts.includes(amount)) {
    return NextResponse.json({ error: "Invalid tip amount" }, { status: 400 });
  }

  const reference = `sl_tip_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://soundloaded.ng";

  await db.fanlinkTip.create({
    data: {
      fanlinkId: fanlink.id,
      amount,
      txRef: reference,
      status: "pending",
      payerEmail: email,
    },
  });

  const result = await initializeTransaction({
    email,
    amount,
    reference,
    callback_url: `${appUrl}/fanlink/${slug}?tip=success`,
    metadata: {
      type: "fanlink_tip",
      fanlinkId: fanlink.id,
      fanlinkTitle: fanlink.title,
      artistName: fanlink.artistName,
    },
  });

  return NextResponse.json({ authorization_url: result.data.authorization_url });
}
