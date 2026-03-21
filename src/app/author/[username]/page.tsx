export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { JsonLd } from "@/components/common/JsonLd";
import type { PostCardData } from "@/components/blog/PostCard";
import { MapPin, Calendar, FileText, Users, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthorProfileClient } from "./AuthorProfileClient";

interface Props {
  params: Promise<{ username: string }>;
}

async function getAuthor(username: string) {
  return db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      location: true,
      socialLinks: true,
      createdAt: true,
      _count: {
        select: {
          posts: { where: { status: "PUBLISHED" } },
          followers: true,
          following: true,
        },
      },
    },
  });
}

async function getAuthorPosts(authorId: string, permalinkStructure?: string) {
  const posts = await db.post.findMany({
    where: { authorId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      views: true,
      type: true,
      isUserGenerated: true,
      category: { select: { name: true, slug: true } },
      author: { select: { name: true, image: true } },
    },
  });

  const mapPost = (p: (typeof posts)[number]): PostCardData => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    publishedAt: p.publishedAt ?? new Date(),
    viewCount: p.views,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
    author: p.author.name ? { name: p.author.name, avatar: p.author.image } : null,
    href:
      permalinkStructure === "post_name"
        ? `/${p.slug}`
        : permalinkStructure === "category"
          ? p.category
            ? `/${p.category.slug}/${p.slug}`
            : `/${p.slug}`
          : `/${p.slug}`,
  });

  const editorial = posts.filter((p) => !p.isUserGenerated).map(mapPost);
  const community = posts.filter((p) => p.isUserGenerated).map(mapPost);

  return { editorial, community };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const author = await getAuthor(username);
  if (!author) return { title: "Author Not Found" };

  const settings = await getSettings();
  const displayName = author.name ?? author.username ?? "Author";
  const description = author.bio ?? `Read articles by ${displayName} on ${settings.siteName}.`;

  return {
    title: displayName,
    description,
    alternates: { canonical: `${settings.siteUrl}/author/${username}` },
    openGraph: {
      title: `${displayName} | ${settings.siteName}`,
      description,
      images: author.image ? [{ url: author.image }] : [],
    },
  };
}

export const revalidate = 300;

export default async function AuthorPage({ params }: Props) {
  const { username } = await params;
  const [author, settings] = await Promise.all([getAuthor(username), getSettings()]);
  if (!author) notFound();

  const { editorial, community } = await getAuthorPosts(author.id, settings.permalinkStructure);
  const displayName = author.name ?? author.username ?? "Author";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const socialLinks = author.socialLinks as { twitter?: string; instagram?: string } | null;
  const joinDate = new Date(author.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    url: `${settings.siteUrl}/author/${username}`,
    ...(author.image && { image: author.image }),
    ...(author.bio && { description: author.bio }),
  };

  return (
    <>
      <JsonLd schema={[personSchema]} />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* ── Profile Header ── */}
        <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
          {/* Banner */}
          <div className="from-brand/80 via-brand/60 h-28 bg-gradient-to-r to-pink-500/50 sm:h-36" />

          <div className="px-5 pb-6 sm:px-8">
            {/* Avatar + Name Row */}
            <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
              <Avatar className="ring-card h-24 w-24 shadow-lg ring-4 sm:h-28 sm:w-28">
                <AvatarImage src={author.image ?? undefined} alt={displayName} />
                <AvatarFallback className="bg-brand/15 text-brand text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 sm:pb-1">
                <h1 className="text-foreground text-xl font-black sm:text-2xl">{displayName}</h1>
                <p className="text-muted-foreground text-sm">@{author.username}</p>
              </div>
            </div>

            {/* Bio */}
            {author.bio && (
              <p className="text-foreground/80 mt-4 text-sm leading-relaxed">{author.bio}</p>
            )}

            {/* Meta chips */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              {author.location && (
                <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <MapPin className="h-4 w-4" />
                  {author.location}
                </span>
              )}
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <Calendar className="h-4 w-4" />
                Joined {joinDate}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <FileText className="h-4 w-4" />
                {author._count.posts} {author._count.posts === 1 ? "post" : "posts"}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <Users className="h-4 w-4" />
                {author._count.followers} {author._count.followers === 1 ? "follower" : "followers"}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                {author._count.following} following
              </span>
            </div>

            {/* Social links */}
            {socialLinks && (socialLinks.twitter || socialLinks.instagram) && (
              <div className="mt-3 flex items-center gap-3">
                {socialLinks.twitter && (
                  <a
                    href={`https://twitter.com/${socialLinks.twitter.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-brand flex items-center gap-1 text-sm transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Twitter
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={`https://instagram.com/${socialLinks.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-brand flex items-center gap-1 text-sm transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Instagram
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Interactive Profile Section (Follow + Posts Tabs) ── */}
        <AuthorProfileClient
          authorId={author.id}
          authorName={displayName}
          editorialPosts={editorial}
          communityPosts={community}
        />
      </div>
    </>
  );
}
