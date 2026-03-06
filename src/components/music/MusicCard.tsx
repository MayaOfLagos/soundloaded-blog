"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatFileSize } from "@/lib/utils";
import { DownloadButton } from "./DownloadButton";
import { usePlayerStore } from "@/store/player.store";
import type { MusicCardData } from "@/lib/api/music";

interface MusicCardProps {
  track: MusicCardData;
  className?: string;
}

export function MusicCard({ track, className }: MusicCardProps) {
  const { setTrack } = usePlayerStore();

  const handlePlay = () => {
    setTrack({
      id: track.id,
      title: track.title,
      artist: track.artistName,
      coverArt: track.coverArt ?? null,
      r2Key: "",
      duration: 0,
      slug: track.slug,
    });
  };

  return (
    <div
      className={cn(
        "group border-border bg-card hover:border-brand/30 flex flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-sm",
        className
      )}
    >
      {/* Album art */}
      <Link
        href={`/music/${track.slug}`}
        className="bg-muted relative block aspect-square overflow-hidden"
      >
        {track.coverArt ? (
          <Image
            src={track.coverArt}
            alt={track.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="from-brand/10 to-muted flex h-full items-center justify-center bg-gradient-to-br">
            <Music className="text-muted-foreground/50 h-12 w-12" />
          </div>
        )}

        {/* Play overlay */}
        <button
          onClick={(e) => {
            e.preventDefault();
            handlePlay();
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label={`Play ${track.title}`}
        >
          <div className="bg-brand text-brand-foreground flex h-12 w-12 items-center justify-center rounded-full shadow-lg">
            <Play className="ml-0.5 h-5 w-5" />
          </div>
        </button>

        {/* Genre badge */}
        {track.genre && (
          <div className="absolute top-2 left-2">
            <Badge className="border-0 bg-black/70 text-[10px] text-white">{track.genre}</Badge>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <Link href={`/music/${track.slug}`} className="group/title">
          <p className="text-foreground group-hover/title:text-brand line-clamp-1 text-sm font-bold transition-colors">
            {track.title}
          </p>
        </Link>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">{track.artistName}</p>

        <div className="mt-2 flex items-center justify-between gap-2">
          {track.fileSize && (
            <span className="text-muted-foreground text-[10px]">
              {formatFileSize(track.fileSize)}
            </span>
          )}
          <DownloadButton
            musicId={track.id}
            title={track.title}
            enabled={track.enableDownload}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
