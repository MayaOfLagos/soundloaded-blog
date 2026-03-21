import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAlbumBySlug, getLatestMusic } from "@/lib/api/music";
import { getPostBySlug } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { getPostUrl } from "@/lib/urls";
import { JsonLd } from "@/components/common/JsonLd";
import { buildMusicAlbumSchema, buildBreadcrumbSchema } from "@/lib/structured-data";
import { PostPageContent } from "@/components/blog/PostPageContent";
import { AlbumDetailClient } from "./AlbumDetailClient";

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
  const totalDownloads = album.tracks.reduce((sum, t) => sum + t.downloadCount, 0);
  const releaseYear = album.releaseDate ? new Date(album.releaseDate).getFullYear() : null;

  // Get more tracks by the same artist (exclude tracks already in this album)
  const albumTrackIds = new Set(album.tracks.map((t) => t.id));
  const artistTracks = await getLatestMusic({ limit: 20 });
  const moreByArtist = artistTracks
    .filter((t) => t.artistName === album.artist.name && !albumTrackIds.has(t.id))
    .slice(0, 10);

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
      <AlbumDetailClient
        album={{
          id: album.id,
          title: album.title,
          slug: album.slug,
          coverArt: album.coverArt,
          type: album.type,
          genre: album.genre,
          label: album.label,
          releaseYear,
        }}
        artist={{
          id: album.artist.id,
          name: album.artist.name,
          slug: album.artist.slug,
          photo: album.artist.photo,
        }}
        tracks={album.tracks.map((t) => ({
          id: t.id,
          title: t.title,
          slug: t.slug,
          r2Key: t.r2Key,
          coverArt: t.coverArt,
          duration: t.duration,
          trackNumber: t.trackNumber,
          downloadCount: t.downloadCount,
          enableDownload: t.enableDownload,
        }))}
        totalDuration={totalDuration}
        totalDownloads={totalDownloads}
        moreByArtist={moreByArtist}
        siteUrl={settings.siteUrl}
      />
    </>
  );
}
