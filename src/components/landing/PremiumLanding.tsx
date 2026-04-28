import Image from "next/image";
import Link from "next/link";
import { Music, Newspaper, Download, Play, ArrowRight, Radio, TrendingUp } from "lucide-react";
import { getLatestPosts } from "@/lib/api/posts";
import {
  getDistinctGenres,
  getLatestArtists,
  getMostStreamedMusic,
  getOrbitArtists,
  getPopularMusic,
} from "@/lib/api/music";
import { getSettings } from "@/lib/settings";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { Logo } from "@/components/common/Logo";
import { formatRelativeDate } from "@/lib/utils";
import { PostImage } from "@/components/blog/PostImage";
import { SolarSystemOrbit } from "@/components/landing/SolarSystemOrbit";
import { GenreSpotlight } from "@/components/landing/GenreSpotlight";
import { TopInNigeria } from "@/components/landing/TopInNigeria";
import { FeaturedArtists } from "@/components/landing/FeaturedArtists";
import { ArtistsCTABanner } from "@/components/landing/ArtistsCTABanner";
import { PremiumFooter } from "@/components/landing/PremiumFooter";
import "@/styles/solar-system-orbit.css";

export async function PremiumLanding() {
  const [settings, posts, tracks, orbitArtists, chartTracks, featuredArtists, genres] =
    await Promise.all([
      getSettings(),
      getLatestPosts({ limit: 6, permalinkStructure: undefined }),
      getPopularMusic({ limit: 5 }),
      getOrbitArtists({ limit: 12 }),
      getMostStreamedMusic({ limit: 10 }),
      getLatestArtists({ limit: 12 }),
      getDistinctGenres(),
    ]);

  const siteName = settings.siteName ?? "Soundloaded";
  const featuredPost = posts[0] ?? null;
  const gridPosts = posts.slice(1, 5);
  const centerLogo = settings.logoDark ?? settings.logoLight;
  const featuredArtistsWithPhotos = featuredArtists.filter((a) => !!a.photo).slice(0, 6);

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header className="border-border/40 bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo
            logoLightUrl={settings.logoLight}
            logoDarkUrl={settings.logoDark}
            siteName={siteName}
          />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/api/enter"
              className="bg-brand text-brand-foreground hover:bg-brand/90 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            >
              Enter Soundloaded
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="px-3 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-10 lg:pt-8 lg:pb-14">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10 lg:rounded-[2.5rem]">
            {/* Layered gradient background */}
            <div className="absolute inset-0 bg-[#0a0612]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_15%_15%,rgba(217,70,239,0.30),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_85%_85%,rgba(168,85,247,0.22),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_50%_50%,rgba(251,191,36,0.05),transparent_70%)]" />
            <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-black/40" />

            <div className="relative grid items-center gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:px-16 lg:py-20">
              <div className="flex flex-col gap-6 lg:gap-8">
                <h1 className="text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                  Discover The <br className="hidden sm:block" />
                  <span className="bg-linear-to-r from-fuchsia-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
                    Sound Of Africa
                  </span>
                </h1>

                <p className="max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                  The home of Afrobeats. Stream the latest, download what you love, and follow the
                  artists shaping Nigeria&apos;s sound — all in one place.
                </p>

                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:gap-4">
                  <Link
                    href="/api/enter?next=/music"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-fuchsia-500 to-amber-400 px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(217,70,239,0.4)] sm:text-base"
                  >
                    Explore Latest Music
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/api/enter?next=/music"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-white/45 hover:bg-white/15 sm:text-base"
                  >
                    Promote Your Song
                  </Link>
                </div>
              </div>

              <div className="hidden lg:flex lg:items-center lg:justify-center">
                <SolarSystemOrbit
                  artists={orbitArtists}
                  centerLogo={centerLogo}
                  siteName={siteName}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GENRE SPOTLIGHT ─────────────────────────────────────────────── */}
      <GenreSpotlight availableGenres={genres} />

      {/* ── LATEST DROPS (music) ────────────────────────────────────────── */}
      {tracks.length > 0 && (
        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              icon={<TrendingUp className="text-brand h-4 w-4" />}
              label="Hot Right Now"
              title="Fresh Drops"
              href="/music"
              linkLabel="All Music"
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {tracks.map((track) => (
                <Link
                  key={track.id}
                  href={`/music/${track.slug}`}
                  className="bg-card ring-border/40 group hover:ring-brand/40 overflow-hidden rounded-2xl ring-1 transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {track.coverArt ? (
                      <Image
                        src={track.coverArt}
                        alt={track.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="from-brand/20 to-muted flex h-full w-full items-center justify-center bg-linear-to-br">
                        <Music className="text-muted-foreground h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="bg-brand flex h-11 w-11 items-center justify-center rounded-full">
                        <Play className="text-brand-foreground h-5 w-5 fill-current" />
                      </div>
                    </div>
                    {track.genre && (
                      <span className="bg-background/80 absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                        {track.genre}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-foreground group-hover:text-brand line-clamp-1 text-sm font-bold transition-colors">
                      {track.title}
                    </p>
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                      {track.artistName}
                    </p>
                    <div className="text-muted-foreground/60 mt-2 flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {track.downloadCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {track.streamCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TOP IN NIGERIA (chart) ──────────────────────────────────────── */}
      <TopInNigeria tracks={chartTracks} />

      {/* ── FEATURED ARTISTS ────────────────────────────────────────────── */}
      <FeaturedArtists artists={featuredArtistsWithPhotos} />

      {/* ── FROM THE NEWSROOM (stories) ─────────────────────────────────── */}
      {featuredPost && (
        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              icon={<Newspaper className="text-brand h-4 w-4" />}
              label="From the Newsroom"
              title="What's Happening"
              href="/api/enter?next=/"
              linkLabel="Read the Blog"
            />
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Link
                href={featuredPost.href ?? `/${featuredPost.slug}`}
                className="ring-border/40 group hover:ring-brand/40 relative overflow-hidden rounded-3xl ring-1 transition-all duration-300"
              >
                <div className="relative aspect-video overflow-hidden">
                  <PostImage
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                    category={featuredPost.category?.name}
                    author={featuredPost.author?.name}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    {featuredPost.category && (
                      <span className="bg-brand text-brand-foreground mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold">
                        {featuredPost.category.name}
                      </span>
                    )}
                    <h2 className="text-xl leading-snug font-bold text-white sm:text-2xl">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-white/70">
                        {featuredPost.excerpt}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-white/50">
                      {formatRelativeDate(featuredPost.publishedAt)}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {gridPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={post.href ?? `/${post.slug}`}
                    className="ring-border/40 group hover:ring-brand/40 overflow-hidden rounded-2xl ring-1 transition-all duration-200"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <PostImage
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 50vw"
                        category={post.category?.name}
                        author={post.author?.name}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        {post.category && (
                          <span className="bg-brand/90 text-brand-foreground mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold">
                            {post.category.name}
                          </span>
                        )}
                        <p className="line-clamp-2 text-xs leading-snug font-bold text-white">
                          {post.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FOR ARTISTS CTA ─────────────────────────────────────────────── */}
      <ArtistsCTABanner />

      {/* ── NEWSLETTER ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div className="bg-brand/10 text-brand ring-brand/20 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold ring-1">
            <Radio className="h-3 w-3" />
            Stay in the loop
          </div>
          <h2 className="text-3xl font-black sm:text-4xl">Never Miss a Drop</h2>
          <p className="text-muted-foreground mt-3 text-base">
            Get the latest music, news, and gist delivered straight to your inbox.
          </p>
          <div className="mt-8">
            <NewsletterForm />
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <PremiumFooter settings={settings} />
    </div>
  );
}

function SectionHeader({
  icon,
  label,
  title,
  href,
  linkLabel,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="text-brand mb-1 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
          {icon}
          {label}
        </div>
        <h2 className="text-2xl font-black sm:text-3xl">{title}</h2>
      </div>
      <Link
        href={href}
        className="text-brand hover:text-brand/80 mb-1 flex shrink-0 items-center gap-1 text-sm font-semibold transition-colors"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
