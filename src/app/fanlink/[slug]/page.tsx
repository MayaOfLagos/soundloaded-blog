import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { FanlinkLandingPage, type PlatformLink } from "@/components/fanlink/FanlinkLandingPage";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const fanlink = await db.fanlink.findUnique({
    where: { slug },
    select: { title: true, artistName: true, description: true, coverArt: true, ogImage: true },
  });

  if (!fanlink) return {};

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://soundloaded.ng";
  const title = `${fanlink.title} — ${fanlink.artistName}`;
  const description =
    fanlink.description ?? `Stream ${fanlink.title} by ${fanlink.artistName} on all platforms`;
  const image = fanlink.ogImage ?? fanlink.coverArt ?? `${appUrl}/api/fanlink/${slug}/og`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "music.song",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function FanlinkPage({ params }: Props) {
  const { slug } = await params;

  const fanlink = await db.fanlink.findUnique({
    where: { slug },
    include: {
      artist: {
        select: {
          instagram: true,
          twitter: true,
          facebook: true,
          spotify: true,
          youtube: true,
          tiktok: true,
          soundcloud: true,
          boomplay: true,
          website: true,
        },
      },
      variants: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!fanlink || fanlink.status !== "PUBLISHED") notFound();

  const data = {
    id: fanlink.id,
    slug: fanlink.slug,
    title: fanlink.title,
    artistName: fanlink.artistName,
    type: fanlink.type,
    releaseDate: fanlink.releaseDate?.toISOString() ?? null,
    description: fanlink.description,
    coverArt: fanlink.coverArt,
    bgColor: fanlink.bgColor,
    accentColor: fanlink.accentColor,
    buttonStyle: fanlink.buttonStyle,
    pageTheme: fanlink.pageTheme,
    platformLinks: (fanlink.platformLinks as PlatformLink[]) ?? [],
    emailCaptureEnabled: fanlink.emailCaptureEnabled,
    emailCapturePrompt: fanlink.emailCapturePrompt,
    showSocialIcons: fanlink.showSocialIcons,
    tipEnabled: fanlink.tipEnabled,
    tipLabel: fanlink.tipLabel,
    tipAmounts: (fanlink.tipAmounts as number[]) ?? [200, 500, 1000],
    merchUrl: fanlink.merchUrl,
    merchLabel: fanlink.merchLabel,
    preSaveEnabled: fanlink.preSaveEnabled,
    preSaveSpotifyUrl: fanlink.preSaveSpotifyUrl,
    preSaveAppleUrl: fanlink.preSaveAppleUrl,
    preSaveDeezerUrl: fanlink.preSaveDeezerUrl,
    preSaveMessage: fanlink.preSaveMessage,
    fanGateEnabled: fanlink.fanGateEnabled,
    fanGateAction: fanlink.fanGateAction as "follow" | "share" | "both",
    fanGateSpotifyUrl: fanlink.fanGateSpotifyUrl,
    fanGateTwitterText: fanlink.fanGateTwitterText,
    abEnabled: fanlink.abEnabled,
    abSplit: fanlink.abSplit,
    variants: fanlink.variants.map((v) => ({
      id: v.id,
      label: v.label,
      title: v.title,
      description: v.description,
      coverArt: v.coverArt,
      accentColor: v.accentColor,
      platformLinks: (v.platformLinks as PlatformLink[]) ?? [],
    })),
    artist: fanlink.artist ?? undefined,
  };

  return <FanlinkLandingPage fanlink={data} />;
}
