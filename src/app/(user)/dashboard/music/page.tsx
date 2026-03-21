import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Music, Plus, Download, Headphones } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "My Music — Soundloaded",
};

export default async function DashboardMusicPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const artist = await db.artist.findUnique({
    where: { ownerId: userId },
  });

  if (!artist) redirect("/dashboard");

  const tracks = await db.music.findMany({
    where: { artistId: artist.id },
    orderBy: { createdAt: "desc" },
    include: {
      album: { select: { title: true } },
    },
  });

  // Convert BigInt fileSize to string for serialization
  const serializedTracks = tracks.map((track) => ({
    ...track,
    fileSize: track.fileSize.toString(),
  }));

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />

        <main className="min-w-0 space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-black">My Music</h1>
              <p className="text-muted-foreground text-sm">
                {serializedTracks.length} track{serializedTracks.length !== 1 ? "s" : ""} uploaded
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/music">
                <Plus className="mr-2 h-4 w-4" />
                Upload Music
              </Link>
            </Button>
          </div>

          {/* Tracks list */}
          {serializedTracks.length === 0 ? (
            <div className="bg-card/50 ring-border/40 flex flex-col items-center justify-center rounded-2xl py-16 ring-1 backdrop-blur-sm">
              <Music className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="text-foreground text-lg font-semibold">No tracks yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Upload your first track to get started
              </p>
            </div>
          ) : (
            <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
              {/* Table header */}
              <div className="text-muted-foreground border-border/40 hidden border-b px-5 py-3 text-xs font-semibold tracking-wider uppercase sm:grid sm:grid-cols-[1fr_100px_100px_120px]">
                <span>Track</span>
                <span className="text-right">Downloads</span>
                <span className="text-right">Streams</span>
                <span className="text-right">Added</span>
              </div>

              {/* Tracks */}
              <div className="divide-border/30 divide-y">
                {serializedTracks.map((track) => (
                  <div
                    key={track.id}
                    className="hover:bg-muted/30 flex items-center gap-4 px-5 py-3.5 transition-colors sm:grid sm:grid-cols-[1fr_100px_100px_120px]"
                  >
                    {/* Track info */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {track.coverArt ? (
                        <Image
                          src={track.coverArt}
                          alt={track.title}
                          width={44}
                          height={44}
                          className="h-11 w-11 flex-shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="bg-muted flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg">
                          <Music className="text-muted-foreground h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-foreground truncate text-sm font-semibold">
                          {track.title}
                        </p>
                        <div className="flex items-center gap-2">
                          {track.album && (
                            <span className="text-muted-foreground truncate text-xs">
                              {track.album.title}
                            </span>
                          )}
                          <Badge variant="secondary" className="text-[10px]">
                            {track.format.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Downloads */}
                    <div className="hidden items-center justify-end gap-1 sm:flex">
                      <Download className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="text-foreground text-sm font-medium">
                        {track.downloadCount.toLocaleString()}
                      </span>
                    </div>

                    {/* Streams */}
                    <div className="hidden items-center justify-end gap-1 sm:flex">
                      <Headphones className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="text-foreground text-sm font-medium">
                        {track.streamCount.toLocaleString()}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="hidden text-right sm:block">
                      <span className="text-muted-foreground text-xs">
                        {format(track.createdAt, "MMM d, yyyy")}
                      </span>
                    </div>

                    {/* Mobile stats */}
                    <div className="flex items-center gap-3 sm:hidden">
                      <span className="text-muted-foreground text-xs">
                        {track.downloadCount} DL
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {track.streamCount} plays
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
