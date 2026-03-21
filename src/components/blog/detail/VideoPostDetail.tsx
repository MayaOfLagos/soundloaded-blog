import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ChevronRight, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PostBody } from "@/components/blog/PostBody";
import { PostCard } from "@/components/blog/PostCard";
import { VideoCard } from "@/components/blog/VideoCard";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { CommentSection } from "@/components/blog/CommentSection";
import { JsonLd } from "@/components/common/JsonLd";
import { buildNewsArticleSchema, buildBreadcrumbSchema } from "@/lib/structured-data";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { DetailLayout } from "./DetailLayout";
import { VideoLeftSidebar } from "./VideoLeftSidebar";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { NewsletterSidebarCard } from "./NewsletterSidebarCard";
import type { DetailPageProps } from "./types";

function SidebarSkeleton() {
  return <div className="bg-muted/50 h-64 animate-pulse rounded-2xl" />;
}

function LeftSidebarSkeleton() {
  return (
    <div className="space-y-5">
      <div className="bg-muted/50 h-72 animate-pulse rounded-2xl" />
      <div className="bg-muted/50 h-56 animate-pulse rounded-2xl" />
    </div>
  );
}

export function VideoPostDetail({ post, settings, related, articleUrl }: DetailPageProps) {
  const articleSchema = buildNewsArticleSchema(
    post,
    settings.siteUrl,
    settings.siteName,
    articleUrl
  );
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Videos", url: "/videos" },
      { name: post.title, url: articleUrl },
    ],
    settings.siteUrl
  );

  // Split related: first 3 for grid, rest for compact list
  const gridPosts = related.slice(0, 3);
  const listPosts = related.slice(3);

  return (
    <>
      <JsonLd schema={[articleSchema, breadcrumbSchema]} />
      <DetailLayout
        leftSidebar={
          <Suspense fallback={<LeftSidebarSkeleton />}>
            <VideoLeftSidebar excludePostId={post.id} />
          </Suspense>
        }
        sidebar={
          <>
            <Suspense fallback={<SidebarSkeleton />}>
              <TrendingSidebar />
            </Suspense>
            <NewsletterSidebarCard />
          </>
        }
      >
        <article>
          {/* Breadcrumb */}
          <nav
            className="text-muted-foreground mb-4 flex items-center gap-1.5 text-sm"
            aria-label="breadcrumb"
          >
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/videos" className="hover:text-foreground transition-colors">
              Videos
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground line-clamp-1 font-medium">{post.title}</span>
          </nav>

          {/* Video hero — cover image with cinematic play overlay */}
          {post.coverImage && (
            <div className="group/video relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 800px"
              />
              {/* Cinematic overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

              {/* Center play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-md transition-all duration-300 group-hover/video:scale-110 group-hover/video:border-white/50 group-hover/video:bg-white/20 sm:h-20 sm:w-20">
                  <Play className="h-7 w-7 fill-current text-white sm:h-8 sm:w-8" />
                </div>
              </div>

              {/* Video badge — top left */}
              <div className="absolute top-3 left-3">
                <span className="flex items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase shadow-lg">
                  <Play className="h-3 w-3 fill-current" />
                  Video
                </span>
              </div>

              {/* View count — top right */}
              {post.views > 0 && (
                <div className="absolute top-3 right-3">
                  <span className="flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm">
                    <Eye className="h-3 w-3" />
                    {post.views.toLocaleString()} views
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Category badge */}
          {post.category && (
            <Badge className="bg-brand text-brand-foreground mt-4 text-xs font-semibold tracking-wide uppercase">
              {post.category.name}
            </Badge>
          )}

          {/* Title */}
          <h1 className="text-foreground mt-3 text-2xl leading-tight font-black sm:text-3xl">
            {post.title}
          </h1>

          {/* Author + meta row — YouTube style */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {post.author.name && (
              <div className="flex items-center gap-2.5">
                <Avatar className="ring-border h-9 w-9 ring-2">
                  <AvatarImage src={post.author.image ?? undefined} />
                  <AvatarFallback className="bg-muted text-xs font-bold">
                    {post.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-foreground text-sm font-semibold">{post.author.name}</p>
                  {post.publishedAt && (
                    <p className="text-muted-foreground text-[11px]">
                      {formatDate(post.publishedAt, settings.dateFormat)}
                      {" · "}
                      {formatRelativeDate(post.publishedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="text-muted-foreground ml-auto flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span>{post.views.toLocaleString()} views</span>
              </div>
            </div>
          </div>

          {/* Share buttons */}
          <div className="mt-4">
            <ShareButtons url={articleUrl} title={post.title} />
          </div>

          {/* Article body — may contain embedded video iframes */}
          <div className="prose prose-zinc dark:prose-invert mt-8 max-w-none [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl">
            <PostBody body={post.body} />
          </div>

          {/* Share again at bottom */}
          <div className="border-border mt-8 border-t pt-6">
            <ShareButtons url={articleUrl} title={post.title} />
          </div>

          {/* More Videos — 3 column grid */}
          {gridPosts.length > 0 && (
            <section className="mt-12">
              <h2 className="text-foreground mb-4 text-xl font-bold">More Videos</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((p) => (
                  <VideoCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}

          {/* Related Contents — list style */}
          {listPosts.length > 0 && (
            <section className="mt-10">
              <h2 className="text-foreground mb-2 text-lg font-bold">Related Contents</h2>
              <div className="border-border divide-border divide-y border-t">
                {listPosts.map((p) => (
                  <PostCard key={p.id} post={p} variant="compact" />
                ))}
              </div>
            </section>
          )}

          <section className="mt-12">
            <CommentSection
              postId={post.id}
              enableComments={settings.enableComments}
              requireLoginToComment={settings.requireLoginToComment}
              commentNestingDepth={settings.commentNestingDepth}
              closeCommentsAfterDays={settings.closeCommentsAfterDays}
              publishedAt={post.publishedAt?.toISOString() ?? null}
            />
          </section>
        </article>
      </DetailLayout>
    </>
  );
}
