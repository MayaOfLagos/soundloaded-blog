import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getPostById } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { getPostUrl, resolveSlugFromSegments, usesPostId } from "@/lib/urls";
import { PostPageContent } from "@/components/blog/PostPageContent";

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

  const currentPath = "/" + segments.join("/");

  return <PostPageContent post={post} settings={settings} currentPath={currentPath} />;
}
