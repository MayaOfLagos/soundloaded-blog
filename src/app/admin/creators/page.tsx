import { Metadata } from "next";
import { db } from "@/lib/db";
import { CreatorsTable } from "./_components/CreatorsTable";

export const metadata: Metadata = {
  title: "Creators — Admin",
};

const PAGE_SIZE = 20;

export default async function AdminCreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const status = params.status as "PENDING" | "APPROVED" | "REJECTED" | undefined;
  const q = params.q;

  const where: Record<string, unknown> = {};

  if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    where.status = status;
  }

  if (q) {
    where.OR = [
      { displayName: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [applications, total] = await Promise.all([
    db.creatorApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, email: true, image: true, username: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    }),
    db.creatorApplication.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Get counts by status
  const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
    db.creatorApplication.count({ where: { status: "PENDING" } }),
    db.creatorApplication.count({ where: { status: "APPROVED" } }),
    db.creatorApplication.count({ where: { status: "REJECTED" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Creators</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage artist and label applications.</p>
      </div>

      <CreatorsTable
        applications={JSON.parse(JSON.stringify(applications))}
        total={total}
        page={page}
        totalPages={totalPages}
        currentStatus={status}
        currentQuery={q}
        counts={{ pending: pendingCount, approved: approvedCount, rejected: rejectedCount }}
      />
    </div>
  );
}
