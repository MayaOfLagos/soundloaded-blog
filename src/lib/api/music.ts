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
