import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const rawBody = await req.text();

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody) as {
      event: string;
      data: {
        reference?: string;
        status?: string;
        amount?: number;
        customer?: { email: string; customer_code: string };
        subscription_code?: string;
        metadata?: Record<string, unknown>;
      };
    };

    switch (event.event) {
      case "charge.success": {
        const ref = event.data.reference;
        if (!ref) break;

        const transaction = await db.transaction.findUnique({
          where: { paystackRef: ref },
        });

        if (!transaction || transaction.status === "success") break;

        await db.transaction.update({
          where: { paystackRef: ref },
          data: { status: "success" },
        });

        if (transaction.type === "subscription") {
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
              paystackSubCode: event.data.subscription_code ?? undefined,
              paystackCustCode: event.data.customer?.customer_code ?? undefined,
            },
            create: {
              userId: transaction.userId,
              status: "ACTIVE",
              plan,
              currentPeriodEnd,
              paystackSubCode: event.data.subscription_code ?? null,
              paystackCustCode: event.data.customer?.customer_code ?? null,
            },
          });
        }
        break;
      }

      case "subscription.create": {
        const custCode = event.data.customer?.customer_code;
        const subCode = event.data.subscription_code;
        if (!custCode || !subCode) break;

        const sub = await db.subscription.findFirst({
          where: { paystackCustCode: custCode },
        });
        if (sub) {
          await db.subscription.update({
            where: { id: sub.id },
            data: { paystackSubCode: subCode, status: "ACTIVE" },
          });
        }
        break;
      }

      case "subscription.not_renew":
      case "subscription.disable": {
        const subCode = event.data.subscription_code;
        if (!subCode) break;

        await db.subscription.updateMany({
          where: { paystackSubCode: subCode },
          data: { status: event.event === "subscription.disable" ? "CANCELLED" : "EXPIRED" },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[POST /api/payments/webhook]", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
