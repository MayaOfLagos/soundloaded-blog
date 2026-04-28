import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getPostById } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { getPostUrl, resolveSlugFromSegments, usesPostId } from "@/lib/urls";
import { getPageUrl, getPublishedPageBySlug } from "@/lib/pages";
import { PostPageContent } from "@/components/blog/PostPageContent";
import { PublicPageContent } from "@/components/pages/PublicPageContent";

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
  const pagePath = segments.join("/");
  const page = await getPublishedPageBySlug(pagePath);

  if (page) {
    const title = page.metaTitle || page.title;
    const description = page.metaDescription || page.excerpt || settings.metaDescription;
    const images = page.coverImage ? [{ url: page.coverImage }] : [];

    return {
      title,
      description,
      ...(page.focusKeyword
        ? { keywords: page.focusKeyword.split(",").map((keyword) => keyword.trim()) }
        : {}),
      openGraph: {
        title,
        description,
        images,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      alternates: { canonical: getPageUrl(page) },
    };
  }

  const post = await resolvePost(segments, settings.permalinkStructure);

  if (!post || post.isUserGenerated) return { title: "Post Not Found" };

  const canonicalPath = getPostUrl(post, settings.permalinkStructure);
  const music = post.music;

  // Type-specific title and OG type
  // Per-post SEO overrides take priority over auto-generated values
  const seo = post as {
    metaTitle?: string | null;
    metaDescription?: string | null;
    focusKeyword?: string | null;
  };
  let title = seo.metaTitle || post.title;
  let ogType: "article" | "music.song" | "music.album" | "video.other" = "article";
  let description = seo.metaDescription || post.excerpt || undefined;
  let images = post.coverImage ? [{ url: post.coverImage }] : [];

  switch (post.type) {
    case "MUSIC":
      if (music) {
        title = `${music.title} — ${music.artist.name}`;
        description = `Download ${music.title} by ${music.artist.name} for free on ${settings.siteName}.`;
        ogType = "music.song";
        if (music.coverArt) images = [{ url: music.coverArt }];
      }
      break;
    case "ALBUM":
      if (music?.album) {
        title = `${music.album.title} — ${music.artist.name}`;
        description = `Download ${music.album.title} by ${music.artist.name} on ${settings.siteName}.`;
        ogType = "music.album";
        if (music.album.coverArt) images = [{ url: music.album.coverArt }];
      }
      break;
    case "VIDEO":
      ogType = "video.other";
      break;
  }

  return {
    title,
    description,
    ...(seo.focusKeyword ? { keywords: seo.focusKeyword.split(",").map((k) => k.trim()) } : {}),
    openGraph: {
      title,
      description,
      images,
      type: ogType,
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author.name ? [post.author.name] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: canonicalPath },
  };
}

export const revalidate = 3600;

export default async function PostPage({ params }: Props) {
  const { segments } = await params;
  const settings = await getSettings();
  const pagePath = segments.join("/");
  const page = await getPublishedPageBySlug(pagePath);

  if (page) {
    return <PublicPageContent page={page} settings={settings} />;
  }

  const post = await resolvePost(segments, settings.permalinkStructure);

  if (!post) notFound();

  // User-generated feed/community posts don't have detail pages
  if (post.isUserGenerated) notFound();

  const currentPath = "/" + segments.join("/");

  return <PostPageContent post={post} settings={settings} currentPath={currentPath} />;
}
