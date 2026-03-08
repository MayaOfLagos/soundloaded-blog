import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, ChevronRight, Music } from "lucide-react";
import { DownloadButton } from "@/components/music/DownloadButton";
import { PostBody } from "@/components/blog/PostBody";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { CommentSection } from "@/components/blog/CommentSection";
import { JsonLd } from "@/components/common/JsonLd";
import { buildMusicRecordingSchema, buildBreadcrumbSchema } from "@/lib/structured-data";
import { DetailLayout } from "./DetailLayout";
import { ArtistSidebarCard } from "./ArtistSidebarCard";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import type { DetailPageProps } from "./types";

function SidebarSkeleton() {
  return <div className="bg-muted/50 h-64 animate-pulse rounded-2xl" />;
}

export function LyricsPostDetail({ post, settings, articleUrl }: DetailPageProps) {
  const track = post.music;

  const schemas: object[] = [];

  if (track) {
    schemas.push(buildMusicRecordingSchema(track, settings.siteUrl));
  }
  schemas.push(
    buildBreadcrumbSchema(
      [
        { name: "Home", url: "/" },
        { name: "Lyrics", url: "/lyrics" },
        { name: post.title, url: articleUrl },
      ],
      settings.siteUrl
    )
  );

  return (
    <>
      <JsonLd schema={schemas} />
      <DetailLayout
        sidebar={
          <>
            {track && <ArtistSidebarCard artist={track.artist} />}
            {track && (
              <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl p-4 ring-1 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="bg-brand/10 flex h-7 w-7 items-center justify-center rounded-lg">
                    <Music className="text-brand h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-foreground text-sm font-bold">Download Track</h3>
                </div>
                <p className="text-muted-foreground mb-3 text-xs">
                  Get the audio for {track.title} by {track.artist.name}
                </p>
                <DownloadButton
                  musicId={track.id}
                  title={track.title}
                  enabled={track.enableDownload}
                  isExclusive={track.isExclusive}
                  price={track.price}
                  size="default"
                  className="w-full"
                />
              </div>
            )}
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
            <Link href="/lyrics" className="hover:text-foreground transition-colors">
              Lyrics
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground line-clamp-1 font-medium">{post.title}</span>
          </nav>

          {/* Song info header */}
          <div className="flex items-start gap-4">
            {track?.coverArt ? (
              <div className="bg-muted relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl shadow-md sm:h-24 sm:w-24">
                <Image
                  src={track.coverArt}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ) : post.coverImage ? (
              <div className="bg-muted relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl shadow-md sm:h-24 sm:w-24">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
                <BookOpen className="h-3.5 w-3.5" />
                Lyrics
              </div>
              <h1 className="text-foreground text-2xl font-black sm:text-3xl">{post.title}</h1>
              {track && (
                <Link
                  href={`/artists/${track.artist.slug}`}
                  className="text-muted-foreground hover:text-brand mt-1 inline-block text-base transition-colors"
                >
                  {track.artist.name}
                </Link>
              )}
              {track?.album && (
                <p className="text-muted-foreground mt-0.5 text-sm">
                  From{" "}
                  <Link
                    href={`/albums/${track.album.slug}`}
                    className="hover:text-brand transition-colors"
                  >
                    {track.album.title}
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Mobile download CTA */}
          {track && (
            <div className="mt-4 lg:hidden">
              <DownloadButton
                musicId={track.id}
                title={track.title}
                enabled={track.enableDownload}
                isExclusive={track.isExclusive}
                price={track.price}
                size="default"
                className="w-full"
              />
            </div>
          )}

          <hr className="border-border my-6" />

          {/* Lyrics body — styled for readability */}
          <div className="bg-card/50 ring-border/40 rounded-2xl p-6 ring-1">
            <div className="prose prose-zinc dark:prose-invert prose-p:leading-loose prose-p:whitespace-pre-line max-w-none text-center">
              <PostBody body={post.body} />
            </div>
          </div>

          <div className="border-border mt-8 border-t pt-6">
            <ShareButtons url={articleUrl} title={post.title} />
          </div>

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
