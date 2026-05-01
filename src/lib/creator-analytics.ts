import {
  RecommendationEntityType,
  RecommendationEventName,
  type Prisma,
  type RecommendationSurface,
} from "@prisma/client";

import { db } from "@/lib/db";

export type CreatorAnalyticsScope = {
  type: "artist" | "label";
  id: string;
  name: string;
};

export type CreatorAnalyticsMetricKey =
  | "qualifiedPlays"
  | "downloads"
  | "saves"
  | "shares"
  | "playlistAdds"
  | "followers"
  | "paidDownloads"
  | "grossSales";

export type CreatorAnalyticsMetric = {
  key: CreatorAnalyticsMetricKey;
  label: string;
  value: number;
  previousValue: number;
  delta: number;
  changePercent: number | null;
  format: "number" | "currency";
};

export type CreatorAnalyticsTrack = {
  id: string;
  title: string;
  slug: string;
  coverArt: string | null;
  artistName: string;
  plays: number;
  downloads: number;
  saves: number;
  shares: number;
  playlistAdds: number;
  paidDownloads: number;
  grossSales: number;
  score: number;
};

export type CreatorAnalyticsSource = {
  surface: RecommendationSurface;
  label: string;
  count: number;
  share: number;
};

export type CreatorAnalyticsReport = {
  scope: CreatorAnalyticsScope;
  period: {
    days: number;
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  metrics: CreatorAnalyticsMetric[];
  sourceBreakdown: CreatorAnalyticsSource[];
  topTracks: CreatorAnalyticsTrack[];
  generatedAt: string;
};

type AnalyticsWindow = {
  start: Date;
  end: Date;
};

type ScopeFilters = {
  musicWhere: Prisma.MusicWhereInput;
  playEventWhere: Prisma.InteractionEventWhereInput;
  followWhere: Prisma.ArtistFollowWhereInput;
};

type WindowCounts = {
  qualifiedPlays: number;
  downloads: number;
  saves: number;
  shares: number;
  playlistAdds: number;
  followers: number;
  paidDownloads: number;
  grossSales: number;
};

type TrackMomentum = {
  plays: number;
  downloads: number;
  saves: number;
  shares: number;
  playlistAdds: number;
  paidDownloads: number;
  grossSales: number;
};

const PERIODS = [7, 30, 90] as const;

const SURFACE_LABELS: Partial<Record<RecommendationSurface, string>> = {
  FEED_FORYOU: "For You feed",
  FEED_FOLLOWING: "Following feed",
  FEED_DISCOVER: "Discover feed",
  EXPLORE_LATEST: "Explore latest",
  EXPLORE_TOP: "Explore top",
  EXPLORE_TRENDING: "Explore trending",
  EXPLORE_HOT: "Explore hot",
  POST_DETAIL: "Post pages",
  MUSIC_DETAIL: "Music pages",
  ARTIST_DETAIL: "Artist pages",
  PLAYLIST_DETAIL: "Playlists",
  SEARCH_RESULTS: "Search",
  SEARCH_TRENDING: "Trending search",
  FOLLOW_SUGGESTIONS: "Follow suggestions",
  LIBRARY_PLAYLIST: "Library playlists",
  STORIES_VIEWER: "Stories",
};

export function normalizeCreatorAnalyticsDays(value: number | string | null | undefined) {
  const raw =
    typeof value === "string" && /^\d+$/.test(value.trim()) ? Number.parseInt(value, 10) : value;
  return PERIODS.includes(raw as (typeof PERIODS)[number]) ? (raw as (typeof PERIODS)[number]) : 30;
}

function buildWindows(days: number, now = new Date()) {
  const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    current: { start: currentStart, end: now },
    previous: { start: previousStart, end: currentStart },
  };
}

function dateRange(window: AnalyticsWindow) {
  return { gte: window.start, lt: window.end };
}

async function buildScopeFilters(scope: CreatorAnalyticsScope): Promise<ScopeFilters> {
  if (scope.type === "artist") {
    const musicIds = (
      await db.music.findMany({
        where: { artistId: scope.id },
        select: { id: true },
      })
    ).map((track) => track.id);

    return {
      musicWhere: { artistId: scope.id },
      playEventWhere: buildPlayEventWhere([scope.id], musicIds),
      followWhere: { artistId: scope.id },
    };
  }

  const [artistIds, musicIds] = await Promise.all([
    db.artist
      .findMany({
        where: { labelId: scope.id },
        select: { id: true },
      })
      .then((artists) => artists.map((artist) => artist.id)),
    db.music
      .findMany({
        where: { artist: { labelId: scope.id } },
        select: { id: true },
      })
      .then((tracks) => tracks.map((track) => track.id)),
  ]);

  return {
    musicWhere: { artist: { labelId: scope.id } },
    playEventWhere: buildPlayEventWhere(artistIds, musicIds),
    followWhere: artistIds.length > 0 ? { artistId: { in: artistIds } } : { artistId: "__none__" },
  };
}

function buildPlayEventWhere(
  artistIds: string[],
  musicIds: string[]
): Prisma.InteractionEventWhereInput {
  const clauses: Prisma.InteractionEventWhereInput[] = [];

  if (artistIds.length === 1) {
    clauses.push({ artistId: artistIds[0] });
  } else if (artistIds.length > 1) {
    clauses.push({ artistId: { in: artistIds } });
  }

  if (musicIds.length > 0) {
    clauses.push({ entityId: { in: musicIds } });
  }

  return clauses.length > 0 ? { OR: clauses } : { entityId: "__none__" };
}

function buildShareEventWhere(
  filters: ScopeFilters,
  window: AnalyticsWindow
): Prisma.InteractionEventWhereInput {
  return {
    eventName: RecommendationEventName.MUSIC_DETAIL_OPEN,
    entityType: RecommendationEntityType.MUSIC,
    occurredAt: dateRange(window),
    metadata: { path: ["eventKind"], equals: "music_share_click" },
    ...filters.playEventWhere,
  };
}

function changePercent(value: number, previousValue: number) {
  if (previousValue === 0) return value > 0 ? 100 : null;
  return Math.round(((value - previousValue) / previousValue) * 100);
}

function createMetric(
  key: CreatorAnalyticsMetricKey,
  label: string,
  value: number,
  previousValue: number,
  format: CreatorAnalyticsMetric["format"] = "number"
): CreatorAnalyticsMetric {
  return {
    key,
    label,
    value,
    previousValue,
    delta: value - previousValue,
    changePercent: changePercent(value, previousValue),
    format,
  };
}

async function getWindowCounts(
  filters: ScopeFilters,
  window: AnalyticsWindow
): Promise<WindowCounts> {
  const occurredAt = dateRange(window);
  const createdAt = dateRange(window);

  const [
    qualifiedPlays,
    downloads,
    favorites,
    bookmarks,
    shares,
    playlistAdds,
    followers,
    paidDownloads,
    grossSales,
  ] = await Promise.all([
    db.interactionEvent.count({
      where: {
        eventName: RecommendationEventName.MUSIC_PLAY_QUALIFIED,
        entityType: RecommendationEntityType.MUSIC,
        occurredAt,
        ...filters.playEventWhere,
      },
    }),
    db.download.count({
      where: {
        createdAt,
        music: filters.musicWhere,
      },
    }),
    db.favorite.count({
      where: {
        createdAt,
        musicId: { not: null },
        music: { is: filters.musicWhere },
      },
    }),
    db.bookmark.count({
      where: {
        createdAt,
        musicId: { not: null },
        music: { is: filters.musicWhere },
      },
    }),
    db.interactionEvent.count({
      where: buildShareEventWhere(filters, window),
    }),
    db.playlistTrack.count({
      where: {
        addedAt: createdAt,
        music: filters.musicWhere,
      },
    }),
    db.artistFollow.count({
      where: {
        createdAt,
        ...filters.followWhere,
      },
    }),
    db.transaction.count({
      where: {
        type: "download",
        status: "success",
        createdAt,
        music: { is: filters.musicWhere },
      },
    }),
    db.transaction.aggregate({
      where: {
        type: "download",
        status: "success",
        createdAt,
        music: { is: filters.musicWhere },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    qualifiedPlays,
    downloads,
    saves: favorites + bookmarks,
    shares,
    playlistAdds,
    followers,
    paidDownloads,
    grossSales: grossSales._sum.amount ?? 0,
  };
}

function addTrackMomentum(
  map: Map<string, TrackMomentum>,
  trackId: string | null,
  patch: Partial<TrackMomentum>
) {
  if (!trackId) return;
  const current =
    map.get(trackId) ??
    ({
      plays: 0,
      downloads: 0,
      saves: 0,
      shares: 0,
      playlistAdds: 0,
      paidDownloads: 0,
      grossSales: 0,
    } satisfies TrackMomentum);

  map.set(trackId, {
    plays: current.plays + (patch.plays ?? 0),
    downloads: current.downloads + (patch.downloads ?? 0),
    saves: current.saves + (patch.saves ?? 0),
    shares: current.shares + (patch.shares ?? 0),
    playlistAdds: current.playlistAdds + (patch.playlistAdds ?? 0),
    paidDownloads: current.paidDownloads + (patch.paidDownloads ?? 0),
    grossSales: current.grossSales + (patch.grossSales ?? 0),
  });
}

async function getTopTracks(filters: ScopeFilters, window: AnalyticsWindow) {
  const occurredAt = dateRange(window);
  const createdAt = dateRange(window);

  const [plays, downloads, favorites, bookmarks, shares, playlistAdds, paidDownloads] =
    await Promise.all([
      db.interactionEvent.groupBy({
        by: ["entityId"],
        where: {
          eventName: RecommendationEventName.MUSIC_PLAY_QUALIFIED,
          entityType: RecommendationEntityType.MUSIC,
          entityId: { not: null },
          occurredAt,
          ...filters.playEventWhere,
        },
        _count: { entityId: true },
        orderBy: { _count: { entityId: "desc" } },
        take: 25,
      }),
      db.download.groupBy({
        by: ["musicId"],
        where: { createdAt, music: filters.musicWhere },
        _count: { musicId: true },
        orderBy: { _count: { musicId: "desc" } },
        take: 25,
      }),
      db.favorite.groupBy({
        by: ["musicId"],
        where: {
          createdAt,
          musicId: { not: null },
          music: { is: filters.musicWhere },
        },
        _count: { musicId: true },
        orderBy: { _count: { musicId: "desc" } },
        take: 25,
      }),
      db.bookmark.groupBy({
        by: ["musicId"],
        where: {
          createdAt,
          musicId: { not: null },
          music: { is: filters.musicWhere },
        },
        _count: { musicId: true },
        orderBy: { _count: { musicId: "desc" } },
        take: 25,
      }),
      db.interactionEvent.groupBy({
        by: ["entityId"],
        where: {
          ...buildShareEventWhere(filters, window),
          entityId: { not: null },
        },
        _count: { entityId: true },
        orderBy: { _count: { entityId: "desc" } },
        take: 25,
      }),
      db.playlistTrack.groupBy({
        by: ["musicId"],
        where: { addedAt: createdAt, music: filters.musicWhere },
        _count: { musicId: true },
        orderBy: { _count: { musicId: "desc" } },
        take: 25,
      }),
      db.transaction.groupBy({
        by: ["musicId"],
        where: {
          type: "download",
          status: "success",
          createdAt,
          musicId: { not: null },
          music: { is: filters.musicWhere },
        },
        _count: { musicId: true },
        _sum: { amount: true },
        orderBy: { _count: { musicId: "desc" } },
        take: 25,
      }),
    ]);

  const momentum = new Map<string, TrackMomentum>();

  for (const row of plays) {
    addTrackMomentum(momentum, row.entityId, { plays: row._count.entityId });
  }
  for (const row of downloads) {
    addTrackMomentum(momentum, row.musicId, { downloads: row._count.musicId });
  }
  for (const row of favorites) {
    addTrackMomentum(momentum, row.musicId, { saves: row._count.musicId });
  }
  for (const row of bookmarks) {
    addTrackMomentum(momentum, row.musicId, { saves: row._count.musicId });
  }
  for (const row of shares) {
    addTrackMomentum(momentum, row.entityId, { shares: row._count.entityId });
  }
  for (const row of playlistAdds) {
    addTrackMomentum(momentum, row.musicId, { playlistAdds: row._count.musicId });
  }
  for (const row of paidDownloads) {
    addTrackMomentum(momentum, row.musicId, {
      paidDownloads: row._count.musicId,
      grossSales: row._sum.amount ?? 0,
    });
  }

  if (momentum.size === 0) return [];

  const trackIds = Array.from(momentum.keys());
  const tracks = await db.music.findMany({
    where: { id: { in: trackIds } },
    select: {
      id: true,
      title: true,
      slug: true,
      coverArt: true,
      artist: { select: { name: true } },
    },
  });
  const tracksById = new Map(tracks.map((track) => [track.id, track]));

  return Array.from(momentum.entries())
    .map(([trackId, stats]) => {
      const track = tracksById.get(trackId);
      if (!track) return null;
      const score =
        stats.plays * 2 +
        stats.downloads * 4 +
        stats.saves * 3 +
        stats.shares * 3 +
        stats.playlistAdds * 3 +
        stats.paidDownloads * 5 +
        stats.grossSales / 10_000;

      return {
        id: track.id,
        title: track.title,
        slug: track.slug,
        coverArt: track.coverArt,
        artistName: track.artist.name,
        ...stats,
        score,
      } satisfies CreatorAnalyticsTrack;
    })
    .filter((track): track is CreatorAnalyticsTrack => Boolean(track))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

async function getSourceBreakdown(filters: ScopeFilters, window: AnalyticsWindow) {
  const sourceRows = await db.interactionEvent.groupBy({
    by: ["surface"],
    where: {
      eventName: RecommendationEventName.MUSIC_PLAY_QUALIFIED,
      entityType: RecommendationEntityType.MUSIC,
      occurredAt: dateRange(window),
      ...filters.playEventWhere,
    },
    _count: { surface: true },
    orderBy: { _count: { surface: "desc" } },
    take: 8,
  });

  const total = sourceRows.reduce((sum, row) => sum + row._count.surface, 0);
  if (total === 0) return [];

  return sourceRows.map((row) => ({
    surface: row.surface,
    label: SURFACE_LABELS[row.surface] ?? row.surface.replaceAll("_", " ").toLowerCase(),
    count: row._count.surface,
    share: Math.round((row._count.surface / total) * 100),
  }));
}

export async function getCreatorAnalyticsReport({
  scope,
  days,
}: {
  scope: CreatorAnalyticsScope;
  days?: number;
}): Promise<CreatorAnalyticsReport> {
  const normalizedDays = normalizeCreatorAnalyticsDays(days);
  const windows = buildWindows(normalizedDays);
  const filters = await buildScopeFilters(scope);

  const [current, previous, sourceBreakdown, topTracks] = await Promise.all([
    getWindowCounts(filters, windows.current),
    getWindowCounts(filters, windows.previous),
    getSourceBreakdown(filters, windows.current),
    getTopTracks(filters, windows.current),
  ]);

  return {
    scope,
    period: {
      days: normalizedDays,
      current: {
        start: windows.current.start.toISOString(),
        end: windows.current.end.toISOString(),
      },
      previous: {
        start: windows.previous.start.toISOString(),
        end: windows.previous.end.toISOString(),
      },
    },
    metrics: [
      createMetric(
        "qualifiedPlays",
        "Qualified plays",
        current.qualifiedPlays,
        previous.qualifiedPlays
      ),
      createMetric("downloads", "Downloads", current.downloads, previous.downloads),
      createMetric("saves", "Saves", current.saves, previous.saves),
      createMetric("shares", "Shares", current.shares, previous.shares),
      createMetric("playlistAdds", "Playlist adds", current.playlistAdds, previous.playlistAdds),
      createMetric("followers", "New followers", current.followers, previous.followers),
      createMetric(
        "paidDownloads",
        "Paid downloads",
        current.paidDownloads,
        previous.paidDownloads
      ),
      createMetric(
        "grossSales",
        "Gross sales",
        current.grossSales,
        previous.grossSales,
        "currency"
      ),
    ],
    sourceBreakdown,
    topTracks,
    generatedAt: new Date().toISOString(),
  };
}
