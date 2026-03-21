import Link from "next/link";
import Image from "next/image";
import { Users, Disc3, Music, Edit, BarChart3, Building2 } from "lucide-react";
import { db } from "@/lib/db";

type LabelProfile = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  logo: string | null;
  verified: boolean;
  _count: { artists: number };
};

export async function LabelDashboard({ label }: { label: LabelProfile; userId?: string }) {
  // Fetch label-specific stats
  const [totalTracks, totalDownloads, recentArtists] = await Promise.all([
    db.music.count({ where: { artist: { labelId: label.id } } }),
    db.download.count({ where: { music: { artist: { labelId: label.id } } } }),
    db.artist.findMany({
      where: { labelId: label.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        photo: true,
        genre: true,
        _count: { select: { music: true } },
      },
    }),
  ]);

  const stats = [
    {
      label: "Artists",
      value: label._count.artists,
      icon: Users,
      gradient: "from-rose-500 to-rose-600",
    },
    {
      label: "Total Tracks",
      value: totalTracks,
      icon: Music,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Downloads",
      value: totalDownloads,
      icon: BarChart3,
      gradient: "from-amber-500 to-amber-600",
    },
  ];

  return (
    <main className="min-w-0 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-foreground text-2xl font-black">Label Dashboard</h1>
          {label.verified && (
            <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[10px] font-bold">
              Verified
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          Managing <strong>{label.name}</strong>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label: l, value, icon: Icon, gradient }) => (
          <div
            key={l}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg`}
          >
            <p className="text-3xl font-black">{value}</p>
            <p className="mt-1 text-sm font-medium text-white/80">{l}</p>
            <Icon className="absolute -right-2 -bottom-2 h-20 w-20 text-white/15" />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/label-artists"
          className="bg-card/50 ring-border/40 hover:bg-brand/5 flex items-center gap-3 rounded-2xl p-5 ring-1 backdrop-blur-sm transition-colors"
        >
          <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
            <Users className="text-brand h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-sm font-bold">Manage Artists</p>
            <p className="text-muted-foreground text-xs">{label._count.artists} artists</p>
          </div>
        </Link>
        <Link
          href="/dashboard/releases"
          className="bg-card/50 ring-border/40 hover:bg-brand/5 flex items-center gap-3 rounded-2xl p-5 ring-1 backdrop-blur-sm transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Disc3 className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-foreground text-sm font-bold">Releases</p>
            <p className="text-muted-foreground text-xs">{totalTracks} tracks</p>
          </div>
        </Link>
        <Link
          href="/dashboard/label-profile"
          className="bg-card/50 ring-border/40 hover:bg-brand/5 flex items-center gap-3 rounded-2xl p-5 ring-1 backdrop-blur-sm transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Edit className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-foreground text-sm font-bold">Edit Profile</p>
            <p className="text-muted-foreground text-xs">Update label info</p>
          </div>
        </Link>
      </div>

      {/* Artist Roster */}
      <div className="bg-card/50 ring-border/40 rounded-2xl p-5 ring-1 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="text-brand h-4 w-4" />
            <h2 className="text-foreground text-sm font-bold">Artist Roster</h2>
          </div>
          <Link
            href="/dashboard/label-artists"
            className="text-brand text-xs font-medium hover:underline"
          >
            View all
          </Link>
        </div>

        {recentArtists.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="text-muted-foreground mx-auto h-10 w-10" />
            <p className="text-muted-foreground mt-2 text-sm">No artists on your roster yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentArtists.map((artist) => (
              <div key={artist.id} className="flex items-center gap-3">
                {artist.photo ? (
                  <Image
                    src={artist.photo}
                    alt={artist.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold">
                    {artist.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">{artist.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {artist.genre ?? "—"} · {artist._count.music} tracks
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
