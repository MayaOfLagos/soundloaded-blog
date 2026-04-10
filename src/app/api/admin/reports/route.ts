import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

// ── GET — List reports (paginated, filterable by status) ──
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const where = status && status !== "ALL" ? { status: status as never } : {};

  const [reports, total] = await Promise.all([
    db.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            author: { select: { id: true, name: true } },
          },
        },
      },
    }),
    db.report.count({ where }),
  ]);

  return NextResponse.json({
    reports,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "REVIEWED", "DISMISSED", "ACTION_TAKEN"]),
  adminNote: z.string().max(1000).optional(),
});

// ── PATCH — Update report status + send notification to reporter ──
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const adminId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const { id, status, adminNote } = patchSchema.parse(body);

    const report = await db.report.update({
      where: { id },
      data: {
        status,
        adminNote,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      include: {
        post: { select: { title: true } },
      },
    });

    // Notify the reporter that their report was reviewed
    if (status !== "PENDING") {
      const statusLabel =
        status === "ACTION_TAKEN"
          ? "action was taken"
          : status === "REVIEWED"
            ? "has been reviewed"
            : "was reviewed and dismissed";

      await db.notification.create({
        data: {
          userId: report.userId,
          type: "REPORT_UPDATE",
          title: "We reviewed your report",
          body: `Your report on "${report.post.title}" ${statusLabel}. Thank you for helping keep the community safe.`,
          link: "/notifications",
          metadata: { reportId: id, status },
        },
      });
    }

    return NextResponse.json(report);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[PATCH /api/admin/reports]", err);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
