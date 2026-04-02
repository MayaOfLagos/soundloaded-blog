import type { Metadata } from "next";
import { MusicLeftSidebar } from "@/components/music/MusicLeftSidebar";
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
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]">
        {/* Left sidebar */}
        <MusicLeftSidebar />

        {/* Main content */}
        <main className="min-w-0">
          <PlaylistsPageClient />
        </main>

        {/* Right sidebar placeholder — keeps grid consistent */}
        <aside className="hidden lg:block" />
      </div>
    </div>
  );
}
