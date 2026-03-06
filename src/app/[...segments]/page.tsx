import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getPostById, getRelatedPosts } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { getPostUrl, resolveSlugFromSegments, usesPostId } from "@/lib/urls";
import { PostHero } from "@/components/blog/PostHero";
import { PostBody } from "@/components/blog/PostBody";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { CommentSection } from "@/components/blog/CommentSection";
import { PostDownloadButton } from "@/components/blog/PostDownloadButton";
import { JsonLd } from "@/components/common/JsonLd";
import { buildNewsArticleSchema, buildBreadcrumbSchema } from "@/lib/structured-data";

interface Props {
  params: Promise<{ segments: string[] }>;
}

/**
 * Resolve a post from URL segments using the configured permalink structure.
 * Falls back to treating the last segment as a plain slug for backwards compat.
 */
async function resolvePost(segments: string[], permalinkStructure: string) {
  // Try structured permalink resolution first
  const resolvedSlug = resolveSlugFromSegments(segments, permalinkStructure);

  if (resolvedSlug) {
    if (usesPostId(permalinkStructure)) {
      return await getPostById(resolvedSlug);
    }
    const post = await getPostBySlug(resolvedSlug);
    if (post) return post;
  }

  // Fallback: if segments is a single item, treat as plain slug
  // This ensures old /{slug} URLs still work
  if (segments.length === 1) {
    return await getPostBySlug(segments[0]);
  }

  // Fallback: try the last segment as a slug (handles format changes)
  const lastSegment = segments[segments.length - 1];
  return await getPostBySlug(lastSegment);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;
  const settings = await getSettings();
  const post = await resolvePost(segments, settings.permalinkStructure);

  if (!post) return { title: "Post Not Found" };

  const canonicalPath = getPostUrl(post, settings.permalinkStructure);

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [{ url: post.coverImage }] : [],
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author.name ? [post.author.name] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
    },
    alternates: { canonical: canonicalPath },
  };
}

export const revalidate = 3600;

export default async function PostPage({ params }: Props) {
  const { segments } = await params;
  const settings = await getSettings();
  const post = await resolvePost(segments, settings.permalinkStructure);

  if (!post) notFound();

  // If the URL doesn't match the canonical permalink, 301 redirect
  const canonicalPath = getPostUrl(post, settings.permalinkStructure);
  const currentPath = "/" + segments.join("/");
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
