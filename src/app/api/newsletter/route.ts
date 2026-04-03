import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { resend, NEWSLETTER_FROM } from "@/lib/resend";

const schema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = schema.parse(body);

    const existing = await db.subscriber.findUnique({ where: { email } });
    if (existing?.status === "CONFIRMED") {
      return NextResponse.json({ success: true, message: "Already subscribed" });
    }

    const token = randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.subscriber.upsert({
      where: { email },
      update: { confirmationToken: token, tokenExpiresAt, name: name || undefined },
      create: {
        email,
        name: name || null,
        status: "PENDING",
        confirmationToken: token,
        tokenExpiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soundloaded.ng";
    const confirmUrl = `${appUrl}/api/newsletter/confirm?token=${token}`;

    await resend.emails.send({
      from: NEWSLETTER_FROM,
      to: email,
      subject: "Confirm your Soundloaded subscription",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
          <h2 style="color: #e11d48; margin: 0 0 16px;">Soundloaded</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">
            Hey${name ? ` ${name}` : ""}! Thanks for subscribing.
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">
            Click the button below to confirm your subscription and start receiving the latest music drops, news, and gist.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${confirmUrl}" style="display: inline-block; background: #e11d48; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Confirm Subscription
            </a>
          </div>
          <p style="color: #999; font-size: 13px; line-height: 1.5;">
            This link expires in 24 hours. If you didn't subscribe, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Confirmation email sent" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    console.error("[POST /api/newsletter]", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
