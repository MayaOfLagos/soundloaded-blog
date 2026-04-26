import Image from "next/image";
import Link from "next/link";
import { Music, Newspaper, TrendingUp, Download, Play, ArrowRight, Radio } from "lucide-react";
import { getLatestPosts } from "@/lib/api/posts";
import { getPopularMusic } from "@/lib/api/music";
import { getSettings } from "@/lib/settings";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { Logo } from "@/components/common/Logo";
import { formatRelativeDate } from "@/lib/utils";
import { PostImage } from "@/components/blog/PostImage";

export async function PremiumLanding() {
  const [settings, posts, tracks] = await Promise.all([
    getSettings(),
    getLatestPosts({ limit: 6, permalinkStructure: undefined }),
    getPopularMusic({ limit: 5 }),
  ]);

  const siteName = settings.siteName ?? "Soundloaded";
  const tagline = settings.tagline ?? "Nigeria's #1 music download & entertainment blog";

  const featuredPost = posts[0] ?? null;
  const gridPosts = posts.slice(1, 5);

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
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="from-brand/5 pointer-events-none absolute inset-0 bg-linear-to-b to-transparent" />

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="bg-brand/10 text-brand ring-brand/20 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold ring-1">
              <Radio className="h-3 w-3 animate-pulse" />
              Nigeria&apos;s #1 Music &amp; Entertainment Platform
            </div>
            <h1 className="max-w-4xl text-5xl leading-[1.1] font-black tracking-tight sm:text-6xl lg:text-7xl">
              Where <span className="text-brand">Nigerian Music</span> Comes to Life
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed sm:text-xl">
              {tagline}. Latest drops, breaking music news, artist stories, and free downloads — all
              in one place.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/api/enter"
                className="bg-brand text-brand-foreground hover:bg-brand/90 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold transition-all duration-200 hover:scale-105"
              >
                Explore Music &amp; News
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/music"
                className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-full border px-8 py-3.5 text-base font-semibold transition-colors"
              >
                <Download className="h-4 w-4" />
                Free Downloads
              </Link>
            </div>

            {/* Stats row */}
            <div className="border-border/40 mt-4 flex flex-wrap items-center justify-center gap-8 border-t pt-8">
              {[
                { icon: Music, label: "Tracks Available", value: "10,000+" },
                { icon: Newspaper, label: "Stories Published", value: "5,000+" },
                { icon: Download, label: "Downloads Daily", value: "50,000+" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <Icon className="text-brand h-4 w-4" />
                    <span className="text-2xl font-black">{value}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LATEST DROPS (music) ────────────────────────────────────────── */}
      {tracks.length > 0 && (
        <section className="bg-foreground/3 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              icon={<TrendingUp className="text-brand h-4 w-4" />}
              label="Hot Right Now"
              title="Latest Drops"
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

      {/* ── FEATURED STORY + GRID ───────────────────────────────────────── */}
      {featuredPost && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              icon={<Newspaper className="text-brand h-4 w-4" />}
              label="Top Stories"
              title="What's Happening"
              href="/api/enter?next=/"
              linkLabel="Read the Blog"
            />
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              {/* Big featured card */}
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

              {/* Grid of 4 smaller cards */}
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

      {/* ── FEATURES STRIP ──────────────────────────────────────────────── */}
      <section className="bg-foreground/3 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Music,
                title: "Free Music Downloads",
                desc: "Download your favourite Nigerian and Afrobeats tracks in high quality, for free.",
                href: "/music",
                cta: "Browse Music",
              },
              {
                icon: Newspaper,
                title: "Breaking Music News",
                desc: "Stay ahead with the latest news, album drops, and artist updates from the culture.",
                href: "/api/enter?next=/news",
                cta: "Read News",
              },
              {
                icon: TrendingUp,
                title: "Charts & Trending",
                desc: "See what everyone is listening to — daily charts, trending videos, and top artists.",
                href: "/api/enter?next=/explore",
                cta: "View Charts",
              },
            ].map(({ icon: Icon, title, desc, href, cta }) => (
              <Link
                key={title}
                href={href}
                className="bg-card ring-border/40 hover:ring-brand/40 group flex flex-col gap-4 rounded-2xl p-6 ring-1 transition-all duration-200 hover:scale-[1.01]"
              >
                <div className="bg-brand/10 flex h-11 w-11 items-center justify-center rounded-xl">
                  <Icon className="text-brand h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-foreground font-bold">{title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{desc}</p>
                </div>
                <span className="text-brand mt-auto flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2">
                  {cta} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ──────────────────────────────────────────────────── */}
      <section className="py-20">
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
      <footer className="border-border/40 border-t py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Logo
              logoLightUrl={settings.logoLight}
              logoDarkUrl={settings.logoDark}
              siteName={siteName}
            />
            <nav className="flex flex-wrap items-center justify-center gap-5 text-sm">
              {[
                { href: "/music", label: "Music" },
                { href: "/api/enter?next=/news", label: "News" },
                { href: "/artists", label: "Artists" },
                { href: "/api/enter?next=/", label: "Blog" },
                { href: "/login", label: "Sign in" },
              ].map(({ href, label }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <p className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Small reusable section header ── */
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
        <h2
          className="text-2xl font-black sm:text-3xl"
          dangerouslySetInnerHTML={{ __html: title }}
        />
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
