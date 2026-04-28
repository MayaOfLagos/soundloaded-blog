import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getMusicBySlug,
  getMoreByArtist,
  getRelatedMusicForTrack,
  getMusicFavoriteCount,
} from "@/lib/api/music";
import { getPostBySlug } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { getPostUrl } from "@/lib/urls";
import { extractDominantColor } from "@/lib/color";
import { JsonLd } from "@/components/common/JsonLd";
import { buildMusicRecordingSchema, buildBreadcrumbSchema } from "@/lib/structured-data";
import { PostPageContent } from "@/components/blog/PostPageContent";
import { MusicDetailClient } from "./MusicDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const track = await getMusicBySlug(slug);
  if (track) {
    const settings = await getSettings();
    return {
      title: `${track.title} — ${track.artist.name}`,
      description: `Download ${track.title} by ${track.artist.name} for free on Soundloaded Blog.`,
      openGraph: {
        title: `${track.title} — ${track.artist.name}`,
        images: track.coverArt ? [{ url: track.coverArt }] : [],
        type: "music.song",
      },
      alternates: { canonical: `${settings.siteUrl}/music/${slug}` },
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

export default async function MusicDetailPage({ params }: Props) {
  const { slug } = await params;
  const [track, settings] = await Promise.all([getMusicBySlug(slug), getSettings()]);

  // If no music track found, try resolving as a blog post
  if (!track) {
    const post = await getPostBySlug(slug);
    if (post) {
      return <PostPageContent post={post} settings={settings} currentPath={`/music/${slug}`} />;
    }
    notFound();
  }

  // Fetch additional data in parallel
  const [moreByArtist, relatedTracks, favoriteCount, dominantColor] = await Promise.all([
    getMoreByArtist({ artistId: track.artistId, excludeMusicId: track.id }),
    getRelatedMusicForTrack({
      musicId: track.id,
      artistId: track.artistId,
      albumId: track.albumId,
      genre: track.genre,
    }),
    getMusicFavoriteCount(track.id),
    track.coverArt ? extractDominantColor(track.coverArt) : Promise.resolve(null),
  ]);

  const trackSchema = buildMusicRecordingSchema(track, settings.siteUrl);
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Music", url: "/music" },
      { name: `${track.title} — ${track.artist.name}`, url: `/music/${slug}` },
    ],
    settings.siteUrl
  );

  // Convert BigInt and nested data for client component serialization
  const trackForClient = {
    id: track.id,
    title: track.title,
    slug: track.slug,
    r2Key: track.r2Key,
    coverArt: track.coverArt,
    genre: track.genre,
    year: track.year,
    label: track.label,
    format: track.format,
    bitrate: track.bitrate,
    duration: track.duration,
    fileSize: track.fileSize ? Number(track.fileSize) : null,
    downloadCount: track.downloadCount,
    streamCount: track.streamCount,
    enableDownload: track.enableDownload,
    isExclusive: track.isExclusive,
    price: track.price,
    accessModel: track.accessModel ?? "free",
    streamAccess: track.streamAccess ?? "free",
    creatorPrice: track.creatorPrice ?? null,
    trackNumber: track.trackNumber,
    postId: track.postId,
    artist: {
      name: track.artist.name,
      slug: track.artist.slug,
      photo: track.artist.photo,
      bio: track.artist.bio,
      country: track.artist.country,
      genre: track.artist.genre,
      instagram: track.artist.instagram,
      twitter: track.artist.twitter,
      facebook: track.artist.facebook,
      spotify: track.artist.spotify,
      appleMusic: track.artist.appleMusic,
    },
    album: track.album
      ? {
          title: track.album.title,
          slug: track.album.slug,
          tracks: track.album.tracks.map((t) => ({
            id: t.id,
            title: t.title,
            slug: t.slug,
            r2Key: t.r2Key,
            coverArt: t.coverArt,
            duration: t.duration,
            trackNumber: t.trackNumber,
            enableDownload: t.enableDownload,
            accessModel: t.accessModel ?? "free",
            creatorPrice: t.creatorPrice ?? null,
          })),
        }
      : null,
  };

  return (
    <>
      <JsonLd schema={[trackSchema, breadcrumbSchema]} />
      <MusicDetailClient
        track={trackForClient}
        description={track.post?.body ?? null}
        dominantColor={dominantColor}
        moreByArtist={moreByArtist}
        relatedTracks={relatedTracks}
        favoriteCount={favoriteCount}
        settings={{
          enableComments: settings.enableComments,
          enableDownloads: settings.enableDownloads,
          enableAlbums: settings.enableAlbums,
          enableArtists: settings.enableArtists,
          requireLoginToComment: settings.requireLoginToComment,
          commentNestingDepth: settings.commentNestingDepth,
          siteUrl: settings.siteUrl,
        }}
      />
    </>
  );
}
