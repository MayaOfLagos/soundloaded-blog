import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Music, Calendar, Disc } from "lucide-react";
import { getMusicBySlug } from "@/lib/api/music";
import { getPostBySlug } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { getPostUrl } from "@/lib/urls";
import { DownloadButton } from "@/components/music/DownloadButton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDuration, formatFileSize } from "@/lib/utils";
import { JsonLd } from "@/components/common/JsonLd";
import { buildMusicRecordingSchema, buildBreadcrumbSchema } from "@/lib/structured-data";
import { PostPageContent } from "@/components/blog/PostPageContent";

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

  const trackSchema = buildMusicRecordingSchema(track, settings.siteUrl);
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Music", url: "/music" },
      { name: `${track.title} — ${track.artist.name}`, url: `/music/${slug}` },
    ],
    settings.siteUrl
  );

  return (
    <>
      <JsonLd schema={[trackSchema, breadcrumbSchema]} />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row">
          {/* Cover art */}
          <div className="bg-muted relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl shadow-lg sm:w-64">
            {track.coverArt ? (
              <Image
                src={track.coverArt}
                alt={track.title}
                fill
                className="object-cover"
                priority
                sizes="256px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Music className="text-muted-foreground/30 h-16 w-16" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            {track.genre && (
              <Badge className="bg-brand text-brand-foreground text-xs tracking-wide uppercase">
                {track.genre}
              </Badge>
            )}

            <div>
              <h1 className="text-foreground text-2xl font-black sm:text-3xl">{track.title}</h1>
              <p className="text-muted-foreground mt-1 text-lg">{track.artist.name}</p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {track.year && (
                <div className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{track.year}</span>
                </div>
              )}
              {track.album && (
                <div className="text-muted-foreground flex items-center gap-2">
                  <Disc className="h-4 w-4" />
                  <span className="truncate">{track.album.title}</span>
                </div>
              )}
              {track.duration && (
                <div className="text-muted-foreground">
                  Duration:{" "}
                  <span className="text-foreground">{formatDuration(track.duration)}</span>
                </div>
              )}
              {track.fileSize && (
                <div className="text-muted-foreground">
                  Size: <span className="text-foreground">{formatFileSize(track.fileSize)}</span>
                </div>
              )}
              <div className="text-muted-foreground">
                Downloads:{" "}
                <span className="text-foreground font-semibold">
                  {track.downloadCount.toLocaleString()}
                </span>
              </div>
              <div className="text-muted-foreground">
                Format: <span className="text-foreground uppercase">{track.format}</span>
              </div>
            </div>

            <DownloadButton
              musicId={track.id}
              title={track.title}
              enabled={track.enableDownload}
              size="lg"
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {/* Tracklist (if part of album) */}
        {track.album && track.album.tracks && track.album.tracks.length > 1 && (
          <div className="mt-10">
            <Separator className="mb-6" />
            <h2 className="mb-4 text-xl font-bold">More from {track.album.title}</h2>
            <div className="space-y-1">
              {track.album.tracks.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${t.id === track.id ? "bg-brand/10 text-brand" : "hover:bg-muted"}`}
                >
                  <span className="text-muted-foreground w-6 text-center text-sm font-bold">
                    {t.trackNumber ?? "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                  </div>
                  {t.duration && (
                    <span className="text-muted-foreground flex-shrink-0 text-xs">
                      {formatDuration(t.duration)}
                    </span>
                  )}
                  {t.id !== track.id && (
                    <DownloadButton
                      musicId={t.id}
                      title={t.title}
                      enabled={t.enableDownload}
                      size="sm"
                      variant="ghost"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
