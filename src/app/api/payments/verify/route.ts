import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyTransaction } from "@/lib/paystack";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soundloaded.ng";

  if (!reference) {
    return NextResponse.redirect(new URL("/?payment=invalid", appUrl));
  }

  try {
    const transaction = await db.transaction.findUnique({
      where: { paystackRef: reference },
    });

    if (!transaction) {
      return NextResponse.redirect(new URL("/?payment=not-found", appUrl));
    }

    if (transaction.status === "success") {
      return NextResponse.redirect(new URL("/?payment=success", appUrl));
    }

    const result = await verifyTransaction(reference);

    if (result.data.status === "success") {
      // Use updateMany with status filter to prevent race conditions (double processing)
      const updated = await db.transaction.updateMany({
        where: { paystackRef: reference, status: { not: "success" } },
        data: { status: "success" },
      });

      // Only process subscription if we actually changed the status
      if (updated.count > 0 && transaction.type === "subscription") {
        const plan =
          ((transaction.metadata as Record<string, unknown>)?.plan as string) || "monthly";
        const daysToAdd = plan === "yearly" ? 365 : 30;
        const currentPeriodEnd = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

        await db.subscription.upsert({
          where: { userId: transaction.userId },
          update: {
            status: "ACTIVE",
            plan,
            currentPeriodEnd,
            paystackCustCode: result.data.customer?.customer_code ?? null,
          },
          create: {
            userId: transaction.userId,
            status: "ACTIVE",
            plan,
            currentPeriodEnd,
            paystackCustCode: result.data.customer?.customer_code ?? null,
          },
        });
      }

      return NextResponse.redirect(new URL("/?payment=success", appUrl));
    }

    await db.transaction.update({
      where: { paystackRef: reference },
      data: { status: "failed" },
    });

    return NextResponse.redirect(new URL("/?payment=failed", appUrl));
  } catch (err) {
    console.error("[GET /api/payments/verify]", err);
    return NextResponse.redirect(new URL("/?payment=error", appUrl));
  }
}
