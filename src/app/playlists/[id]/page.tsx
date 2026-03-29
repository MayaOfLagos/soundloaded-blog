import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MusicLeftSidebar } from "@/components/music/MusicLeftSidebar";
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
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <MusicLeftSidebar />
        <main className="min-w-0">
          <PlaylistPageClient playlistId={id} />
        </main>
      </div>
    </div>
  );
}
