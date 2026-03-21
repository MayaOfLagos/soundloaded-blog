export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { Disc3, Music } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "My Albums — Soundloaded",
};

const TYPE_COLORS: Record<string, string> = {
  ALBUM: "bg-blue-500/15 text-blue-400",
  EP: "bg-emerald-500/15 text-emerald-400",
  MIXTAPE: "bg-amber-500/15 text-amber-400",
  COMPILATION: "bg-purple-500/15 text-purple-400",
};

export default async function DashboardAlbumsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const artist = await db.artist.findUnique({
    where: { ownerId: userId },
  });

  if (!artist) redirect("/dashboard");

  const albums = await db.album.findMany({
    where: { artistId: artist.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tracks: true } },
    },
  });

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />

        <main className="min-w-0 space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-foreground text-2xl font-black">My Albums</h1>
            <p className="text-muted-foreground text-sm">
              {albums.length} album{albums.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Albums grid */}
          {albums.length === 0 ? (
            <div className="bg-card/50 ring-border/40 flex flex-col items-center justify-center rounded-2xl py-16 ring-1 backdrop-blur-sm">
              <Disc3 className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="text-foreground text-lg font-semibold">No albums yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Your albums and EPs will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className="bg-card/50 ring-border/40 hover:bg-card/70 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm transition-colors"
                >
                  {/* Cover art */}
                  <div className="relative aspect-square w-full overflow-hidden">
                    {album.coverArt ? (
                      <Image src={album.coverArt} alt={album.title} fill className="object-cover" />
                    ) : (
                      <div className="bg-muted flex h-full w-full items-center justify-center">
                        <Music className="text-muted-foreground h-16 w-16" />
                      </div>
                    )}
                    {/* Type badge overlay */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${TYPE_COLORS[album.type] || TYPE_COLORS.ALBUM}`}
                      >
                        {album.type}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-foreground truncate text-sm font-bold">{album.title}</h3>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">
                        {album._count.tracks} track{album._count.tracks !== 1 ? "s" : ""}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {album.releaseDate
                          ? format(album.releaseDate, "MMM d, yyyy")
                          : format(album.createdAt, "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
