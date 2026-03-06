import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Disc, Calendar, Music } from "lucide-react";
import { getAlbumBySlug } from "@/lib/api/music";
import { getPostBySlug } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { getPostUrl } from "@/lib/urls";
import { DownloadButton } from "@/components/music/DownloadButton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDuration } from "@/lib/utils";
import { JsonLd } from "@/components/common/JsonLd";
import { buildMusicAlbumSchema, buildBreadcrumbSchema } from "@/lib/structured-data";
import { PostPageContent } from "@/components/blog/PostPageContent";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);
  if (album) {
    const settings = await getSettings();
    return {
      title: `${album.title} — ${album.artist.name}`,
      description: `Download ${album.title} by ${album.artist.name} on Soundloaded Blog.`,
      openGraph: {
        title: `${album.title} — ${album.artist.name}`,
        images: album.coverArt ? [{ url: album.coverArt }] : [],
        type: "music.album",
      },
      alternates: { canonical: `${settings.siteUrl}/albums/${slug}` },
    };
  }

  // Fallback: check if this is a blog post
  const post = await getPostBySlug(slug);
  if (post) {
    const settings = await getSettings();
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
      },
      alternates: { canonical: canonicalPath },
    };
  }

  return { title: "Not Found" };
}

export const revalidate = 3600;

export default async function AlbumPage({ params }: Props) {
  const { slug } = await params;
  const [album, settings] = await Promise.all([getAlbumBySlug(slug), getSettings()]);

  // If no album found, try resolving as a blog post
  if (!album) {
    const post = await getPostBySlug(slug);
    if (post) {
      return <PostPageContent post={post} settings={settings} currentPath={`/albums/${slug}`} />;
    }
    notFound();
  }

  const totalDuration = album.tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0);
  const releaseYear = album.releaseDate ? new Date(album.releaseDate).getFullYear() : null;

  const albumSchema = buildMusicAlbumSchema(album, settings.siteUrl);
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Albums", url: "/albums" },
      { name: album.title, url: `/albums/${slug}` },
    ],
    settings.siteUrl
  );

  return (
    <>
      <JsonLd schema={[albumSchema, breadcrumbSchema]} />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Album header */}
        <div className="mb-8 flex flex-col gap-8 sm:flex-row">
          <div className="bg-muted relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl shadow-lg sm:w-56">
            {album.coverArt ? (
              <Image
                src={album.coverArt}
                alt={album.title}
                fill
                className="object-cover"
                priority
                sizes="224px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Disc className="text-muted-foreground/30 h-16 w-16" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <Badge className="bg-brand text-brand-foreground text-xs tracking-wide uppercase">
              {album.type}
            </Badge>
            <h1 className="text-foreground text-2xl font-black sm:text-3xl">{album.title}</h1>
            <Link
              href={`/artists/${album.artist.slug}`}
              className="text-muted-foreground hover:text-brand text-lg transition-colors"
            >
              {album.artist.name}
            </Link>

            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              {releaseYear && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {releaseYear}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Music className="h-4 w-4" />
                {album.tracks.length} tracks
              </span>
              {totalDuration > 0 && <span>{formatDuration(totalDuration)}</span>}
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Tracklist */}
        <h2 className="mb-4 text-xl font-bold">Tracklist</h2>
        {album.tracks.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">No tracks uploaded yet.</p>
        ) : (
          <div className="space-y-1">
            {album.tracks.map((track) => (
              <div
                key={track.id}
                className="hover:bg-muted group flex items-center gap-3 rounded-lg px-3 py-2.5"
              >
                <span className="text-muted-foreground w-6 text-center text-sm font-bold">
                  {track.trackNumber ?? "—"}
                </span>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/music/${track.slug}`}
                    className="text-foreground hover:text-brand block truncate text-sm font-medium transition-colors"
                  >
                    {track.title}
                  </Link>
                </div>

                {track.duration && (
                  <span className="text-muted-foreground flex-shrink-0 text-xs">
                    {formatDuration(track.duration)}
                  </span>
                )}

                <div className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                  <DownloadButton
                    musicId={track.id}
                    title={track.title}
                    enabled={track.enableDownload}
                    size="sm"
                    variant="ghost"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
