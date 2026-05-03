export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Link2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";
import { FanlinkCard, type FanlinkCardData } from "@/components/fanlink/FanlinkCard";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My Fanlinks — Soundloaded",
};

export default async function DashboardFanlinksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const artist = await db.artist.findUnique({ where: { ownerId: userId }, select: { id: true } });
  if (!artist) redirect("/dashboard");

  const fanlinks = await db.fanlink.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      artistName: true,
      type: true,
      coverArt: true,
      status: true,
      totalClicks: true,
      uniqueVisitors: true,
      createdAt: true,
      _count: { select: { emails: true } },
    },
  });

  const serialized: FanlinkCardData[] = fanlinks.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    status: f.status as FanlinkCardData["status"],
  }));

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />

        <main className="min-w-0 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-black">My Fanlinks</h1>
              <p className="text-muted-foreground text-sm">
                {serialized.length} fanlink{serialized.length !== 1 ? "s" : ""} created
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/fanlinks/new">
                <Plus className="mr-2 h-4 w-4" />
                New Fanlink
              </Link>
            </Button>
          </div>

          {serialized.length === 0 ? (
            <div className="bg-card/50 ring-border/40 flex flex-col items-center justify-center rounded-2xl py-16 ring-1 backdrop-blur-sm">
              <Link2 className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="text-foreground text-lg font-semibold">No fanlinks yet</p>
              <p className="text-muted-foreground mt-1 mb-4 text-sm">
                Create your first smart link to share your music everywhere
              </p>
              <Button asChild>
                <Link href="/dashboard/fanlinks/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Fanlink
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {serialized.map((fanlink) => (
                <FanlinkCard key={fanlink.id} fanlink={fanlink} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
