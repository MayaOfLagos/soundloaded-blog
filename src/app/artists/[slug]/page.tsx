import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArtistBySlug, getSimilarArtistsForArtist } from "@/lib/api/music";
import { getSettings } from "@/lib/settings";
import { JsonLd } from "@/components/common/JsonLd";
import { buildMusicGroupSchema, buildBreadcrumbSchema } from "@/lib/structured-data";
import { ArtistDetailClient } from "./ArtistDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return { title: "Artist Not Found" };
  const settings = await getSettings();
  return {
    title: artist.name,
    description:
      artist.bio ?? `${artist.name} — Download songs, albums and EPs on Soundloaded Blog.`,
    openGraph: { title: artist.name, images: artist.photo ? [{ url: artist.photo }] : [] },
    alternates: { canonical: `${settings.siteUrl}/artists/${slug}` },
  };
}

export const revalidate = 3600;

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const [artist, settings] = await Promise.all([getArtistBySlug(slug), getSettings()]);
  if (!artist) notFound();
  const similarArtists = await getSimilarArtistsForArtist({
    artistId: artist.id,
    genre: artist.genre,
  });

  const artistSchema = buildMusicGroupSchema(artist, settings.siteUrl);
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Artists", url: "/artists" },
      { name: artist.name, url: `/artists/${slug}` },
    ],
    settings.siteUrl
  );

  // Sort tracks by download count for popular tracks
  const popularTracks = [...artist.music]
    .sort((a, b) => b.downloadCount - a.downloadCount)
    .slice(0, 5);

  // Total downloads across all tracks
  const totalDownloads = artist.music.reduce((sum, t) => sum + t.downloadCount, 0);

  return (
    <>
      <JsonLd schema={[artistSchema, breadcrumbSchema]} />
      <ArtistDetailClient
        artist={{
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          bio: artist.bio,
          photo: artist.photo,
          coverImage: artist.coverImage,
          country: artist.country,
          genre: artist.genre,
          instagram: artist.instagram,
          twitter: artist.twitter,
          facebook: artist.facebook,
          spotify: artist.spotify,
          appleMusic: artist.appleMusic,
        }}
        stats={{
          songCount: artist._count.music,
          albumCount: artist._count.albums,
          totalDownloads,
        }}
        popularTracks={popularTracks.map((t) => ({
          id: t.id,
          title: t.title,
          slug: t.slug,
          r2Key: t.r2Key,
          coverArt: t.coverArt,
          duration: t.duration,
          downloadCount: t.downloadCount,
          albumTitle: t.album?.title ?? null,
          enableDownload: t.enableDownload,
        }))}
        allTracks={artist.music.map((t) => ({
          id: t.id,
          slug: t.slug,
          title: t.title,
          artistName: artist.name,
          artistSlug: artist.slug,
          albumTitle: t.album?.title ?? null,
          coverArt: t.coverArt,
          genre: t.genre,
          downloadCount: t.downloadCount,
          streamCount: t.streamCount,
          enableDownload: t.enableDownload,
          fileSize: t.fileSize,
          releaseYear: t.year,
          r2Key: t.r2Key,
          accessModel: t.accessModel,
          streamAccess: t.streamAccess,
          creatorPrice: t.creatorPrice,
        }))}
        albums={artist.albums.map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          artistName: artist.name,
          artistSlug: artist.slug,
          coverArt: a.coverArt,
          releaseYear: a.releaseDate ? new Date(a.releaseDate).getFullYear() : null,
          trackCount: a._count.tracks,
          totalDownloads: a.tracks.reduce((sum, t) => sum + t.downloadCount, 0),
        }))}
        similarArtists={similarArtists}
        siteUrl={settings.siteUrl}
      />
    </>
  );
}
