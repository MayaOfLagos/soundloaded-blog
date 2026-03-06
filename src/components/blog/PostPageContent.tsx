import { redirect } from "next/navigation";
import { getPostUrl } from "@/lib/urls";
import { getRelatedPosts } from "@/lib/api/posts";
import type { PublicSettings } from "@/lib/settings";
import { PostHero } from "@/components/blog/PostHero";
import { PostBody } from "@/components/blog/PostBody";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { CommentSection } from "@/components/blog/CommentSection";
import { PostDownloadButton } from "@/components/blog/PostDownloadButton";
import { JsonLd } from "@/components/common/JsonLd";
import { buildNewsArticleSchema, buildBreadcrumbSchema } from "@/lib/structured-data";

interface PostPageContentProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    body: unknown;
    coverImage: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
    views: number;
    enableDownload: boolean;
    downloadLabel: string | null;
    author: { name: string | null; image: string | null; email: string };
    category: { name: string; slug: string } | null;
    downloadMedia: {
      id: string;
      filename: string;
      r2Key: string;
      type: string;
      mimeType: string;
      size: number;
    } | null;
  };
  settings: PublicSettings;
  currentPath: string;
}

export async function PostPageContent({ post, settings, currentPath }: PostPageContentProps) {
  const canonicalPath = getPostUrl(post, settings.permalinkStructure);

  // If the URL doesn't match the canonical permalink, 301 redirect
  if (currentPath !== canonicalPath) {
    redirect(canonicalPath);
  }

  const related = await getRelatedPosts(
    post.id,
    post.category?.slug,
    4,
    settings.permalinkStructure
  );

  const articleUrl = `${settings.siteUrl}${canonicalPath}`;

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
      { name: post.title, url: canonicalPath },
    ],
    settings.siteUrl
  );

  return (
    <>
      <JsonLd schema={[articleSchema, breadcrumbSchema]} />
      <article className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
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
            <h2 className="mb-4 text-xl font-bold">Related Posts</h2>
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
    </>
  );
}
