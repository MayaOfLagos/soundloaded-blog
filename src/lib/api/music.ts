import { db } from "@/lib/db";

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
  fileSize?: bigint | null;
  releaseYear?: number | null;
  r2Key: string;
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

export async function getPopularMusic({ limit = 5 }: { limit?: number } = {}): Promise<
  MusicCardData[]
> {
  try {
    const tracks = await db.music.findMany({
      orderBy: { downloadCount: "desc" },
      take: limit,
      include: {
        artist: { select: { name: true, slug: true } },
        album: { select: { title: true } },
      },
    });
    return tracks.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      artistName: t.artist.name,
      artistSlug: t.artist.slug,
      albumTitle: t.album?.title,
      coverArt: t.coverArt,
      genre: t.genre,
      downloadCount: t.downloadCount,
      streamCount: t.streamCount,
      enableDownload: t.enableDownload,
      fileSize: t.fileSize,
      releaseYear: t.year,
      r2Key: t.r2Key,
    }));
  } catch {
    return [];
  }
}

export async function getMostStreamedMusic({ limit = 20 }: { limit?: number } = {}): Promise<
  MusicCardData[]
> {
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
    return tracks.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      artistName: t.artist.name,
      artistSlug: t.artist.slug,
      albumTitle: t.album?.title,
      coverArt: t.coverArt,
      genre: t.genre,
      downloadCount: t.downloadCount,
      streamCount: t.streamCount,
      enableDownload: t.enableDownload,
      fileSize: t.fileSize,
      releaseYear: t.year,
      r2Key: t.r2Key,
    }));
  } catch {
    return [];
  }
}

export async function getLatestMusic({
  limit = 12,
  page = 1,
  genre,
}: { limit?: number; page?: number; genre?: string } = {}): Promise<MusicCardData[]> {
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
    return tracks.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      artistName: t.artist.name,
      artistSlug: t.artist.slug,
      albumTitle: t.album?.title,
      coverArt: t.coverArt,
      genre: t.genre,
      downloadCount: t.downloadCount,
      streamCount: t.streamCount,
      enableDownload: t.enableDownload,
      fileSize: t.fileSize,
      releaseYear: t.year,
      r2Key: t.r2Key,
    }));
  } catch {
    return [];
  }
}

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

export async function getLatestArtists({ limit = 12 }: { limit?: number } = {}): Promise<
  ArtistCardData[]
> {
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
    const tracks = await db.music.findMany({
      where: { artistId, id: { not: excludeMusicId } },
      orderBy: { downloadCount: "desc" },
      take: limit,
      include: {
        artist: { select: { name: true, slug: true } },
        album: { select: { title: true } },
      },
    });
    return tracks.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      artistName: t.artist.name,
      artistSlug: t.artist.slug,
      albumTitle: t.album?.title,
      coverArt: t.coverArt,
      genre: t.genre,
      downloadCount: t.downloadCount,
      streamCount: t.streamCount,
      enableDownload: t.enableDownload,
      fileSize: t.fileSize,
      releaseYear: t.year,
      r2Key: t.r2Key,
    }));
  } catch {
    return [];
  }
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
    const tracks = await db.music.findMany({
      where: { genre, id: { not: excludeMusicId } },
      orderBy: { downloadCount: "desc" },
      take: limit,
      include: {
        artist: { select: { name: true, slug: true } },
        album: { select: { title: true } },
      },
    });
    return tracks.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      artistName: t.artist.name,
      artistSlug: t.artist.slug,
      albumTitle: t.album?.title,
      coverArt: t.coverArt,
      genre: t.genre,
      downloadCount: t.downloadCount,
      streamCount: t.streamCount,
      enableDownload: t.enableDownload,
      fileSize: t.fileSize,
      releaseYear: t.year,
      r2Key: t.r2Key,
    }));
  } catch {
    return [];
  }
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
