import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PostBody } from "@/components/blog/PostBody";
import { PostDownloadButton } from "@/components/blog/PostDownloadButton";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { CommentSection } from "@/components/blog/CommentSection";
import { JsonLd } from "@/components/common/JsonLd";
import { buildNewsArticleSchema, buildBreadcrumbSchema } from "@/lib/structured-data";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { DetailLayout } from "./DetailLayout";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { NewsletterSidebarCard } from "./NewsletterSidebarCard";
import type { DetailPageProps } from "./types";

function SidebarSkeleton() {
  return <div className="bg-muted/50 h-64 animate-pulse rounded-2xl" />;
}

export function GistPostDetail({ post, settings, related, articleUrl }: DetailPageProps) {
  const articleSchema = buildNewsArticleSchema(
    post,
    settings.siteUrl,
    settings.siteName,
    articleUrl
  );
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Gist", url: "/gist" },
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
            <Link href="/gist" className="hover:text-foreground transition-colors">
              Gist
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground line-clamp-1 font-medium">{post.title}</span>
          </nav>

          {/* Category badge */}
          {post.category && (
            <Badge className="bg-brand text-brand-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              {post.category.name}
            </Badge>
          )}

          {/* Bold title */}
          <h1 className="text-foreground text-3xl leading-tight font-black lg:text-4xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-muted-foreground mt-3 text-lg leading-relaxed">{post.excerpt}</p>
          )}

          {/* Share buttons at top — gossip content needs share-first UX */}
          <div className="mt-4">
            <ShareButtons url={articleUrl} title={post.title} />
          </div>

          {/* Full-width cover image */}
          {post.coverImage && (
            <div className="bg-muted relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          )}

          {/* Author + date row */}
          <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-4 text-sm">
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

          {/* Article body */}
          <div className="prose prose-zinc dark:prose-invert mt-8 max-w-none">
            <PostBody body={post.body} />
          </div>

          {settings.enableDownloads && post.enableDownload && post.downloadMedia && (
            <div className="mt-8">
              <PostDownloadButton
                postId={post.id}
                title={post.title}
                label={post.downloadLabel || `Download ${post.downloadMedia.filename}`}
              />
            </div>
          )}

          {/* Share buttons again at bottom */}
          <div className="border-border mt-8 border-t pt-6">
            <ShareButtons url={articleUrl} title={post.title} />
          </div>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-xl font-bold">More Gist</h2>
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
