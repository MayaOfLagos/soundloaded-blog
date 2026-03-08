import { Suspense } from "react";
import { PostHero } from "@/components/blog/PostHero";
import { PostBody } from "@/components/blog/PostBody";
import { PostDownloadButton } from "@/components/blog/PostDownloadButton";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { CommentSection } from "@/components/blog/CommentSection";
import { JsonLd } from "@/components/common/JsonLd";
import { buildNewsArticleSchema, buildBreadcrumbSchema } from "@/lib/structured-data";
import { DetailLayout } from "./DetailLayout";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import { NewsletterSidebarCard } from "./NewsletterSidebarCard";
import type { DetailPageProps } from "./types";

function SidebarSkeleton() {
  return <div className="bg-muted/50 h-64 animate-pulse rounded-2xl" />;
}

export function NewsPostDetail({ post, settings, related, articleUrl }: DetailPageProps) {
  const articleSchema = buildNewsArticleSchema(
    post,
    settings.siteUrl,
    settings.siteName,
    articleUrl
  );
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      ...(post.category
        ? [{ name: post.category.name, url: `/${settings.categoryBase}/${post.category.slug}` }]
        : []),
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
            <NewsletterSidebarCard />
          </>
        }
      >
        <article>
          <PostHero post={post} dateFormat={settings.dateFormat} />

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

          <div className="border-border mt-8 border-t pt-6">
            <ShareButtons url={articleUrl} title={post.title} />
          </div>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-xl font-bold">Related Articles</h2>
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
