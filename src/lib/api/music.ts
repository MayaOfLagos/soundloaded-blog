import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import {
  createRecommendationCacheKey,
  diversifyRankedMusicTracks,
  getRecommendationCacheTtlSeconds,
  isRecommendationV1Enabled,
  rankMusicTracks,
  withRecommendationCache,
} from "@/lib/recommendation";
import type { Prisma } from "@prisma/client";

export interface MusicCardData {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  artistSlug: string;
  albumTitle?: string | null;
  coverArt?: string | null;
  genre?: string | null;
  downloadCount: number;
  streamCount: number;
  enableDownload: boolean;
  fileSize?: number | null;
  releaseYear?: number | null;
  r2Key: string;
  // Monetization
  isExclusive?: boolean;
  price?: number | null;
  accessModel: string; // "free" | "subscription" | "purchase" | "both"
  streamAccess: string; // "free" | "subscription"
  creatorPrice: number | null; // kobo
}

export interface ArtistCardData {
  id: string;
  slug: string;
  name: string;
  photo?: string | null;
  genre?: string | null;
  verified: boolean;
  songCount: number;
  followerCount: number;
}

export interface AlbumCardData {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  artistSlug: string;
  coverArt?: string | null;
  releaseYear?: number | null;
  trackCount: number;
  totalDownloads: number;
}

type MusicCardCandidate = {
  id: string;
  slug: string;
  title: string;
  artistId: string;
  albumId: string | null;
  coverArt: string | null;
  genre: string | null;
  downloadCount: number;
  streamCount: number;
  enableDownload: boolean;
  fileSize: bigint | number | null;
  year: number | null;
  r2Key: string;
  createdAt: Date;
  artist: { name: string; slug: string };
  album: { title: string } | null;
  // Monetization
  isExclusive: boolean;
  price: number | null;
  accessModel: string;
  streamAccess: string;
  creatorPrice: number | null;
};

type MusicRecommendationCandidate = MusicCardCandidate & {
  _count: {
    favorites: number;
    bookmarks: number;
    playlistTracks: number;
  };
  playlistTracks?: { playlistId: string }[];
};

function normalizeFileSize(fileSize: bigint | number | null | undefined) {
  if (typeof fileSize === "bigint") return Number(fileSize);
  return fileSize ?? null;
}

function mapMusicCard(track: MusicCardCandidate): MusicCardData {
  return {
    id: track.id,
    slug: track.slug,
    title: track.title,
    artistName: track.artist.name,
    artistSlug: track.artist.slug,
    albumTitle: track.album?.title,
    coverArt: track.coverArt,
    genre: track.genre,
    downloadCount: track.downloadCount,
    streamCount: track.streamCount,
    enableDownload: track.enableDownload,
    fileSize: normalizeFileSize(track.fileSize),
    releaseYear: track.year,
    r2Key: track.r2Key,
    isExclusive: track.isExclusive,
    price: track.price ?? null,
    accessModel: track.accessModel ?? "free",
    streamAccess: track.streamAccess ?? "free",
    creatorPrice: track.creatorPrice ?? null,
  };
}

function toRankableMusicTrack(track: MusicRecommendationCandidate) {
  return {
    ...track,
    favoriteCount: track._count.favorites,
    bookmarkCount: track._count.bookmarks,
    playlistOverlapCount: track.playlistTracks?.length ?? 0,
  };
}

export const getPopularMusic = unstable_cache(
  async ({ limit = 5 }: { limit?: number } = {}): Promise<MusicCardData[]> => {
    try {
      const tracks = await db.music.findMany({
        orderBy: { downloadCount: "desc" },
        take: limit,
        include: {
          artist: { select: { name: true, slug: true } },
          album: { select: { title: true } },
        },
      });
      return tracks.map(mapMusicCard);
    } catch {
      return [];
    }
  },
  ["popular-music"],
  { revalidate: 300, tags: ["music"] }
);

export const getMostStreamedMusic = unstable_cache(
  async ({ limit = 20 }: { limit?: number } = {}): Promise<MusicCardData[]> => {
    try {
      const tracks = await db.music.findMany({
        where: { streamCount: { gt: 0 } },
        orderBy: { streamCount: "desc" },
        take: limit,
        include: {
          artist: { select: { name: true, slug: true } },
          album: { select: { title: true } },
        },
      });
      return tracks.map(mapMusicCard);
    } catch {
      return [];
    }
  },
  ["most-streamed-music"],
  { revalidate: 300, tags: ["music"] }
);

export const getLatestMusic = unstable_cache(
  async ({
    limit = 12,
    page = 1,
    genre,
  }: { limit?: number; page?: number; genre?: string } = {}): Promise<MusicCardData[]> => {
    try {
      const tracks = await db.music.findMany({
        where: { ...(genre ? { genre } : {}) },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          artist: { select: { name: true, slug: true } },
          album: { select: { title: true } },
        },
      });
      return tracks.map(mapMusicCard);
    } catch {
      return [];
    }
  },
  ["latest-music"],
  { revalidate: 60, tags: ["music"] }
);

export async function getMusicBySlug(slug: string) {
  try {
    return await db.music.findUnique({
      where: { slug },
      include: {
        artist: true,
        album: { include: { tracks: { orderBy: { trackNumber: "asc" } } } },
        post: { select: { body: true } },
      },
    });
  } catch {
    return null;
  }
}

export const getLatestArtists = unstable_cache(
  async ({ limit = 12 }: { limit?: number } = {}): Promise<ArtistCardData[]> => {
    try {
      const artists = await db.artist.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { music: true, artistFollows: true } } },
      });
      return artists.map((a) => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        photo: a.photo,
        genre: a.genre,
        verified: a.verified,
        songCount: a._count.music,
        followerCount: a._count.artistFollows,
      }));
    } catch {
      return [];
    }
  },
  ["latest-artists"],
  { revalidate: 300, tags: ["music"] }
);

/**
 * Artists with profile photos, used for the landing-page orbit.
 * Pulls a larger candidate pool then shuffles server-side, so the orbit
 * displays a different random selection on each request.
 */
export async function getOrbitArtists({
  limit = 12,
  pool = 50,
}: { limit?: number; pool?: number } = {}): Promise<
  Array<{ id: string; slug: string; name: string; photo: string }>
> {
  try {
    const candidates = await db.artist.findMany({
      where: { photo: { not: null } },
      take: pool,
      orderBy: { createdAt: "desc" },
      select: { id: true, slug: true, name: true, photo: true },
    });
    const filtered = candidates.filter((a): a is typeof a & { photo: string } => !!a.photo);
    // Fisher–Yates shuffle
    for (let i = filtered.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
    return filtered
      .slice(0, limit)
      .map((a) => ({ id: a.id, slug: a.slug, name: a.name, photo: a.photo }));
  } catch {
    return [];
  }
}

export async function getLatestAlbums({
  limit = 12,
  cursor,
}: { limit?: number; cursor?: string } = {}): Promise<{
  albums: AlbumCardData[];
  nextCursor: string | null;
}> {
  try {
    const albums = await db.album.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { releaseDate: "desc" },
      include: {
        artist: { select: { name: true, slug: true } },
        _count: { select: { tracks: true } },
      },
    });

    let nextCursor: string | null = null;
    if (albums.length > limit) {
      const next = albums.pop();
      nextCursor = next!.id;
    }

    return {
      albums: albums.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        artistName: a.artist.name,
        artistSlug: a.artist.slug,
        coverArt: a.coverArt,
        releaseYear: a.releaseDate ? new Date(a.releaseDate).getFullYear() : null,
        trackCount: a._count.tracks,
        totalDownloads: 0,
      })),
      nextCursor,
    };
  } catch {
    return { albums: [], nextCursor: null };
  }
}

export async function getArtistBySlug(slug: string) {
  try {
    return await db.artist.findUnique({
      where: { slug },
      include: {
        _count: { select: { music: true, albums: true } },
        music: {
          orderBy: { createdAt: "desc" },
          include: { album: { select: { title: true } } },
        },
        albums: {
          orderBy: { releaseDate: "desc" },
          include: {
            _count: { select: { tracks: true } },
            tracks: { select: { downloadCount: true } },
          },
        },
      },
    });
  } catch {
    return null;
  }
}

export async function getDistinctGenres(): Promise<string[]> {
  try {
    const results = await db.music.findMany({
      where: { genre: { not: null } },
      distinct: ["genre"],
      select: { genre: true },
      orderBy: { genre: "asc" },
    });
    return results.map((r) => r.genre).filter(Boolean) as string[];
  } catch {
    return [];
  }
}

export async function getMusicByGenre({
  genre,
  limit = 20,
}: {
  genre: string;
  limit?: number;
}): Promise<MusicCardData[]> {
  return getLatestMusic({ limit, genre });
}

export async function getTopGenresWithTracks({
  genreLimit = 3,
  trackLimit = 20,
}: { genreLimit?: number; trackLimit?: number } = {}): Promise<
  { genre: string; tracks: MusicCardData[] }[]
> {
  try {
    // Get genres sorted by track count
    const genreCounts = await db.music.groupBy({
      by: ["genre"],
      where: { genre: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: genreLimit,
    });

    const results = await Promise.all(
      genreCounts
        .filter((g) => g.genre)
        .map(async (g) => ({
          genre: g.genre!,
          tracks: await getLatestMusic({ limit: trackLimit, genre: g.genre! }),
        }))
    );

    return results.filter((r) => r.tracks.length > 0);
  } catch {
    return [];
  }
}

/** More tracks by the same artist (excluding the current track) */
export async function getMoreByArtist({
  artistId,
  excludeMusicId,
  limit = 12,
}: {
  artistId: string;
  excludeMusicId: string;
  limit?: number;
}): Promise<MusicCardData[]> {
  try {
    if (!isRecommendationV1Enabled()) {
      return getLegacyMoreByArtist({ artistId, excludeMusicId, limit });
    }

    const cacheKey = createRecommendationCacheKey([
      "more-by-artist",
      artistId,
      excludeMusicId,
      limit,
    ]);
    return await withRecommendationCache({
      key: cacheKey,
      ttlSeconds: getRecommendationCacheTtlSeconds("relatedMusic"),
      load: async () => getRankedMoreByArtist({ artistId, excludeMusicId, limit }),
    });
  } catch {
    return [];
  }
}

async function getRankedMoreByArtist({
  artistId,
  excludeMusicId,
  limit,
}: {
  artistId: string;
  excludeMusicId: string;
  limit: number;
}): Promise<MusicCardData[]> {
  const candidateTake = Math.min(Math.max(limit * 4, 24), 80);
  const tracks = await db.music.findMany({
    where: { artistId, id: { not: excludeMusicId } },
    orderBy: [{ downloadCount: "desc" }, { streamCount: "desc" }, { createdAt: "desc" }],
    take: candidateTake,
    include: {
      artist: { select: { name: true, slug: true } },
      album: { select: { title: true } },
      _count: { select: { favorites: true, bookmarks: true, playlistTracks: true } },
    },
  });
  const ranked = rankMusicTracks(tracks.map(toRankableMusicTrack), {
    artistId,
    candidateSource: "same_artist",
  });
  const diversified = diversifyRankedMusicTracks(ranked, { maxConsecutiveAlbums: 2 });

  return diversified.slice(0, limit).map(mapMusicCard);
}

async function getLegacyMoreByArtist({
  artistId,
  excludeMusicId,
  limit,
}: {
  artistId: string;
  excludeMusicId: string;
  limit: number;
}): Promise<MusicCardData[]> {
  const tracks = await db.music.findMany({
    where: { artistId, id: { not: excludeMusicId } },
    orderBy: { downloadCount: "desc" },
    take: limit,
    include: {
      artist: { select: { name: true, slug: true } },
      album: { select: { title: true } },
    },
  });
  return tracks.map(mapMusicCard);
}

/** Related tracks from the same genre (excluding the current track) */
export async function getRelatedByGenre({
  genre,
  excludeMusicId,
  limit = 12,
}: {
  genre: string;
  excludeMusicId: string;
  limit?: number;
}): Promise<MusicCardData[]> {
  try {
    if (!isRecommendationV1Enabled()) {
      return getLegacyRelatedByGenre({ genre, excludeMusicId, limit });
    }

    const cacheKey = createRecommendationCacheKey([
      "related-by-genre",
      genre,
      excludeMusicId,
      limit,
    ]);
    return await withRecommendationCache({
      key: cacheKey,
      ttlSeconds: getRecommendationCacheTtlSeconds("relatedMusic"),
      load: async () => getRankedRelatedByGenre({ genre, excludeMusicId, limit }),
    });
  } catch {
    return [];
  }
}

async function getRankedRelatedByGenre({
  genre,
  excludeMusicId,
  limit,
}: {
  genre: string;
  excludeMusicId: string;
  limit: number;
}): Promise<MusicCardData[]> {
  const candidateTake = Math.min(Math.max(limit * 4, 24), 80);
  const tracks = await db.music.findMany({
    where: { genre, id: { not: excludeMusicId } },
    orderBy: [{ downloadCount: "desc" }, { streamCount: "desc" }, { createdAt: "desc" }],
    take: candidateTake,
    include: {
      artist: { select: { name: true, slug: true } },
      album: { select: { title: true } },
      _count: { select: { favorites: true, bookmarks: true, playlistTracks: true } },
    },
  });
  const ranked = rankMusicTracks(tracks.map(toRankableMusicTrack), {
    genre,
    candidateSource: "same_genre",
  });
  const diversified = diversifyRankedMusicTracks(ranked, {
    maxConsecutiveArtists: 2,
    maxConsecutiveAlbums: 2,
  });

  return diversified.slice(0, limit).map(mapMusicCard);
}

async function getLegacyRelatedByGenre({
  genre,
  excludeMusicId,
  limit,
}: {
  genre: string;
  excludeMusicId: string;
  limit: number;
}): Promise<MusicCardData[]> {
  const tracks = await db.music.findMany({
    where: { genre, id: { not: excludeMusicId } },
    orderBy: { downloadCount: "desc" },
    take: limit,
    include: {
      artist: { select: { name: true, slug: true } },
      album: { select: { title: true } },
    },
  });
  return tracks.map(mapMusicCard);
}

/** Hybrid related tracks for a music detail page. */
export async function getRelatedMusicForTrack({
  musicId,
  artistId,
  albumId,
  genre,
  limit = 12,
}: {
  musicId: string;
  artistId: string;
  albumId?: string | null;
  genre?: string | null;
  limit?: number;
}): Promise<MusicCardData[]> {
  try {
    if (!isRecommendationV1Enabled()) {
      const [sameArtist, sameGenre] = await Promise.all([
        getLegacyMoreByArtist({ artistId, excludeMusicId: musicId, limit }),
        genre
          ? getLegacyRelatedByGenre({ genre, excludeMusicId: musicId, limit })
          : Promise.resolve([]),
      ]);

      return dedupeMusicCards([...sameArtist, ...sameGenre]).slice(0, limit);
    }

    const cacheKey = createRecommendationCacheKey([
      "related-music",
      musicId,
      artistId,
      albumId ?? "none",
      genre ?? "none",
      limit,
    ]);
    return await withRecommendationCache({
      key: cacheKey,
      ttlSeconds: getRecommendationCacheTtlSeconds("relatedMusic"),
      load: async () =>
        getRankedRelatedMusicForTrack({
          musicId,
          artistId,
          albumId,
          genre,
          limit,
        }),
    });
  } catch {
    return [];
  }
}

async function getRankedRelatedMusicForTrack({
  musicId,
  artistId,
  albumId,
  genre,
  limit,
}: {
  musicId: string;
  artistId: string;
  albumId?: string | null;
  genre?: string | null;
  limit: number;
}): Promise<MusicCardData[]> {
  const candidateTake = Math.min(Math.max(limit * 6, 30), 100);
  const playlistRefs = await db.playlistTrack.findMany({
    where: { musicId, playlist: { isPublic: true } },
    select: { playlistId: true },
    take: 50,
  });
  const playlistIds = Array.from(new Set(playlistRefs.map((track) => track.playlistId)));
  const candidateWhere: Prisma.MusicWhereInput[] = [{ artistId }];

  if (albumId) {
    candidateWhere.push({ albumId });
  }

  if (genre) {
    candidateWhere.push({ genre });
  }

  if (playlistIds.length > 0) {
    candidateWhere.push({ playlistTracks: { some: { playlistId: { in: playlistIds } } } });
  }

  const tracks = await db.music.findMany({
    where: {
      id: { not: musicId },
      OR: candidateWhere,
    },
    orderBy: [{ downloadCount: "desc" }, { streamCount: "desc" }, { createdAt: "desc" }],
    take: candidateTake,
    include: {
      artist: { select: { name: true, slug: true } },
      album: { select: { title: true } },
      _count: { select: { favorites: true, bookmarks: true, playlistTracks: true } },
      playlistTracks: {
        where: { playlistId: { in: playlistIds } },
        select: { playlistId: true },
        take: 20,
      },
    },
  });
  const ranked = rankMusicTracks(tracks.map(toRankableMusicTrack), {
    artistId,
    albumId,
    genre,
    candidateSource: "music_detail",
  });
  const diversified = diversifyRankedMusicTracks(ranked, {
    maxConsecutiveArtists: 2,
    maxConsecutiveAlbums: 2,
  });

  return diversified.slice(0, limit).map(mapMusicCard);
}

function dedupeMusicCards(tracks: MusicCardData[]) {
  const seen = new Set<string>();
  const result: MusicCardData[] = [];

  for (const track of tracks) {
    if (seen.has(track.id)) continue;
    seen.add(track.id);
    result.push(track);
  }

  return result;
}

/** Count how many users have favorited this track */
export async function getMusicFavoriteCount(musicId: string): Promise<number> {
  try {
    return await db.favorite.count({ where: { musicId } });
  } catch {
    return 0;
  }
}

export interface PublicPlaylistData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  trackCount: number;
  coverArts: (string | null)[];
  createdAt: Date;
  updatedAt: Date;
}

export async function getPublicPlaylists({ limit = 10 }: { limit?: number } = {}): Promise<
  PublicPlaylistData[]
> {
  try {
    const playlists = await db.playlist.findMany({
      where: { isPublic: true },
      include: {
        _count: { select: { tracks: true } },
        tracks: {
          orderBy: { position: "asc" },
          take: 4,
          include: { music: { select: { coverArt: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return playlists.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      coverImage: p.coverImage,
      isPublic: p.isPublic,
      trackCount: p._count.tracks,
      coverArts: p.tracks.map((t) => t.music.coverArt).filter(Boolean),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  } catch {
    return [];
  }
}

/** Similar artists from genre, playlist co-occurrence, catalog size, and listener demand. */
export async function getSimilarArtistsForArtist({
  artistId,
  genre,
  limit = 8,
}: {
  artistId: string;
  genre?: string | null;
  limit?: number;
}): Promise<ArtistCardData[]> {
  try {
    const cacheKey = createRecommendationCacheKey([
      "similar-artists",
      artistId,
      genre ?? "none",
      limit,
    ]);

    return await withRecommendationCache({
      key: cacheKey,
      ttlSeconds: getRecommendationCacheTtlSeconds("relatedMusic"),
      load: async () => getRankedSimilarArtistsForArtist({ artistId, genre, limit }),
    });
  } catch {
    return [];
  }
}

async function getRankedSimilarArtistsForArtist({
  artistId,
  genre,
  limit,
}: {
  artistId: string;
  genre?: string | null;
  limit: number;
}): Promise<ArtistCardData[]> {
  const currentTracks = await db.music.findMany({
    where: { artistId },
    select: { id: true },
    take: 200,
  });
  const currentTrackIds = currentTracks.map((track) => track.id);
  const playlistRefs =
    currentTrackIds.length > 0
      ? await db.playlistTrack.findMany({
          where: { musicId: { in: currentTrackIds }, playlist: { isPublic: true } },
          select: { playlistId: true },
          take: 200,
        })
      : [];
  const playlistIds = Array.from(new Set(playlistRefs.map((track) => track.playlistId)));
  const affinityWhere: Prisma.ArtistWhereInput[] = [];

  if (genre) {
    affinityWhere.push({ genre });
  }

  if (playlistIds.length > 0) {
    affinityWhere.push({
      music: { some: { playlistTracks: { some: { playlistId: { in: playlistIds } } } } },
    });
  }

  const artists = await db.artist.findMany({
    where: {
      id: { not: artistId },
      ...(affinityWhere.length > 0 ? { OR: affinityWhere } : {}),
    },
    take: Math.min(Math.max(limit * 4, 24), 80),
    include: {
      _count: { select: { music: true, artistFollows: true } },
      music: {
        select: {
          downloadCount: true,
          streamCount: true,
          playlistTracks: {
            where: { playlistId: { in: playlistIds } },
            select: { playlistId: true },
            take: 20,
          },
        },
        take: 20,
      },
    },
  });

  return artists
    .map((artist) => {
      const playlistOverlap = artist.music.reduce(
        (sum, track) => sum + track.playlistTracks.length,
        0
      );
      const demand = artist.music.reduce(
        (sum, track) => sum + track.downloadCount * 0.5 + track.streamCount * 0.25,
        0
      );
      const sameGenre = genre && artist.genre === genre;
      const score =
        (sameGenre ? 50 : 0) +
        playlistOverlap * 25 +
        artist._count.artistFollows * 2 +
        artist._count.music * 1.5 +
        demand;

      return {
        artist,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ artist }) => ({
      id: artist.id,
      slug: artist.slug,
      name: artist.name,
      photo: artist.photo,
      genre: artist.genre,
      verified: artist.verified,
      songCount: artist._count.music,
      followerCount: artist._count.artistFollows,
    }));
}

export async function getAlbumBySlug(slug: string) {
  try {
    return await db.album.findUnique({
      where: { slug },
      include: {
        artist: true,
        tracks: {
          orderBy: { trackNumber: "asc" },
          include: { artist: { select: { name: true, slug: true } } },
        },
      },
    });
  } catch {
    return null;
  }
}
