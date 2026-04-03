import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soundloaded.ng";

  if (!token) {
    return NextResponse.redirect(new URL("/?newsletter=invalid", baseUrl));
  }

  try {
    const subscriber = await db.subscriber.findUnique({
      where: { confirmationToken: token },
    });

    if (!subscriber) {
      return NextResponse.redirect(new URL("/?newsletter=invalid", baseUrl));
    }

    if (subscriber.status === "CONFIRMED") {
      return NextResponse.redirect(new URL("/?newsletter=already-confirmed", baseUrl));
    }

    if (subscriber.tokenExpiresAt && subscriber.tokenExpiresAt < new Date()) {
      return NextResponse.redirect(new URL("/?newsletter=expired", baseUrl));
    }

    await db.subscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        confirmationToken: null,
        tokenExpiresAt: null,
      },
    });

    return NextResponse.redirect(new URL("/?newsletter=confirmed", baseUrl));
  } catch (err) {
    console.error("[GET /api/newsletter/confirm]", err);
    return NextResponse.redirect(new URL("/?newsletter=error", baseUrl));
  }
}
