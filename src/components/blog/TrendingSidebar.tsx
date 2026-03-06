import Link from "next/link";
import Image from "next/image";
import { TrendingUp } from "lucide-react";
import { getTrendingPosts } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { formatRelativeDate } from "@/lib/utils";

export async function TrendingSidebar() {
  const settings = await getSettings();
  const posts = await getTrendingPosts({
    limit: 5,
    permalinkStructure: settings.permalinkStructure,
  });

  return (
    <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
      {/* Header */}
      <div className="border-border/50 flex items-center gap-2 border-b px-4 py-3">
        <div className="bg-brand/10 flex h-7 w-7 items-center justify-center rounded-lg">
          <TrendingUp className="text-brand h-3.5 w-3.5" />
        </div>
        <h3 className="text-foreground text-sm font-bold">Trending Now</h3>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground px-4 py-8 text-center text-xs">
          No trending posts yet.
        </p>
      ) : (
        <div className="divide-border/30 divide-y">
          {posts.map((post, idx) => (
            <Link
              key={post.id}
              href={post.href || `/${post.slug}`}
              className="group hover:bg-muted/50 flex items-start gap-3 px-4 py-3 transition-colors"
            >
              {/* Rank number */}
              <span className="from-brand/10 to-brand/5 text-brand flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-black">
                {idx + 1}
              </span>

              {/* Cover */}
              <div className="bg-muted relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="56px"
                  />
                ) : (
                  <div className="from-brand/20 to-muted flex h-full items-center justify-center bg-gradient-to-br">
                    <span className="text-sm">🎵</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-foreground group-hover:text-brand line-clamp-2 text-[13px] leading-snug font-semibold transition-colors">
                  {post.title}
                </p>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  {formatRelativeDate(post.publishedAt)}
                  {post.viewCount !== undefined && post.viewCount > 0 && (
                    <span className="ml-2">{post.viewCount.toLocaleString()} views</span>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
