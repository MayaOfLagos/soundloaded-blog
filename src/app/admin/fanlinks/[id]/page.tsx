export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminFanlinkEditor } from "@/components/fanlink/AdminFanlinkEditor";
import { cn } from "@/lib/utils";
import type { PlatformLink } from "@/components/fanlink/FanlinkLandingPage";

export const metadata: Metadata = { title: "Edit Fanlink — Admin" };

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  PUBLISHED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  ARCHIVED: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  SUSPENDED: "bg-red-500/15 text-red-400 border-red-500/20",
};

type Props = { params: Promise<{ id: string }> };

export default async function AdminFanlinkDetailPage({ params }: Props) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  const fanlink = await db.fanlink.findUnique({
    where: { id },
    include: {
      artist: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { clicks: true, emails: true, tips: true } },
    },
  });

  if (!fanlink) notFound();

  const [clicksByPlatform, clicksByDevice, clicksByCountry, emailCount] = await Promise.all([
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
    db.fanlinkEmail.count({ where: { fanlinkId: id } }),
  ]);

  const serialized = {
    id: fanlink.id,
    slug: fanlink.slug,
    title: fanlink.title,
    artistName: fanlink.artistName,
    type: fanlink.type as "SINGLE" | "ALBUM" | "EP" | "MIXTAPE",
    releaseDate: fanlink.releaseDate ? fanlink.releaseDate.toISOString().split("T")[0] : "",
    description: fanlink.description ?? "",
    genre: fanlink.genre ?? "",
    coverArt: fanlink.coverArt ?? "",
    bgColor: fanlink.bgColor ?? "",
    accentColor: fanlink.accentColor ?? "#e11d48",
    buttonStyle: fanlink.buttonStyle as "filled" | "outline" | "pill",
    pageTheme: fanlink.pageTheme as "dark" | "light" | "auto",
    platformLinks: (fanlink.platformLinks as PlatformLink[]) ?? [],
    emailCaptureEnabled: fanlink.emailCaptureEnabled,
    emailCapturePrompt: fanlink.emailCapturePrompt,
    showSocialIcons: fanlink.showSocialIcons,
    tipEnabled: fanlink.tipEnabled,
    tipLabel: fanlink.tipLabel,
    tipAmounts: (fanlink.tipAmounts as number[]) ?? [200, 500, 1000],
    merchUrl: fanlink.merchUrl ?? "",
    merchLabel: fanlink.merchLabel ?? "",
    metaPixelId: fanlink.metaPixelId ?? "",
    gaId: fanlink.gaId ?? "",
    ogImage: fanlink.ogImage ?? "",
    preSaveEnabled: fanlink.preSaveEnabled,
    preSaveSpotifyUrl: fanlink.preSaveSpotifyUrl ?? "",
    preSaveAppleUrl: fanlink.preSaveAppleUrl ?? "",
    preSaveDeezerUrl: fanlink.preSaveDeezerUrl ?? "",
    preSaveMessage: fanlink.preSaveMessage,
    fanGateEnabled: fanlink.fanGateEnabled,
    fanGateAction: (fanlink.fanGateAction ?? "follow") as "follow" | "share" | "both",
    fanGateSpotifyUrl: fanlink.fanGateSpotifyUrl ?? "",
    fanGateTwitterText: fanlink.fanGateTwitterText ?? "",
    status: fanlink.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED",
    adminNotes: fanlink.adminNotes ?? "",
    totalClicks: fanlink.totalClicks,
    uniqueVisitors: fanlink.uniqueVisitors,
    artist: fanlink.artist,
    createdBy: fanlink.createdBy,
    counts: fanlink._count,
    createdAt: fanlink.createdAt.toISOString(),
    updatedAt: fanlink.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/admin/fanlinks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-foreground text-2xl font-black">{fanlink.title}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <p className="text-muted-foreground font-mono text-xs">/fanlink/{fanlink.slug}</p>
              <Badge
                variant="outline"
                className={cn("border text-[10px]", STATUS_STYLES[fanlink.status])}
              >
                {fanlink.status}
              </Badge>
              <span className="text-muted-foreground/50 text-xs">by {fanlink.createdBy.name}</span>
            </div>
          </div>
        </div>
        {fanlink.status === "PUBLISHED" && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/fanlink/${fanlink.slug}`} target="_blank">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              View Live
            </Link>
          </Button>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Clicks", value: fanlink.totalClicks },
          { label: "Unique Visitors", value: fanlink.uniqueVisitors },
          { label: "Emails", value: emailCount },
          { label: "Tips", value: fanlink._count.tips },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-card/60 ring-border/40 rounded-2xl p-4 ring-1 backdrop-blur-sm"
          >
            <p className="text-foreground text-2xl font-black">{value.toLocaleString()}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Editor */}
      <AdminFanlinkEditor
        fanlink={serialized}
        clicksByPlatform={clicksByPlatform}
        clicksByDevice={clicksByDevice}
        clicksByCountry={clicksByCountry}
      />
    </div>
  );
}
