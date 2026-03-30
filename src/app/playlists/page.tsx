import type { Metadata } from "next";
import { MusicPageLayout } from "@/components/music/MusicPageLayout";
import { PlaylistsPageClient } from "./PlaylistsPageClient";

export const metadata: Metadata = {
  title: "Playlists",
  description:
    "Discover curated playlists from the Soundloaded community. Browse collections of Afrobeats, Afropop, and Nigerian music.",
  alternates: { canonical: "/playlists" },
};

export const revalidate = 60;

export default function PlaylistsPage() {
  return (
    <MusicPageLayout>
      <PlaylistsPageClient />
    </MusicPageLayout>
  );
}
