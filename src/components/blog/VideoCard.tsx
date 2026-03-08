import Link from "next/link";
import Image from "next/image";
import { Play, Eye, Clock } from "lucide-react";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { PostCardData } from "./PostCard";

interface VideoCardProps {
  post: PostCardData;
  className?: string;
}

export function VideoCard({ post, className }: VideoCardProps) {
  const href = post.href || `/${post.slug}`;

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl transition-all duration-300",
        "bg-card/50 ring-border/40 ring-1 backdrop-blur-sm",
        "hover:ring-brand/30 hover:shadow-brand/5 hover:shadow-lg",
        className
      )}
    >
      {/* Thumbnail with play overlay */}
      <div className="relative aspect-video overflow-hidden">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="from-brand/10 to-muted flex h-full items-center justify-center bg-gradient-to-br">
            <Play className="text-muted-foreground/40 h-12 w-12" />
          </div>
        )}

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/30" />

        {/* Play button — appears on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <Play className="h-6 w-6 fill-current text-black" />
          </div>
        </div>

        {/* Duration badge (using readingTime as proxy) */}
        {post.readingTime && (
          <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            <Clock className="h-2.5 w-2.5" />
            {post.readingTime}m
          </div>
        )}

        {/* Video badge top-left */}
        <div className="absolute top-2.5 left-2.5">
          <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase shadow">
            <Play className="h-2.5 w-2.5 fill-current" />
            Video
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="text-foreground group-hover:text-brand line-clamp-2 text-[15px] leading-snug font-bold transition-colors">
          {post.title}
        </h3>

        <div className="text-muted-foreground mt-auto flex items-center gap-2 pt-3 text-[11px]">
          {post.author && (
            <span className="text-foreground/80 font-semibold">{post.author.name}</span>
          )}
          <span className="ml-auto">{formatRelativeDate(post.publishedAt)}</span>
          {post.viewCount !== undefined && post.viewCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Eye className="h-3 w-3" />
              {post.viewCount.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
