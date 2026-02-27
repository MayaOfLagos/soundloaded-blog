import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Instagram, Twitter, Youtube } from "lucide-react";
import { getArtistBySlug } from "@/lib/api/music";
import { MusicCard } from "@/components/music/MusicCard";
import { AlbumCard } from "@/components/music/AlbumCard";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mic2 } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return { title: "Artist Not Found" };
  return {
    title: artist.name,
    description:
      artist.bio ?? `${artist.name} — Download songs, albums and EPs on Soundloaded Blog.`,
    openGraph: { title: artist.name, images: artist.photo ? [{ url: artist.photo }] : [] },
  };
}

export const revalidate = 3600;

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const socialLinks = [
    { url: artist.instagram, icon: Instagram, label: "Instagram" },
    { url: artist.twitter, icon: Twitter, label: "Twitter" },
  ].filter((s) => !!s.url);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Artist header */}
      <div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="bg-muted ring-border relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-full ring-4 sm:h-40 sm:w-40">
          {artist.photo ? (
            <Image
              src={artist.photo}
              alt={artist.name}
              fill
              className="object-cover"
              priority
              sizes="160px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Mic2 className="text-muted-foreground/30 h-16 w-16" />
            </div>
          )}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-foreground text-3xl font-black">{artist.name}</h1>
          {artist.genre && (
            <Badge className="bg-brand text-brand-foreground mt-2">{artist.genre}</Badge>
          )}
          {artist.bio && (
            <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">{artist.bio}</p>
          )}
          {socialLinks.length > 0 && (
            <div className="mt-4 flex justify-center gap-2 sm:justify-start">
              {socialLinks.map(({ url, icon: Icon, label }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border text-muted-foreground hover:text-brand hover:border-brand flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Albums */}
      {artist.albums.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold">Albums & EPs</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {artist.albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={{
                  id: album.id,
                  slug: album.slug,
                  title: album.title,
                  artistName: artist.name,
                  coverArt: album.coverArt,
                  releaseYear: album.releaseDate ? new Date(album.releaseDate).getFullYear() : null,
                  trackCount: 0,
                  totalDownloads: 0,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Songs */}
      {artist.music.length > 0 && (
        <section>
          <Separator className="mb-6" />
          <h2 className="mb-4 text-xl font-bold">Songs</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {artist.music.map((track) => (
              <MusicCard
                key={track.id}
                track={{
                  id: track.id,
                  slug: track.slug,
                  title: track.title,
                  artistName: artist.name,
                  albumTitle: track.album?.title,
                  coverArt: track.coverArt,
                  genre: track.genre,
                  downloadCount: track.downloadCount,
                  fileSize: track.fileSize,
                  releaseYear: track.year,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {artist.music.length === 0 && artist.albums.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">No content uploaded yet for this artist.</p>
        </div>
      )}
    </div>
  );
}
