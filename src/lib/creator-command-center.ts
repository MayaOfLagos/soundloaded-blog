import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const TRACK_SELECT = {
  id: true,
  title: true,
  slug: true,
  coverArt: true,
  downloadCount: true,
  streamCount: true,
  processingStatus: true,
  accessModel: true,
  streamAccess: true,
  creatorPrice: true,
  price: true,
  createdAt: true,
  artist: { select: { name: true, slug: true } },
  post: { select: { slug: true, status: true, views: true } },
} satisfies Prisma.MusicSelect;

const RECENT_ARTIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  bio: true,
  photo: true,
  genre: true,
  createdAt: true,
  _count: { select: { music: true, artistFollows: true } },
} satisfies Prisma.ArtistSelect;

export type CreatorCommandTrack = Prisma.MusicGetPayload<{ select: typeof TRACK_SELECT }>;
export type CreatorRosterArtist = Prisma.ArtistGetPayload<{ select: typeof RECENT_ARTIST_SELECT }>;

type PresenceValue = string | null | undefined | boolean | number;

export type ChecklistItem = {
  key: string;
  label: string;
  complete: boolean;
  href?: string;
};

export type ActionItem = {
  key: string;
  label: string;
  description: string;
  href: string;
  value?: string;
  tone: "danger" | "warning" | "info" | "success";
};

export type CreatorStat = {
  key: string;
  label: string;
  value: number;
  helper: string;
};

type ArtistProfileInput = {
  id: string;
  bio: string | null;
  photo: string | null;
  coverImage?: string | null;
  country?: string | null;
  genre?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  facebook?: string | null;
  spotify?: string | null;
  appleMusic?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  soundcloud?: string | null;
  boomplay?: string | null;
  website?: string | null;
  verified: boolean;
  _count: { music: number; albums: number; artistFollows: number };
};

type LabelProfileInput = {
  id: string;
  bio: string | null;
  logo: string | null;
  coverImage?: string | null;
  country?: string | null;
  website?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  facebook?: string | null;
  spotify?: string | null;
  appleMusic?: string | null;
  verified: boolean;
  _count: { artists: number };
};

function hasValue(value: PresenceValue) {
  if (typeof value === "string") return value.trim().length > 0;
  return Boolean(value);
}

function buildCompletenessScore(items: ChecklistItem[]) {
  if (items.length === 0) return 0;
  const completed = items.filter((item) => item.complete).length;
  return Math.round((completed / items.length) * 100);
}

function hasAnySocial(profile: {
  instagram?: string | null;
  twitter?: string | null;
  facebook?: string | null;
  spotify?: string | null;
  appleMusic?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  soundcloud?: string | null;
  boomplay?: string | null;
  website?: string | null;
}) {
  return [
    profile.instagram,
    profile.twitter,
    profile.facebook,
    profile.spotify,
    profile.appleMusic,
    profile.youtube,
    profile.tiktok,
    profile.soundcloud,
    profile.boomplay,
    profile.website,
  ].some(hasValue);
}

function moneyToNaira(kobo: number | null | undefined) {
  return Math.round((kobo ?? 0) / 100);
}

function profileActionFromChecklist(items: ChecklistItem[], href: string): ActionItem | null {
  const missing = items.filter((item) => !item.complete);
  if (missing.length === 0) return null;

  return {
    key: "profile-completeness",
    label: "Complete profile",
    description: `Add ${missing
      .slice(0, 3)
      .map((item) => item.label.toLowerCase())
      .join(", ")}${missing.length > 3 ? " and more" : ""}.`,
    href,
    value: `${missing.length} left`,
    tone: "warning",
  };
}

export async function getArtistCommandCenter(artist: ArtistProfileInput) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const profileChecklist: ChecklistItem[] = [
    {
      key: "photo",
      label: "Profile photo",
      complete: hasValue(artist.photo),
      href: "/dashboard/artist-profile",
    },
    {
      key: "cover",
      label: "Cover image",
      complete: hasValue(artist.coverImage),
      href: "/dashboard/artist-profile",
    },
    {
      key: "bio",
      label: "Short bio",
      complete: hasValue(artist.bio),
      href: "/dashboard/artist-profile",
    },
    {
      key: "genre",
      label: "Genre",
      complete: hasValue(artist.genre),
      href: "/dashboard/artist-profile",
    },
    {
      key: "country",
      label: "Country",
      complete: hasValue(artist.country),
      href: "/dashboard/artist-profile",
    },
    {
      key: "social",
      label: "Social or streaming link",
      complete: hasAnySocial(artist),
      href: "/dashboard/artist-profile",
    },
    {
      key: "first-track",
      label: "First track",
      complete: artist._count.music > 0,
      href: "/dashboard/music",
    },
  ];

  const [
    streamAggregate,
    downloadCount,
    recentDownloadCount,
    revenueAggregate,
    purchaseCount,
    missingArtworkCount,
    pendingProcessingCount,
    failedProcessingCount,
    premiumTrackCount,
    recentTracks,
    topTracks,
  ] = await Promise.all([
    db.music.aggregate({ where: { artistId: artist.id }, _sum: { streamCount: true } }),
    db.download.count({ where: { music: { artistId: artist.id } } }),
    db.download.count({
      where: { createdAt: { gte: thirtyDaysAgo }, music: { artistId: artist.id } },
    }),
    db.transaction.aggregate({
      where: {
        type: "download",
        status: "success",
        music: { is: { artistId: artist.id } },
      },
      _sum: { amount: true },
    }),
    db.transaction.count({
      where: {
        type: "download",
        status: "success",
        music: { is: { artistId: artist.id } },
      },
    }),
    db.music.count({
      where: { artistId: artist.id, OR: [{ coverArt: null }, { coverArt: "" }] },
    }),
    db.music.count({
      where: { artistId: artist.id, processingStatus: { in: ["pending", "processing"] } },
    }),
    db.music.count({ where: { artistId: artist.id, processingStatus: "failed" } }),
    db.music.count({
      where: {
        artistId: artist.id,
        OR: [
          { isExclusive: true },
          { accessModel: { in: ["subscription", "purchase", "both"] } },
          { streamAccess: "subscription" },
        ],
      },
    }),
    db.music.findMany({
      where: { artistId: artist.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: TRACK_SELECT,
    }),
    db.music.findMany({
      where: { artistId: artist.id },
      orderBy: [{ downloadCount: "desc" }, { streamCount: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: TRACK_SELECT,
    }),
  ]);

  const grossRevenue = revenueAggregate._sum.amount ?? 0;
  const profileAction = profileActionFromChecklist(profileChecklist, "/dashboard/artist-profile");
  const actions: ActionItem[] = [
    profileAction,
    failedProcessingCount > 0
      ? {
          key: "failed-processing",
          label: "Fix failed audio",
          description: "Some uploads failed audio processing and may need a retry or re-upload.",
          href: "/dashboard/music",
          value: failedProcessingCount.toLocaleString(),
          tone: "danger",
        }
      : null,
    pendingProcessingCount > 0
      ? {
          key: "processing-queue",
          label: "Audio still processing",
          description: "These tracks are waiting for waveform/transcode completion.",
          href: "/dashboard/music",
          value: pendingProcessingCount.toLocaleString(),
          tone: "info",
        }
      : null,
    missingArtworkCount > 0
      ? {
          key: "missing-artwork",
          label: "Add track artwork",
          description: "Better artwork improves trust, shares, and music-card conversion.",
          href: "/dashboard/music",
          value: missingArtworkCount.toLocaleString(),
          tone: "warning",
        }
      : null,
    artist._count.music === 0
      ? {
          key: "upload-first-track",
          label: "Upload first track",
          description: "Start the artist loop with a release fans can play, save, and share.",
          href: "/dashboard/music",
          tone: "info",
        }
      : null,
  ].filter(Boolean) as ActionItem[];

  return {
    profileChecklist,
    profileScore: buildCompletenessScore(profileChecklist),
    stats: [
      {
        key: "tracks",
        label: "Tracks",
        value: artist._count.music,
        helper: `${artist._count.albums.toLocaleString()} albums`,
      },
      {
        key: "streams",
        label: "Streams",
        value: streamAggregate._sum.streamCount ?? 0,
        helper: "Lifetime plays",
      },
      {
        key: "downloads",
        label: "Downloads",
        value: downloadCount,
        helper: `${recentDownloadCount.toLocaleString()} in 30 days`,
      },
      {
        key: "followers",
        label: "Followers",
        value: artist._count.artistFollows,
        helper: artist.verified ? "Verified profile" : "Build toward verification",
      },
      {
        key: "revenue",
        label: "Gross sales",
        value: moneyToNaira(grossRevenue),
        helper: `${purchaseCount.toLocaleString()} paid downloads`,
      },
    ] satisfies CreatorStat[],
    actions,
    health: {
      missingArtworkCount,
      pendingProcessingCount,
      failedProcessingCount,
      premiumTrackCount,
      grossRevenue,
      purchaseCount,
      recentDownloadCount,
    },
    recentTracks,
    topTracks,
  };
}

export async function getLabelCommandCenter(label: LabelProfileInput) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const profileChecklist: ChecklistItem[] = [
    {
      key: "logo",
      label: "Label logo",
      complete: hasValue(label.logo),
      href: "/dashboard/label-profile",
    },
    {
      key: "cover",
      label: "Cover image",
      complete: hasValue(label.coverImage),
      href: "/dashboard/label-profile",
    },
    {
      key: "bio",
      label: "Label bio",
      complete: hasValue(label.bio),
      href: "/dashboard/label-profile",
    },
    {
      key: "country",
      label: "Country",
      complete: hasValue(label.country),
      href: "/dashboard/label-profile",
    },
    {
      key: "website",
      label: "Website or smart home",
      complete: hasValue(label.website),
      href: "/dashboard/label-profile",
    },
    {
      key: "social",
      label: "Social or streaming link",
      complete: hasAnySocial(label),
      href: "/dashboard/label-profile",
    },
    {
      key: "first-artist",
      label: "First roster artist",
      complete: label._count.artists > 0,
      href: "/dashboard/label-artists",
    },
  ];

  const [
    trackCount,
    albumCount,
    streamAggregate,
    downloadCount,
    recentDownloadCount,
    revenueAggregate,
    purchaseCount,
    missingArtworkCount,
    pendingProcessingCount,
    failedProcessingCount,
    artistsWithoutMusic,
    artistsWithoutPhoto,
    recentArtists,
    topTracks,
  ] = await Promise.all([
    db.music.count({ where: { artist: { labelId: label.id } } }),
    db.album.count({ where: { artist: { labelId: label.id } } }),
    db.music.aggregate({
      where: { artist: { labelId: label.id } },
      _sum: { streamCount: true },
    }),
    db.download.count({ where: { music: { artist: { labelId: label.id } } } }),
    db.download.count({
      where: { createdAt: { gte: thirtyDaysAgo }, music: { artist: { labelId: label.id } } },
    }),
    db.transaction.aggregate({
      where: {
        type: "download",
        status: "success",
        music: { is: { artist: { labelId: label.id } } },
      },
      _sum: { amount: true },
    }),
    db.transaction.count({
      where: {
        type: "download",
        status: "success",
        music: { is: { artist: { labelId: label.id } } },
      },
    }),
    db.music.count({
      where: {
        artist: { labelId: label.id },
        OR: [{ coverArt: null }, { coverArt: "" }],
      },
    }),
    db.music.count({
      where: {
        artist: { labelId: label.id },
        processingStatus: { in: ["pending", "processing"] },
      },
    }),
    db.music.count({
      where: { artist: { labelId: label.id }, processingStatus: "failed" },
    }),
    db.artist.count({ where: { labelId: label.id, music: { none: {} } } }),
    db.artist.count({
      where: { labelId: label.id, OR: [{ photo: null }, { photo: "" }] },
    }),
    db.artist.findMany({
      where: { labelId: label.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: RECENT_ARTIST_SELECT,
    }),
    db.music.findMany({
      where: { artist: { labelId: label.id } },
      orderBy: [{ downloadCount: "desc" }, { streamCount: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: TRACK_SELECT,
    }),
  ]);

  const grossRevenue = revenueAggregate._sum.amount ?? 0;
  const profileAction = profileActionFromChecklist(profileChecklist, "/dashboard/label-profile");
  const actions: ActionItem[] = [
    profileAction,
    artistsWithoutMusic > 0
      ? {
          key: "artists-without-music",
          label: "Roster needs releases",
          description: "Some label artists do not have music attached yet.",
          href: "/dashboard/label-artists",
          value: artistsWithoutMusic.toLocaleString(),
          tone: "warning",
        }
      : null,
    artistsWithoutPhoto > 0
      ? {
          key: "artists-without-photo",
          label: "Add artist photos",
          description: "Roster photos make label pages and music cards feel more credible.",
          href: "/dashboard/label-artists",
          value: artistsWithoutPhoto.toLocaleString(),
          tone: "warning",
        }
      : null,
    failedProcessingCount > 0
      ? {
          key: "failed-processing",
          label: "Fix failed releases",
          description: "Some label releases failed audio processing.",
          href: "/dashboard/releases",
          value: failedProcessingCount.toLocaleString(),
          tone: "danger",
        }
      : null,
    pendingProcessingCount > 0
      ? {
          key: "processing-queue",
          label: "Releases still processing",
          description: "These tracks are waiting for waveform/transcode completion.",
          href: "/dashboard/releases",
          value: pendingProcessingCount.toLocaleString(),
          tone: "info",
        }
      : null,
    missingArtworkCount > 0
      ? {
          key: "missing-artwork",
          label: "Complete release artwork",
          description: "Artwork gaps make releases harder to promote and share.",
          href: "/dashboard/releases",
          value: missingArtworkCount.toLocaleString(),
          tone: "warning",
        }
      : null,
  ].filter(Boolean) as ActionItem[];

  return {
    profileChecklist,
    profileScore: buildCompletenessScore(profileChecklist),
    stats: [
      {
        key: "artists",
        label: "Artists",
        value: label._count.artists,
        helper: `${albumCount.toLocaleString()} albums`,
      },
      {
        key: "tracks",
        label: "Tracks",
        value: trackCount,
        helper: "Across roster",
      },
      {
        key: "streams",
        label: "Streams",
        value: streamAggregate._sum.streamCount ?? 0,
        helper: "Lifetime plays",
      },
      {
        key: "downloads",
        label: "Downloads",
        value: downloadCount,
        helper: `${recentDownloadCount.toLocaleString()} in 30 days`,
      },
      {
        key: "revenue",
        label: "Gross sales",
        value: moneyToNaira(grossRevenue),
        helper: `${purchaseCount.toLocaleString()} paid downloads`,
      },
    ] satisfies CreatorStat[],
    actions,
    health: {
      albumCount,
      trackCount,
      missingArtworkCount,
      pendingProcessingCount,
      failedProcessingCount,
      artistsWithoutMusic,
      artistsWithoutPhoto,
      grossRevenue,
      purchaseCount,
      recentDownloadCount,
    },
    recentArtists,
    topTracks,
  };
}
