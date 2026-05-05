export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";
import { FanlinkForm } from "@/components/fanlink/FanlinkForm";
import type { PlatformLink } from "@/components/fanlink/FanlinkLandingPage";

export const metadata: Metadata = {
  title: "Edit Fanlink — Soundloaded",
};

type Props = { params: Promise<{ id: string }> };

export default async function EditFanlinkPage({ params }: Props) {
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
      artistName: true,
      type: true,
      releaseDate: true,
      description: true,
      genre: true,
      coverArt: true,
      accentColor: true,
      pageTheme: true,
      buttonStyle: true,
      platformLinks: true,
      emailCaptureEnabled: true,
      emailCapturePrompt: true,
      showSocialIcons: true,
      tipEnabled: true,
      tipLabel: true,
      preSaveEnabled: true,
      preSaveSpotifyUrl: true,
      preSaveAppleUrl: true,
      preSaveDeezerUrl: true,
      preSaveMessage: true,
      fanGateEnabled: true,
      fanGateAction: true,
      fanGateSpotifyUrl: true,
      fanGateTwitterText: true,
      status: true,
      artist: { select: { name: true } },
    },
  });

  if (!fanlink) notFound();
  if (fanlink.status === "SUSPENDED") redirect("/dashboard/fanlinks");

  const initialData = {
    id: fanlink.id,
    slug: fanlink.slug,
    title: fanlink.title,
    artistName: fanlink.artistName,
    type: fanlink.type as "SINGLE" | "ALBUM" | "EP" | "MIXTAPE",
    releaseDate: fanlink.releaseDate ? fanlink.releaseDate.toISOString().split("T")[0] : "",
    description: fanlink.description ?? "",
    genre: fanlink.genre ?? "",
    coverArt: fanlink.coverArt ?? "",
    accentColor: fanlink.accentColor ?? "#e11d48",
    pageTheme: fanlink.pageTheme as "dark" | "light" | "auto",
    buttonStyle: fanlink.buttonStyle as "filled" | "outline" | "pill",
    platformLinks: (fanlink.platformLinks as PlatformLink[]) ?? [],
    emailCaptureEnabled: fanlink.emailCaptureEnabled,
    emailCapturePrompt: fanlink.emailCapturePrompt,
    showSocialIcons: fanlink.showSocialIcons,
    tipEnabled: fanlink.tipEnabled,
    tipLabel: fanlink.tipLabel,
    preSaveEnabled: fanlink.preSaveEnabled,
    preSaveSpotifyUrl: fanlink.preSaveSpotifyUrl ?? "",
    preSaveAppleUrl: fanlink.preSaveAppleUrl ?? "",
    preSaveDeezerUrl: fanlink.preSaveDeezerUrl ?? "",
    preSaveMessage: fanlink.preSaveMessage,
    fanGateEnabled: fanlink.fanGateEnabled,
    fanGateAction: (fanlink.fanGateAction ?? "follow") as "follow" | "share" | "both",
    fanGateSpotifyUrl: fanlink.fanGateSpotifyUrl ?? "",
    fanGateTwitterText: fanlink.fanGateTwitterText ?? "",
    status: fanlink.status as "DRAFT" | "PUBLISHED",
  };

  const variant = await db.fanlinkVariant.findFirst({
    where: { fanlinkId: id },
    orderBy: { createdAt: "asc" },
  });

  const variantData = variant
    ? {
        id: variant.id,
        label: variant.label,
        title: variant.title ?? "",
        description: variant.description ?? "",
        coverArt: variant.coverArt ?? "",
        accentColor: variant.accentColor ?? "#e11d48",
        platformLinks: (variant.platformLinks as PlatformLink[]) ?? [],
      }
    : null;

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />
        <main className="min-w-0 space-y-6">
          <div>
            <h1 className="text-foreground text-2xl font-black">Edit Fanlink</h1>
            <p className="text-muted-foreground font-mono text-sm text-xs">
              /fanlink/{fanlink.slug}
            </p>
          </div>
          <FanlinkForm
            initialData={initialData}
            initialVariant={variantData}
            artistName={fanlink.artist?.name ?? fanlink.artistName}
            mode="edit"
          />
        </main>
      </div>
    </div>
  );
}
