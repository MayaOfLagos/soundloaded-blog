import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Users, Music, Disc3, User } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "My Artists — Soundloaded",
};

export default async function LabelArtistsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const label = await db.label.findUnique({
    where: { ownerId: userId },
  });

  if (!label) redirect("/dashboard");

  const artists = await db.artist.findMany({
    where: { labelId: label.id },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { music: true, albums: true } },
    },
  });

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />

        <main className="min-w-0 space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-foreground text-2xl font-black">My Artists</h1>
            <p className="text-muted-foreground text-sm">
              {artists.length} artist{artists.length !== 1 ? "s" : ""} on your roster
            </p>
          </div>

          {/* Artists list */}
          {artists.length === 0 ? (
            <div className="bg-card/50 ring-border/40 flex flex-col items-center justify-center rounded-2xl py-16 ring-1 backdrop-blur-sm">
              <Users className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="text-foreground text-lg font-semibold">No artists yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Artists signed to your label will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-card/50 ring-border/40 hover:bg-card/70 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm transition-colors"
                >
                  {/* Cover / Photo */}
                  <div className="relative h-32 w-full overflow-hidden">
                    {artist.coverImage ? (
                      <Image
                        src={artist.coverImage}
                        alt={artist.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-full w-full items-center justify-center">
                        <User className="text-muted-foreground h-10 w-10" />
                      </div>
                    )}
                    {artist.verified && (
                      <Badge className="absolute top-2 right-2 bg-blue-500/90 text-[10px] text-white">
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Artist photo overlay */}
                  <div className="relative px-4 pb-4">
                    <div className="-mt-8 mb-3">
                      {artist.photo ? (
                        <Image
                          src={artist.photo}
                          alt={artist.name}
                          width={56}
                          height={56}
                          className="border-background h-14 w-14 rounded-full border-2 object-cover"
                        />
                      ) : (
                        <div className="border-background bg-muted flex h-14 w-14 items-center justify-center rounded-full border-2">
                          <User className="text-muted-foreground h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <h3 className="text-foreground truncate text-sm font-bold">{artist.name}</h3>
                    {artist.genre && (
                      <p className="text-muted-foreground mt-0.5 text-xs">{artist.genre}</p>
                    )}

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Music className="text-muted-foreground h-3.5 w-3.5" />
                        <span className="text-muted-foreground text-xs">
                          {artist._count.music} track{artist._count.music !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Disc3 className="text-muted-foreground h-3.5 w-3.5" />
                        <span className="text-muted-foreground text-xs">
                          {artist._count.albums} album{artist._count.albums !== 1 ? "s" : ""}
                        </span>
                      </div>
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
