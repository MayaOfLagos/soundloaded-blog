import Link from "next/link";
import Image from "next/image";
import { Clock, Eye } from "lucide-react";
import { cn, formatRelativeDate } from "@/lib/utils";

export interface PostCardData {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  publishedAt: string | Date;
  readingTime?: number | null;
  viewCount?: number;
  category?: { name: string; slug: string; color?: string } | null;
  author?: { name: string; avatar?: string | null } | null;
  /** Pre-computed permalink URL. Falls back to `/${slug}` if not set. */
  href?: string;
}

interface PostCardProps {
  post: PostCardData;
  variant?: "default" | "featured" | "compact";
  className?: string;
}

export function PostCard({ post, variant = "default", className }: PostCardProps) {
  const href = post.href || `/${post.slug}`;

  /* ━━━ COMPACT — sidebar / list items ━━━ */
  if (variant === "compact") {
    return (
      <Link href={href} className={cn("group flex gap-3 py-3", className)}>
        <div className="bg-muted relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="80px"
            />
          ) : (
            <div className="from-brand/20 to-muted flex h-full items-center justify-center bg-gradient-to-br">
              <span className="text-lg">🎵</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground group-hover:text-brand line-clamp-2 text-[13px] leading-snug font-semibold transition-colors">
            {post.title}
          </p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            {formatRelativeDate(post.publishedAt)}
          </p>
        </div>
      </Link>
    );
  }

  /* ━━━ FEATURED — hero card ━━━ */
  if (variant === "featured") {
    return (
      <Link
        href={href}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-3xl transition-all duration-500",
          "ring-border/50 hover:ring-brand/40 ring-1",
          className
        )}
      >
        <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[21/9]">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 70vw"
              priority
            />
          ) : (
            <div className="from-brand/30 via-background to-muted flex h-full items-center justify-center bg-gradient-to-br">
              <span className="text-6xl opacity-50">🎵</span>
            </div>
          )}

          {/* Multi-stop gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

          {/* Category pill */}
          {post.category && (
            <div className="absolute top-4 left-4">
              <span className="bg-brand shadow-brand/30 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase shadow-lg">
                {post.category.name}
              </span>
            </div>
          )}

          {/* Content overlay at bottom */}
          <div className="absolute right-0 bottom-0 left-0 p-5 sm:p-7">
            <h2 className="line-clamp-3 text-xl leading-tight font-extrabold text-white drop-shadow-lg sm:text-2xl lg:text-3xl">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="mt-2 line-clamp-2 hidden text-sm text-white/70 sm:block">
                {post.excerpt}
              </p>
            )}

            <div className="mt-4 flex items-center gap-3">
              {post.author && (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white backdrop-blur-sm">
                    {post.author.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-white/80">{post.author.name}</span>
                </div>
              )}
              <div className="ml-auto flex items-center gap-3 text-[11px] text-white/60">
                {post.readingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readingTime}m
                  </span>
                )}
                {post.viewCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.viewCount.toLocaleString()}
                  </span>
                )}
                <time>{formatRelativeDate(post.publishedAt)}</time>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  /* ━━━ DEFAULT — feed card ━━━ */
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
      <div className="relative aspect-[16/9] overflow-hidden">
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
            <span className="text-3xl opacity-60">🎵</span>
          </div>
        )}
        {post.category && (
          <div className="absolute top-2.5 left-2.5">
            <span className="rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-md">
              {post.category.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="text-foreground group-hover:text-brand line-clamp-2 text-[15px] leading-snug font-bold transition-colors">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-muted-foreground mt-1.5 line-clamp-2 hidden text-xs leading-relaxed sm:block">
            {post.excerpt}
          </p>
        )}

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
