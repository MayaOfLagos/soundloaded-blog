import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Calendar, ChevronRight, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostBody } from "@/components/blog/PostBody";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { CommentSection } from "@/components/blog/CommentSection";
import { JsonLd } from "@/components/common/JsonLd";
import { buildNewsArticleSchema, buildBreadcrumbSchema } from "@/lib/structured-data";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { DetailLayout } from "./DetailLayout";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import type { DetailPageProps } from "./types";

function SidebarSkeleton() {
  return <div className="bg-muted/50 h-64 animate-pulse rounded-2xl" />;
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

  return (
    <>
      <JsonLd schema={[articleSchema, breadcrumbSchema]} />
      <DetailLayout
        sidebar={
          <>
            <Suspense fallback={<SidebarSkeleton />}>
              <TrendingSidebar />
            </Suspense>
            <Suspense fallback={<SidebarSkeleton />}>
              <PopularMusicSidebar />
            </Suspense>
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

          {/* Video hero — cover image with play overlay */}
          {post.coverImage && (
            <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-xl">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 800px"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="bg-brand/90 flex h-16 w-16 items-center justify-center rounded-full shadow-lg">
                  <Play className="h-7 w-7 fill-white text-white" />
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-foreground mt-5 text-2xl leading-tight font-black sm:text-3xl">
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-4 text-sm">
            {post.author.name && (
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={post.author.image ?? undefined} />
                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-foreground font-medium">{post.author.name}</span>
              </div>
            )}
            {post.publishedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <time dateTime={post.publishedAt.toISOString()}>
                  {formatDate(post.publishedAt, settings.dateFormat)}
                </time>
                <span className="text-muted-foreground/60">
                  ({formatRelativeDate(post.publishedAt)})
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>{post.views.toLocaleString()} views</span>
            </div>
          </div>

          {/* Share */}
          <div className="mt-4">
            <ShareButtons url={articleUrl} title={post.title} />
          </div>

          {/* Article body — may contain embedded video iframes */}
          <div className="prose prose-zinc dark:prose-invert mt-8 max-w-none [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl">
            <PostBody body={post.body} />
          </div>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-xl font-bold">More Videos</h2>
              <RelatedPosts posts={related} />
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
