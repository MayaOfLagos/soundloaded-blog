export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Download } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";
import { FanlinkAnalytics } from "@/components/fanlink/FanlinkAnalytics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Fanlink Analytics — Soundloaded" };

type Props = { params: Promise<{ id: string }> };

export default async function FanlinkAnalyticsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const fanlink = await db.fanlink.findFirst({
    where: { id, createdById: userId },
    select: {
      id: true,
      slug: true,
      title: true,
      totalClicks: true,
      uniqueVisitors: true,
      status: true,
      emailCaptureEnabled: true,
      abEnabled: true,
    },
  });
  if (!fanlink) notFound();

  const [clicksByPlatform, clicksByDevice, clicksByCountry, clicksByVariant, emailCount] =
    await Promise.all([
      db.fanlinkClick.groupBy({
        by: ["platform"],
        where: { fanlinkId: id },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      db.fanlinkClick.groupBy({
        by: ["device"],
        where: { fanlinkId: id },
        _count: { id: true },
      }),
      db.fanlinkClick.groupBy({
        by: ["country"],
        where: { fanlinkId: id, country: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      db.fanlinkClick.groupBy({
        by: ["variant"],
        where: { fanlinkId: id, variant: { not: null } },
        _count: { id: true },
      }),
      db.fanlinkEmail.count({ where: { fanlinkId: id } }),
    ]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />
        <main className="min-w-0 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                <Link href="/dashboard/fanlinks">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-foreground text-2xl font-black">{fanlink.title}</h1>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-muted-foreground font-mono text-xs">/fanlink/{fanlink.slug}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {fanlink.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {fanlink.emailCaptureEnabled && emailCount > 0 && (
                <Button asChild variant="outline" size="sm">
                  <a href={`/api/fanlinks/${fanlink.id}/emails`} download>
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Export Emails ({emailCount})
                  </a>
                </Button>
              )}
              {fanlink.status === "PUBLISHED" && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/fanlink/${fanlink.slug}`} target="_blank">
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    View Live
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <FanlinkAnalytics
            fanlink={fanlink}
            clicksByPlatform={clicksByPlatform}
            clicksByDevice={clicksByDevice}
            clicksByCountry={clicksByCountry}
            clicksByVariant={clicksByVariant}
            emailCount={emailCount}
          />
        </main>
      </div>
    </div>
  );
}
