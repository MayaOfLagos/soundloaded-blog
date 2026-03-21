import Link from "next/link";
import Image from "next/image";
import { Play, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatRelativeDate } from "@/lib/utils";
import { VideoCardMoreButton } from "./VideoCardMoreButton";
import type { PostCardData } from "./PostCard";

interface VideoCardProps {
  post: PostCardData;
  className?: string;
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function VideoCard({ post, className }: VideoCardProps) {
  const href = post.href || `/${post.slug}`;

  return (
    <div className={cn("group", className)}>
      {/* Thumbnail — YouTube 16:9 */}
      <Link href={href} className="relative block overflow-hidden rounded-xl">
        <div className="relative aspect-video overflow-hidden bg-black">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800">
              <Play className="h-10 w-10 text-white/20" />
            </div>
          )}

          {/* Hover overlay + play */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/30">
            <div className="flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-black/70 opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
              <Play className="h-5 w-5 fill-white text-white" />
            </div>
          </div>

          {/* Duration badge — bottom right */}
          {post.readingTime && (
            <div className="absolute right-1.5 bottom-1.5 flex items-center gap-0.5 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
              <Clock className="h-2.5 w-2.5" />
              {post.readingTime}:{String(0).padStart(2, "0")}
            </div>
          )}
        </div>
      </Link>

      {/* Metadata — YouTube style: avatar | title + channel + stats */}
      <div className="mt-3 flex gap-3">
        {/* Author avatar */}
        <Link href={href} className="flex-shrink-0">
          <Avatar className="h-9 w-9">
            <AvatarImage src={post.author?.avatar ?? undefined} />
            <AvatarFallback className="bg-muted text-[11px] font-bold">
              {post.author?.name?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Text column */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <Link href={href} className="min-w-0 flex-1">
              <h3 className="text-foreground group-hover:text-brand line-clamp-2 text-[14px] leading-snug font-semibold transition-colors">
                {post.title}
              </h3>
            </Link>
            <VideoCardMoreButton videoUrl={href} videoTitle={post.title} />
          </div>
          {post.author && (
            <p className="text-muted-foreground hover:text-foreground mt-1 truncate text-[12px] transition-colors">
              {post.author.name}
            </p>
          )}
          <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[12px]">
            {post.viewCount !== undefined && post.viewCount > 0 && (
              <>
                <span>{formatViewCount(post.viewCount)} views</span>
                <span>·</span>
              </>
            )}
            <span>{formatRelativeDate(post.publishedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
