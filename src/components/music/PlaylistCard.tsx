"use client";

import Link from "next/link";
import { Play, Lock, Globe } from "lucide-react";
import { CoverImage } from "@/components/common/CoverImage";
import { FallbackCover } from "@/components/common/FallbackCover";
import { cn } from "@/lib/utils";
import type { PlaylistSummary } from "@/hooks/usePlaylist";

interface PlaylistCardProps {
  playlist: PlaylistSummary;
  className?: string;
  /** Show creator name below track count */
  showCreator?: boolean;
  /** Show privacy badge (lock/globe icon) */
  showPrivacy?: boolean;
  /** Link to public page instead of library page */
  publicLink?: boolean;
}

export function PlaylistCard({
  playlist,
  className,
  showCreator,
  showPrivacy,
  publicLink,
}: PlaylistCardProps) {
  const covers = playlist.coverArts.filter(Boolean).slice(0, 4);
  const href =
    publicLink || showCreator ? `/playlists/${playlist.id}` : `/library/playlists/${playlist.id}`;

  return (
    <Link
      href={href}
      className={cn("group/card hover:bg-muted/50 rounded-lg p-3 transition-colors", className)}
    >
      {/* Cover art */}
      <div className="bg-muted relative aspect-square overflow-hidden rounded-md">
        {playlist.coverImage ? (
          <CoverImage
            src={playlist.coverImage}
            alt={playlist.title}
            fill
            className="object-cover transition-transform duration-300 group-hover/card:scale-105"
            sizes="(max-width: 640px) 150px, (max-width: 1024px) 180px, 200px"
          />
        ) : covers.length >= 4 ? (
          <div className="grid h-full w-full grid-cols-2 grid-rows-2">
            {covers.map((src, i) => (
              <div key={i} className="relative overflow-hidden">
                <CoverImage src={src!} alt="" fill className="object-cover" sizes="100px" />
              </div>
            ))}
          </div>
        ) : covers.length > 0 ? (
          <CoverImage
            src={covers[0]!}
            alt={playlist.title}
            fill
            className="object-cover transition-transform duration-300 group-hover/card:scale-105"
            sizes="(max-width: 640px) 150px, (max-width: 1024px) 180px, 200px"
          />
        ) : (
          <FallbackCover size="md" />
        )}

        {/* Privacy badge */}
        {showPrivacy && (
          <div className="bg-background/80 absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full backdrop-blur-sm">
            {playlist.isPublic ? (
              <Globe className="text-muted-foreground h-3 w-3" />
            ) : (
              <Lock className="text-muted-foreground h-3 w-3" />
            )}
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover/card:bg-black/30 group-hover/card:opacity-100">
          <div className="bg-brand text-brand-foreground flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform duration-150 hover:scale-110">
            <Play className="ml-0.5 h-5 w-5" fill="currentColor" strokeWidth={0} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 min-w-0">
        <p className="text-foreground group-hover/card:text-brand truncate text-sm font-bold transition-colors">
          {playlist.title}
        </p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {playlist.trackCount} track{playlist.trackCount !== 1 ? "s" : ""}
          {showCreator &&
            "creator" in playlist &&
            (playlist as PlaylistSummary & { creator?: { name?: string | null } }).creator
              ?.name && (
              <>
                {" "}
                &middot;{" "}
                {
                  (playlist as PlaylistSummary & { creator?: { name?: string | null } }).creator!
                    .name
                }
              </>
            )}
        </p>
      </div>
    </Link>
  );
}
