import { db } from "@/lib/db";

export interface MusicCardData {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  albumTitle?: string | null;
  coverArt?: string | null;
  genre?: string | null;
  downloadCount: number;
  enableDownload: boolean;
  fileSize?: bigint | null;
  releaseYear?: number | null;
}

export interface ArtistCardData {
  id: string;
  slug: string;
  name: string;
  photo?: string | null;
  genre?: string | null;
  songCount: number;
}

export interface AlbumCardData {
  id: string;
  slug: string;
  title: string;
  artistName: string;
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
      include: { artist: { select: { name: true } }, album: { select: { title: true } } },
    });
    return tracks.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      artistName: t.artist.name,
      albumTitle: t.album?.title,
      coverArt: t.coverArt,
      genre: t.genre,
      downloadCount: t.downloadCount,
      enableDownload: t.enableDownload,
      fileSize: t.fileSize,
      releaseYear: t.year,
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
      include: { artist: { select: { name: true } }, album: { select: { title: true } } },
    });
    return tracks.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      artistName: t.artist.name,
      albumTitle: t.album?.title,
      coverArt: t.coverArt,
      genre: t.genre,
      downloadCount: t.downloadCount,
      enableDownload: t.enableDownload,
      fileSize: t.fileSize,
      releaseYear: t.year,
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
      include: { _count: { select: { music: true } } },
    });
    return artists.map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      photo: a.photo,
      genre: a.genre,
      songCount: a._count.music,
    }));
  } catch {
    return [];
  }
}

export async function getLatestAlbums({ limit = 12 }: { limit?: number } = {}): Promise<
  AlbumCardData[]
> {
  try {
    const albums = await db.album.findMany({
      take: limit,
      orderBy: { releaseDate: "desc" },
      include: {
        artist: { select: { name: true } },
        _count: { select: { tracks: true } },
      },
    });
    return albums.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      artistName: a.artist.name,
      coverArt: a.coverArt,
      releaseYear: a.releaseDate ? new Date(a.releaseDate).getFullYear() : null,
      trackCount: a._count.tracks,
      totalDownloads: 0,
    }));
  } catch {
    return [];
  }
}

export async function getArtistBySlug(slug: string) {
  try {
    return await db.artist.findUnique({
      where: { slug },
      include: {
        music: {
          orderBy: { createdAt: "desc" },
          include: { album: { select: { title: true } } },
        },
        albums: { orderBy: { releaseDate: "desc" } },
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
      include: { artist: { select: { name: true } }, album: { select: { title: true } } },
    });
    return tracks.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      artistName: t.artist.name,
      albumTitle: t.album?.title,
      coverArt: t.coverArt,
      genre: t.genre,
      downloadCount: t.downloadCount,
      enableDownload: t.enableDownload,
      fileSize: t.fileSize,
      releaseYear: t.year,
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
      include: { artist: { select: { name: true } }, album: { select: { title: true } } },
    });
    return tracks.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      artistName: t.artist.name,
      albumTitle: t.album?.title,
      coverArt: t.coverArt,
      genre: t.genre,
      downloadCount: t.downloadCount,
      enableDownload: t.enableDownload,
      fileSize: t.fileSize,
      releaseYear: t.year,
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

export async function getAlbumBySlug(slug: string) {
  try {
    return await db.album.findUnique({
      where: { slug },
      include: {
        artist: true,
        tracks: { orderBy: { trackNumber: "asc" } },
      },
    });
  } catch {
    return null;
  }
}
