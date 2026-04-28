import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const q = searchParams.get("q")?.trim();
  const relatedTo = searchParams.get("relatedTo")?.trim();

  if (relatedTo) {
    const playlists = await getRelatedPlaylists(relatedTo, limit);
    return NextResponse.json({
      playlists,
      total: playlists.length,
      page: 1,
      totalPages: 1,
    });
  }

  const where = {
    isPublic: true,
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [playlists, total] = await Promise.all([
    db.playlist.findMany({
      where,
      include: {
        user: { select: { name: true, username: true, image: true } },
        _count: { select: { tracks: true } },
        tracks: {
          orderBy: { position: "asc" },
          take: 4,
          include: { music: { select: { coverArt: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.playlist.count({ where }),
  ]);

  return NextResponse.json({
    playlists: playlists.map(mapPlaylistSummary),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

async function getRelatedPlaylists(playlistId: string, limit: number) {
  const currentTracks = await db.playlistTrack.findMany({
    where: { playlistId },
    select: { musicId: true },
    take: 250,
  });
  const musicIds = currentTracks.map((track) => track.musicId);

  if (musicIds.length === 0) {
    const playlists = await db.playlist.findMany({
      where: { isPublic: true, id: { not: playlistId } },
      include: playlistSummaryInclude,
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return playlists.map(mapPlaylistSummary);
  }

  const [overlap, filler] = await Promise.all([
    db.playlist.findMany({
      where: {
        isPublic: true,
        id: { not: playlistId },
        tracks: { some: { musicId: { in: musicIds } } },
      },
      include: {
        ...playlistSummaryInclude,
        tracks: {
          orderBy: { position: "asc" },
          include: { music: { select: { id: true, coverArt: true } } },
        },
      },
      take: Math.min(Math.max(limit * 4, 20), 80),
    }),
    db.playlist.findMany({
      where: { isPublic: true, id: { not: playlistId } },
      include: playlistSummaryInclude,
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
  ]);

  const currentMusicIds = new Set(musicIds);
  const ranked = overlap
    .map((playlist) => {
      const overlapCount = playlist.tracks.filter((track) =>
        currentMusicIds.has(track.music.id)
      ).length;
      return {
        playlist,
        score: overlapCount * 30 + playlist._count.tracks + playlist.updatedAt.getTime() / 1e12,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ playlist }) => playlist);

  return dedupePlaylists([...ranked, ...filler])
    .slice(0, limit)
    .map(mapPlaylistSummary);
}

const playlistSummaryInclude = {
  user: { select: { name: true, username: true, image: true } },
  _count: { select: { tracks: true } },
  tracks: {
    orderBy: { position: "asc" as const },
    take: 4,
    include: { music: { select: { coverArt: true } } },
  },
};

function mapPlaylistSummary(playlist: {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: { name: string | null; username: string | null; image: string | null };
  _count: { tracks: number };
  tracks: Array<{ music: { coverArt: string | null } }>;
}) {
  return {
    id: playlist.id,
    title: playlist.title,
    slug: playlist.slug,
    description: playlist.description,
    coverImage: playlist.coverImage,
    isPublic: playlist.isPublic,
    trackCount: playlist._count.tracks,
    coverArts: playlist.tracks.map((track) => track.music.coverArt).filter(Boolean),
    creator: playlist.user,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  };
}

function dedupePlaylists<T extends { id: string }>(playlists: T[]) {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const playlist of playlists) {
    if (seen.has(playlist.id)) continue;
    seen.add(playlist.id);
    result.push(playlist);
  }

  return result;
}
