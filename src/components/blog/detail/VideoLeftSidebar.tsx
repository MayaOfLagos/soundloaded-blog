import Link from "next/link";
import Image from "next/image";
import { Play, TrendingUp, Clock, FolderOpen, Sparkles } from "lucide-react";
import {
  getTrendingVideoPosts,
  getRecentVideoPosts,
  getVideoCategories,
  getMixedContent,
} from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { formatRelativeDate } from "@/lib/utils";
import type { PostCardData } from "@/components/blog/PostCard";

interface SidebarSectionProps {
  icon: React.ReactNode;
  title: string;
  posts: PostCardData[];
  ranked?: boolean;
}

function SidebarSection({ icon, title, posts, ranked }: SidebarSectionProps) {
  if (posts.length === 0) return null;

  return (
    <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
      {/* Header */}
      <div className="border-border/50 flex items-center gap-2 border-b px-4 py-3">
        <div className="bg-brand/10 flex h-7 w-7 items-center justify-center rounded-lg">
          {icon}
        </div>
        <h3 className="text-foreground text-sm font-bold">{title}</h3>
      </div>

      <div className="divide-border/30 divide-y">
        {posts.map((post, idx) => (
          <Link
            key={post.id}
            href={post.href || `/${post.slug}`}
            className="group hover:bg-muted/50 flex items-start gap-3 px-4 py-3 transition-colors"
          >
            {/* Rank badge */}
            {ranked && (
              <span className="from-brand/10 to-brand/5 text-brand flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-xs font-black">
                {idx + 1}
              </span>
            )}

            {/* Thumbnail — 16:9 mini */}
            <div className="bg-muted relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg">
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
                  <Play className="h-3 w-3 text-white/40" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-foreground group-hover:text-brand line-clamp-2 text-[12px] leading-snug font-semibold transition-colors">
                {post.title}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[10px]">
                {formatRelativeDate(post.publishedAt)}
                {post.viewCount !== undefined && post.viewCount > 0 && (
                  <span className="ml-1.5">{post.viewCount.toLocaleString()} views</span>
                )}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface VideoLeftSidebarProps {
  excludePostId?: string;
}

export async function VideoLeftSidebar({ excludePostId }: VideoLeftSidebarProps) {
  const settings = await getSettings();
  const ps = settings.permalinkStructure;

  const [trending, recent, categories, mixed] = await Promise.all([
    getTrendingVideoPosts({ limit: 5, excludeId: excludePostId, permalinkStructure: ps }),
    getRecentVideoPosts({ limit: 5, excludeId: excludePostId, permalinkStructure: ps }),
    getVideoCategories(),
    getMixedContent({ limit: 5, permalinkStructure: ps }),
  ]);

  return (
    <div className="space-y-5">
      {/* Trending Videos — Ranked */}
      <SidebarSection
        icon={<TrendingUp className="text-brand h-3.5 w-3.5" />}
        title="Trending Videos"
        posts={trending}
        ranked
      />

      {/* Latest Videos — This Week */}
      <SidebarSection
        icon={<Clock className="text-brand h-3.5 w-3.5" />}
        title="Latest Videos"
        posts={recent}
      />

      {/* Video Categories */}
      {categories.length > 0 && (
        <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
          <div className="border-border/50 flex items-center gap-2 border-b px-4 py-3">
            <div className="bg-brand/10 flex h-7 w-7 items-center justify-center rounded-lg">
              <FolderOpen className="text-brand h-3.5 w-3.5" />
            </div>
            <h3 className="text-foreground text-sm font-bold">Categories</h3>
          </div>
          <div className="divide-border/30 divide-y">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/videos?category=${cat.slug}`}
                className="hover:bg-muted/50 flex items-center justify-between px-4 py-2.5 transition-colors"
              >
                <span className="text-foreground hover:text-brand text-[13px] font-medium transition-colors">
                  {cat.name}
                </span>
                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold">
                  {cat.postCount}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mixed Content — Other Types */}
      <SidebarSection
        icon={<Sparkles className="text-brand h-3.5 w-3.5" />}
        title="More to Watch"
        posts={mixed}
      />
    </div>
  );
}
