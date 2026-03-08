import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Music, Calendar, Disc, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DownloadButton } from "@/components/music/DownloadButton";
import { PostBody } from "@/components/blog/PostBody";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { CommentSection } from "@/components/blog/CommentSection";
import { JsonLd } from "@/components/common/JsonLd";
import { buildMusicRecordingSchema, buildBreadcrumbSchema } from "@/lib/structured-data";
import { formatDuration, formatFileSize } from "@/lib/utils";
import { DetailLayout } from "./DetailLayout";
import { ArtistSidebarCard } from "./ArtistSidebarCard";
import { MoreFromArtist } from "./MoreFromArtist";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import { NewsPostDetail } from "./NewsPostDetail";
import type { DetailPageProps } from "./types";

function SidebarSkeleton() {
  return <div className="bg-muted/50 h-64 animate-pulse rounded-2xl" />;
}

export function MusicPostDetail({ post, settings, related, articleUrl }: DetailPageProps) {
  const track = post.music;

  // Fallback: if no music relation, render as generic article
  if (!track) {
    return (
      <NewsPostDetail post={post} settings={settings} related={related} articleUrl={articleUrl} />
    );
  }

  const trackSchema = buildMusicRecordingSchema(track, settings.siteUrl);
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Music", url: "/music" },
      { name: `${track.title} — ${track.artist.name}`, url: articleUrl },
    ],
    settings.siteUrl
  );

  return (
    <>
      <JsonLd schema={[trackSchema, breadcrumbSchema]} />
      <DetailLayout
        sidebar={
          <>
            <ArtistSidebarCard artist={track.artist} />
            <Suspense fallback={<SidebarSkeleton />}>
              <MoreFromArtist
                artistId={track.artist.id}
                artistName={track.artist.name}
                excludeMusicId={track.id}
              />
            </Suspense>
            <Suspense fallback={<SidebarSkeleton />}>
              <PopularMusicSidebar />
            </Suspense>
          </>
        }
      >
        <article>
          {/* Breadcrumb */}
          <nav
            className="text-muted-foreground mb-4 flex items-center gap-1.5 text-sm"
            aria-label="breadcrumb"
          >
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/music" className="hover:text-foreground transition-colors">
              Music
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground line-clamp-1 font-medium">{track.title}</span>
          </nav>

          {/* Music header */}
          <div className="flex flex-col gap-6 sm:flex-row">
            {/* Cover art */}
            <div className="bg-muted relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl shadow-lg sm:w-64">
              {track.coverArt ? (
                <Image
                  src={track.coverArt}
                  alt={track.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 640px) 100vw, 256px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Music className="text-muted-foreground/30 h-16 w-16" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              {track.genre && (
                <Badge className="bg-brand text-brand-foreground text-xs tracking-wide uppercase">
                  {track.genre}
                </Badge>
              )}

              <div>
                <h1 className="text-foreground text-2xl font-black sm:text-3xl">{track.title}</h1>
                <Link
                  href={`/artists/${track.artist.slug}`}
                  className="text-muted-foreground hover:text-brand mt-1 inline-block text-lg transition-colors"
                >
                  {track.artist.name}
                </Link>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {track.year && (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{track.year}</span>
                  </div>
                )}
                {track.album && (
                  <Link
                    href={`/albums/${track.album.slug}`}
                    className="text-muted-foreground hover:text-brand flex items-center gap-2 transition-colors"
                  >
                    <Disc className="h-4 w-4" />
                    <span className="truncate">{track.album.title}</span>
                  </Link>
                )}
                {track.duration && (
                  <div className="text-muted-foreground">
                    Duration:{" "}
                    <span className="text-foreground">{formatDuration(track.duration)}</span>
                  </div>
                )}
                <div className="text-muted-foreground">
                  Size: <span className="text-foreground">{formatFileSize(track.fileSize)}</span>
                </div>
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
                isExclusive={track.isExclusive}
                price={track.price}
                size="lg"
                className="w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Mobile artist card */}
          <div className="mt-6 lg:hidden">
            <ArtistSidebarCard artist={track.artist} />
          </div>

          {/* Article body */}
          {post.body && (
            <>
              <hr className="border-border my-8" />
              <div className="prose prose-zinc dark:prose-invert max-w-none">
                <PostBody body={post.body} />
              </div>
            </>
          )}

          {/* Album tracklist */}
          {track.album && track.album.tracks && track.album.tracks.length > 1 && (
            <div className="mt-10">
              <hr className="border-border mb-6" />
              <h2 className="mb-4 text-xl font-bold">
                More from{" "}
                <Link href={`/albums/${track.album.slug}`} className="text-brand hover:underline">
                  {track.album.title}
                </Link>
              </h2>
              <div className="space-y-1">
                {track.album.tracks.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                      t.id === track.id ? "bg-brand/10 text-brand" : "hover:bg-muted"
                    }`}
                  >
                    <span className="text-muted-foreground w-6 text-center text-sm font-bold">
                      {t.trackNumber ?? "—"}
                    </span>
                    <div className="min-w-0 flex-1">
                      {t.id === track.id ? (
                        <p className="truncate text-sm font-medium">{t.title}</p>
                      ) : (
                        <Link
                          href={`/music/${t.slug}`}
                          className="text-foreground hover:text-brand block truncate text-sm font-medium transition-colors"
                        >
                          {t.title}
                        </Link>
                      )}
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

          <div className="border-border mt-8 border-t pt-6">
            <ShareButtons url={articleUrl} title={post.title} />
          </div>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-xl font-bold">More Music</h2>
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
      </DetailLayout>
    </>
  );
}
