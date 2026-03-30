import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MusicPageLayout } from "@/components/music/MusicPageLayout";
import { PlaylistPageClient } from "./PlaylistPageClient";

interface PlaylistPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PlaylistPageProps): Promise<Metadata> {
  const { id } = await params;
  const playlist = await db.playlist.findUnique({
    where: { id },
    select: { title: true, description: true, isPublic: true, coverImage: true },
  });

  if (!playlist || !playlist.isPublic) {
    return { title: "Playlist Not Found" };
  }

  return {
    title: playlist.title,
    description: playlist.description || `Listen to ${playlist.title} on Soundloaded`,
    openGraph: {
      title: playlist.title,
      description: playlist.description || undefined,
      images: playlist.coverImage ? [{ url: playlist.coverImage }] : [],
    },
  };
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = await params;
  return (
    <MusicPageLayout>
      <PlaylistPageClient playlistId={id} />
    </MusicPageLayout>
  );
}
