import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Disc, Calendar, Music, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DownloadButton } from "@/components/music/DownloadButton";
import { PostBody } from "@/components/blog/PostBody";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { CommentSection } from "@/components/blog/CommentSection";
import { JsonLd } from "@/components/common/JsonLd";
import { buildMusicAlbumSchema, buildBreadcrumbSchema } from "@/lib/structured-data";
import { formatDuration } from "@/lib/utils";
import { DetailLayout } from "./DetailLayout";
import { ArtistSidebarCard } from "./ArtistSidebarCard";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import { NewsPostDetail } from "./NewsPostDetail";
import type { DetailPageProps } from "./types";

function SidebarSkeleton() {
  return <div className="bg-muted/50 h-64 animate-pulse rounded-2xl" />;
}

export function AlbumPostDetail({ post, settings, related, articleUrl }: DetailPageProps) {
  const album = post.music?.album;

  if (!album || !post.music) {
    return (
      <NewsPostDetail post={post} settings={settings} related={related} articleUrl={articleUrl} />
    );
  }

  const totalDuration = album.tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0);
  const releaseYear = album.releaseDate ? new Date(album.releaseDate).getFullYear() : null;

  const albumSchema = buildMusicAlbumSchema(album, settings.siteUrl);
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Albums", url: "/albums" },
      { name: album.title, url: articleUrl },
    ],
    settings.siteUrl
  );

  return (
    <>
      <JsonLd schema={[albumSchema, breadcrumbSchema]} />
      <DetailLayout
        sidebar={
          <>
            <ArtistSidebarCard artist={post.music.artist} />
            <Suspense fallback={<SidebarSkeleton />}>
              <PopularMusicSidebar />
            </Suspense>
          </>
        }
      >
        <article>
          <nav
            className="text-muted-foreground mb-4 flex items-center gap-1.5 text-sm"
            aria-label="breadcrumb"
          >
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/albums" className="hover:text-foreground transition-colors">
              Albums
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground line-clamp-1 font-medium">{album.title}</span>
          </nav>

          {/* Album header */}
          <div className="mb-8 flex flex-col gap-6 sm:flex-row">
            <div className="bg-muted relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl shadow-lg sm:w-56">
              {album.coverArt ? (
                <Image
                  src={album.coverArt}
                  alt={album.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 640px) 100vw, 224px"
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
                href={`/artists/${post.music.artist.slug}`}
                className="text-muted-foreground hover:text-brand text-lg transition-colors"
              >
                {post.music.artist.name}
              </Link>

              <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                {releaseYear != null && (
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

          {/* Mobile artist card */}
          <div className="mb-6 lg:hidden">
            <ArtistSidebarCard artist={post.music.artist} />
          </div>

          <hr className="border-border mb-6" />

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
                    {track.trackNumber ?? "\u2014"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/music/${track.slug}`}
                      className="text-foreground hover:text-brand block truncate text-sm font-medium transition-colors"
                    >
                      {track.title}
                    </Link>
                  </div>
                  {track.duration != null && track.duration > 0 && (
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

          {/* Article body */}
          {post.body != null && (
            <>
              <hr className="border-border my-8" />
              <div className="prose prose-zinc dark:prose-invert max-w-none">
                <PostBody body={post.body} />
              </div>
            </>
          )}

          <div className="border-border mt-8 border-t pt-6">
            <ShareButtons url={articleUrl} title={post.title} />
          </div>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-xl font-bold">More Albums</h2>
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
