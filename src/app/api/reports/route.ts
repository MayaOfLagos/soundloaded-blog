import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const reportSchema = z.object({
  postId: z.string().min(1),
  reason: z.enum(["spam", "harassment", "misinformation", "hate_speech", "violence", "other"]),
  details: z.string().max(1000).optional(),
});

// ── POST — File a report ──
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const { postId, reason, details } = reportSchema.parse(body);

    // Check if user already reported this post
    const existing = await db.report.findFirst({
      where: { userId, postId, status: "PENDING" },
    });

    if (existing) {
      return NextResponse.json({ error: "You have already reported this post" }, { status: 409 });
    }

    const report = await db.report.create({
      data: { userId, postId, reason, details },
    });

    // Notify admins about the new report
    const admins = await db.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { title: true, slug: true },
    });

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "REPORT_FILED" as const,
          title: "New report filed",
          body: `A user reported "${post?.title ?? "a post"}" for ${reason.replace(/_/g, " ")}`,
          link: "/admin/reports",
          metadata: { reportId: report.id, postId, reason },
        })),
      });
    }

    return NextResponse.json({ report: { id: report.id } }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[POST /api/reports]", err);
    return NextResponse.json({ error: "Failed to file report" }, { status: 500 });
  }
}
