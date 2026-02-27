import Link from "next/link";
import Image from "next/image";
import { Download, Music } from "lucide-react";
import { getPopularMusic } from "@/lib/api/music";

export async function PopularMusicSidebar() {
  const tracks = await getPopularMusic({ limit: 5 });

  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="text-brand h-4 w-4" />
          <h3 className="text-foreground text-sm font-bold">Hot Downloads</h3>
        </div>
        <Link href="/music" className="text-brand text-xs hover:underline">
          See all
        </Link>
      </div>

      {tracks.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-xs">No music uploaded yet.</p>
      ) : (
        <div className="space-y-1">
          {tracks.map((track, idx) => (
            <Link
              key={track.id}
              href={`/music/${track.slug}`}
              className="hover:bg-muted group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
            >
              <span className="text-muted-foreground w-4 flex-shrink-0 text-center text-sm font-black">
                {idx + 1}
              </span>

              <div className="bg-muted relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
                {track.coverArt ? (
                  <Image
                    src={track.coverArt}
                    alt={track.title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Music className="text-muted-foreground h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-foreground group-hover:text-brand truncate text-sm font-medium transition-colors">
                  {track.title}
                </p>
                <p className="text-muted-foreground truncate text-xs">{track.artistName}</p>
              </div>

              <div className="text-muted-foreground flex flex-shrink-0 items-center gap-1 text-[11px]">
                <Download className="h-3 w-3" />
                <span>{track.downloadCount.toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
