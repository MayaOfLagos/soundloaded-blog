import Link from "next/link";
import Image from "next/image";
import { Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
}

interface PostCardProps {
  post: PostCardData;
  variant?: "default" | "featured" | "compact";
  className?: string;
}

export function PostCard({ post, variant = "default", className }: PostCardProps) {
  const href = `/${post.slug}`;

  if (variant === "compact") {
    return (
      <Link href={href} className={cn("group flex gap-3 py-3", className)}>
        <div className="bg-muted relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="80px"
            />
          ) : (
            <div className="bg-muted flex h-full items-center justify-center">
              <span className="text-2xl">🎵</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground group-hover:text-brand line-clamp-2 text-sm font-semibold transition-colors">
            {post.title}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {formatRelativeDate(post.publishedAt)}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link
        href={href}
        className={cn(
          "group bg-card border-border hover:border-brand/30 relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300",
          className
        )}
      >
        {/* Cover image — tall on featured */}
        <div className="bg-muted relative aspect-[16/9] overflow-hidden sm:aspect-[16/10]">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 60vw"
              priority
            />
          ) : (
            <div className="from-brand/20 to-muted flex h-full items-center justify-center bg-gradient-to-br">
              <span className="text-5xl">🎵</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Category badge over image */}
          {post.category && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-brand text-brand-foreground text-xs font-semibold tracking-wide uppercase">
                {post.category.name}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h2 className="text-foreground group-hover:text-brand line-clamp-3 text-lg font-bold transition-colors sm:text-xl">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{post.excerpt}</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            {post.author && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={post.author.avatar ?? undefined} alt={post.author.name} />
                  <AvatarFallback className="text-[10px]">
                    {post.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground text-xs">{post.author.name}</span>
              </div>
            )}
            <div className="text-muted-foreground ml-auto flex items-center gap-3 text-xs">
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
      </Link>
    );
  }

  // Default card
  return (
    <Link
      href={href}
      className={cn(
        "group bg-card border-border hover:border-brand/30 flex flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-sm",
        className
      )}
    >
      {/* Cover image */}
      <div className="bg-muted relative aspect-[16/9] overflow-hidden">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="from-brand/10 to-muted flex h-full items-center justify-center bg-gradient-to-br">
            <span className="text-3xl">🎵</span>
          </div>
        )}
        {post.category && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-brand text-brand-foreground px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
              {post.category.name}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="text-foreground group-hover:text-brand line-clamp-2 text-sm font-bold transition-colors sm:text-base">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-muted-foreground mt-1.5 line-clamp-2 hidden text-xs sm:block">
            {post.excerpt}
          </p>
        )}

        <div className="text-muted-foreground mt-3 flex items-center gap-2 text-[11px]">
          {post.author && <span className="text-foreground font-medium">{post.author.name}</span>}
          <span className="ml-auto">{formatRelativeDate(post.publishedAt)}</span>
          {post.readingTime && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {post.readingTime}m
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
