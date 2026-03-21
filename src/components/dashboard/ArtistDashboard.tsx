import Link from "next/link";
import Image from "next/image";
import { Music, Disc3, Users, Upload, Edit, BarChart3 } from "lucide-react";
import { db } from "@/lib/db";
import { format } from "date-fns";

type ArtistProfile = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photo: string | null;
  verified: boolean;
  _count: { music: number; albums: number; artistFollows: number };
};

export async function ArtistDashboard({ artist }: { artist: ArtistProfile; userId?: string }) {
  const [totalDownloads, , recentTracks] = await Promise.all([
    db.download.count({ where: { music: { artistId: artist.id } } }),
    db.music.aggregate({ where: { artistId: artist.id }, _sum: { streamCount: true } }),
    db.music.findMany({
      where: { artistId: artist.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        coverArt: true,
        downloadCount: true,
        streamCount: true,
        createdAt: true,
      },
    }),
  ]);

  const stats = [
    {
      label: "Tracks",
      value: artist._count.music,
      icon: Music,
      gradient: "from-rose-500 to-rose-600",
    },
    {
      label: "Albums",
      value: artist._count.albums,
      icon: Disc3,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Followers",
      value: artist._count.artistFollows,
      icon: Users,
      gradient: "from-amber-500 to-amber-600",
    },
    {
      label: "Downloads",
      value: totalDownloads,
      icon: BarChart3,
      gradient: "from-green-500 to-green-600",
    },
  ];

  return (
    <main className="min-w-0 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-foreground text-2xl font-black">Artist Dashboard</h1>
          {artist.verified && (
            <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[10px] font-bold">
              Verified
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          Managing as <strong>{artist.name}</strong>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, gradient }) => (
          <div
            key={label}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg`}
          >
            <p className="text-3xl font-black">{value}</p>
            <p className="mt-1 text-sm font-medium text-white/80">{label}</p>
            <Icon className="absolute -right-2 -bottom-2 h-20 w-20 text-white/15" />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/music"
          className="bg-card/50 ring-border/40 hover:bg-brand/5 flex items-center gap-3 rounded-2xl p-5 ring-1 backdrop-blur-sm transition-colors"
        >
          <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
            <Upload className="text-brand h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-sm font-bold">Upload Music</p>
            <p className="text-muted-foreground text-xs">Add new tracks</p>
          </div>
        </Link>
        <Link
          href="/dashboard/albums"
          className="bg-card/50 ring-border/40 hover:bg-brand/5 flex items-center gap-3 rounded-2xl p-5 ring-1 backdrop-blur-sm transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Disc3 className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-foreground text-sm font-bold">Manage Albums</p>
            <p className="text-muted-foreground text-xs">{artist._count.albums} albums</p>
          </div>
        </Link>
        <Link
          href="/dashboard/artist-profile"
          className="bg-card/50 ring-border/40 hover:bg-brand/5 flex items-center gap-3 rounded-2xl p-5 ring-1 backdrop-blur-sm transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Edit className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-foreground text-sm font-bold">Edit Profile</p>
            <p className="text-muted-foreground text-xs">Update your info</p>
          </div>
        </Link>
      </div>

      {/* Recent Tracks */}
      <div className="bg-card/50 ring-border/40 rounded-2xl p-5 ring-1 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="text-brand h-4 w-4" />
            <h2 className="text-foreground text-sm font-bold">Recent Tracks</h2>
          </div>
          <Link href="/dashboard/music" className="text-brand text-xs font-medium hover:underline">
            View all
          </Link>
        </div>

        {recentTracks.length === 0 ? (
          <div className="py-8 text-center">
            <Music className="text-muted-foreground mx-auto h-10 w-10" />
            <p className="text-muted-foreground mt-2 text-sm">No tracks uploaded yet</p>
            <Link
              href="/dashboard/music"
              className="text-brand mt-2 inline-block text-sm font-medium hover:underline"
            >
              Upload your first track
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTracks.map((track) => (
              <div key={track.id} className="flex items-center gap-3">
                {track.coverArt ? (
                  <Image
                    src={track.coverArt}
                    alt={track.title}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                    <Music className="text-muted-foreground h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">{track.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {track.downloadCount} downloads · {track.streamCount} streams
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {format(new Date(track.createdAt), "MMM d")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
