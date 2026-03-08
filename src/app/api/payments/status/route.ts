import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ hasSubscription: false, expiresAt: null, plan: null });
  }

  const userId = (session.user as { id: string }).id;

  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { status: true, currentPeriodEnd: true, plan: true },
  });

  const hasSubscription =
    subscription?.status === "ACTIVE" &&
    subscription.currentPeriodEnd !== null &&
    subscription.currentPeriodEnd > new Date();

  return NextResponse.json({
    hasSubscription,
    expiresAt: subscription?.currentPeriodEnd?.toISOString() ?? null,
    plan: subscription?.plan ?? null,
  });
}
