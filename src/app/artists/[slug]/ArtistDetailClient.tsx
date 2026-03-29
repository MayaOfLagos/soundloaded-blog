"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Music,
  Mic2,
  MapPin,
  Disc,
  Download,
  BadgeCheck,
  ExternalLink,
  Share2,
  UserPlus,
  UserCheck,
  LayoutGrid,
  Info,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { usePlayerStore } from "@/store/player.store";
import type { Track } from "@/store/player.store";
import { ScrollShelf } from "@/components/music/ScrollShelf";
import { MusicShelfCard } from "@/components/music/MusicShelfCard";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useArtistFollow } from "@/hooks/useArtistFollow";
import { cn, formatDuration } from "@/lib/utils";
import type { MusicCardData, AlbumCardData } from "@/lib/api/music";

/* ─── Types ─── */

interface ArtistData {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photo: string | null;
  coverImage: string | null;
  country: string | null;
  genre: string | null;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  spotify: string | null;
  appleMusic: string | null;
}

interface PopularTrack {
  id: string;
  title: string;
  slug: string;
  r2Key: string;
  coverArt: string | null;
  duration: number | null;
  downloadCount: number;
  albumTitle: string | null;
  enableDownload: boolean;
}

interface ArtistDetailClientProps {
  artist: ArtistData;
  stats: { songCount: number; albumCount: number; totalDownloads: number };
  popularTracks: PopularTrack[];
  allTracks: MusicCardData[];
  albums: AlbumCardData[];
  siteUrl: string;
}

/* ─── Social Icon SVGs ─── */

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

const socialConfig = [
  {
    key: "instagram" as const,
    icon: InstagramIcon,
    label: "Instagram",
    baseUrl: "https://instagram.com/",
  },
  { key: "twitter" as const, icon: XIcon, label: "X", baseUrl: "https://x.com/" },
  { key: "spotify" as const, icon: SpotifyIcon, label: "Spotify", baseUrl: "" },
  { key: "appleMusic" as const, icon: ExternalLink, label: "Apple Music", baseUrl: "" },
  {
    key: "facebook" as const,
    icon: ExternalLink,
    label: "Facebook",
    baseUrl: "https://facebook.com/",
  },
] as const;

/* ─── Tab definitions ─── */

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "songs", label: "Songs", icon: Music },
  { id: "albums", label: "Albums & EPs", icon: Disc },
  { id: "about", label: "About", icon: Info },
];

type TabId = "overview" | "songs" | "albums" | "about";

const snappySpring = {
  type: "spring" as const,
  stiffness: 350,
  damping: 30,
  mass: 1,
};

const fastFade = {
  duration: 0.15,
  ease: "linear" as const,
};

/* ─── Equalizer mini bars ─── */

function EqualizerBarsMini({ className }: { className?: string }) {
  const bar = cn("w-[2px] rounded-full", className ?? "bg-brand");
  return (
    <div className="flex h-3 items-end gap-[2px]">
      <span className={cn(bar, "animate-[soundloaded-equalizer_0.4s_ease_infinite]")} />
      <span className={cn(bar, "animate-[soundloaded-equalizer_0.6s_ease_infinite_0.1s]")} />
      <span className={cn(bar, "animate-[soundloaded-equalizer_0.5s_ease_infinite_0.2s]")} />
    </div>
  );
}

/* ─── Main component ─── */

export function ArtistDetailClient({
  artist,
  stats,
  popularTracks,
  allTracks,
  albums,
  siteUrl,
}: ArtistDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [shareCopied, setShareCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for mobile browsers that block clipboard API
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = `${siteUrl}/artists/${artist.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: artist.name, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }
    await copyToClipboard(url);
  };

  const activeSocials = socialConfig.filter((s) => artist[s.key]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      {/* ── Hero: Cover Banner ── */}
      <div className="relative overflow-hidden rounded-t-2xl">
        <div className="aspect-[2.5/1] sm:aspect-[3/1]">
          {artist.coverImage ? (
            <Image
              src={artist.coverImage}
              alt={`${artist.name} cover`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          ) : (
            <div className="from-brand/30 via-brand/10 to-muted h-full w-full bg-gradient-to-br" />
          )}
          {/* Bottom gradient overlay */}
          <div className="from-background via-background/30 absolute inset-0 bg-gradient-to-t to-transparent" />
        </div>
      </div>

      {/* ── Profile section ── */}
      <div className="relative -mt-12 px-2 sm:-mt-16 sm:px-4">
        <div className="flex items-end gap-4 sm:gap-5">
          {/* Profile pic */}
          <ProfilePicViewer photo={artist.photo} name={artist.name} />

          {/* Name + meta */}
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-foreground truncate text-2xl font-black sm:text-3xl">
                {artist.name}
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BadgeCheck className="text-brand h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" />
                  </TooltipTrigger>
                  <TooltipContent>Verified Artist</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {artist.genre && (
                <Badge variant="secondary" className="text-xs">
                  {artist.genre}
                </Badge>
              )}
              {artist.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {artist.country}
                </span>
              )}
              <span>
                {stats.songCount} {stats.songCount === 1 ? "song" : "songs"}
              </span>
              {stats.albumCount > 0 && (
                <span>
                  {stats.albumCount} {stats.albumCount === 1 ? "album" : "albums"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <FollowButton artistId={artist.id} />

          <button
            type="button"
            onClick={handleShare}
            className={cn(
              "flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
              shareCopied
                ? "border-brand/30 bg-brand/10 text-brand"
                : "border-border text-foreground hover:bg-muted"
            )}
          >
            {shareCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {shareCopied ? "Copied!" : "Share"}
          </button>

          {activeSocials.length > 0 && (
            <div className="flex items-center gap-1.5">
              {activeSocials.map((s) => {
                const value = artist[s.key]!;
                const href = value.startsWith("http") ? value : `${s.baseUrl}${value}`;
                const Icon = s.icon;
                return (
                  <a
                    key={s.key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-muted text-muted-foreground hover:text-brand hover:bg-muted/70 flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                    aria-label={s.label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Bio preview */}
        {artist.bio && <ArtistBioPreview bio={artist.bio} artistName={artist.name} />}
      </div>

      {/* ── Tab Bar (animated-collection style) ── */}
      <div className="sticky top-[64px] z-30 mt-6 flex justify-center py-3">
        <div className="bg-muted border-border scrollbar-hide flex gap-1 overflow-x-auto rounded-full border p-1">
          {TABS.map((tab) => {
            if (tab.id === "albums" && albums.length === 0) return null;
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="artist-tab-pill"
                    className="bg-background absolute inset-0 rounded-full shadow-sm"
                    transition={snappySpring}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content (AnimatePresence switching) ── */}
      <div className="relative min-h-[300px] pt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
            transition={fastFade}
          >
            {activeTab === "overview" && (
              <OverviewTab
                popularTracks={popularTracks}
                allTracks={allTracks}
                albums={albums}
                artistName={artist.name}
                onSeeAllSongs={() => setActiveTab("songs")}
              />
            )}

            {activeTab === "songs" && <SongsTab tracks={allTracks} artistName={artist.name} />}

            {activeTab === "albums" && <AlbumsTab albums={albums} />}

            {activeTab === "about" && (
              <AboutTab artist={artist} stats={stats} activeSocials={activeSocials} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Profile Pic Viewer ─── */

function ProfilePicViewer({ photo, name }: { photo: string | null; name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => photo && setOpen(true)}
        className={cn(
          "ring-background bg-muted relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full ring-4 sm:h-32 sm:w-32",
          photo && "cursor-pointer"
        )}
      >
        {photo ? (
          <Image src={photo} alt={name} fill className="object-cover" priority sizes="128px" />
        ) : (
          <div className="from-brand/20 to-muted flex h-full items-center justify-center bg-gradient-to-br">
            <Mic2 className="text-muted-foreground/40 h-10 w-10 sm:h-12 sm:w-12" />
          </div>
        )}
      </button>

      {photo && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogPortal>
            <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
            <DialogPrimitive.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <DialogTitle className="sr-only">{name} profile photo</DialogTitle>
              <DialogPrimitive.Close className="bg-muted hover:bg-muted/80 text-foreground fixed top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full transition-colors">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
              <div className="relative h-[70vw] max-h-[500px] w-[70vw] max-w-[500px] overflow-hidden rounded-full">
                <Image src={photo} alt={name} fill className="object-cover" sizes="500px" />
              </div>
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>
      )}
    </>
  );
}

/* ─── Follow Button ─── */

function FollowButton({ artistId }: { artistId: string }) {
  const { isFollowing, followerCount, isPending, toggle } = useArtistFollow(artistId);

  return (
    <motion.button
      type="button"
      onClick={toggle}
      disabled={isPending}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
        isFollowing
          ? "bg-brand/10 text-brand border-brand/30 border"
          : "bg-brand text-brand-foreground hover:bg-brand/90"
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isFollowing ? "check" : "plus"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
      {isFollowing ? "Following" : "Follow"}
      {followerCount > 0 && (
        <span className="text-xs opacity-70">{followerCount.toLocaleString()}</span>
      )}
    </motion.button>
  );
}

/* ─── Bio Preview with "See more" dialog ─── */

function ArtistBioPreview({ bio, artistName }: { bio: string; artistName: string }) {
  const [showFull, setShowFull] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowFull(true)}
        className="bg-card/50 ring-border/40 hover:bg-card/70 mt-4 w-full rounded-xl p-4 text-left ring-1 backdrop-blur-sm transition-colors"
      >
        <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed whitespace-pre-line">
          {bio}
        </p>
        <span className="text-brand mt-1.5 inline-block text-xs font-semibold">See more</span>
      </button>

      <Dialog open={showFull} onOpenChange={setShowFull}>
        <DialogPortal>
          <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
          <DialogPrimitive.Content className="bg-background border-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed right-3 bottom-3 left-3 z-50 max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl duration-200 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:max-h-[80vh] sm:w-full sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%]">
            <div className="border-border bg-background/95 sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4 backdrop-blur-sm">
              <DialogTitle className="text-lg font-semibold">About {artistName}</DialogTitle>
              <DialogPrimitive.Close className="bg-muted hover:bg-muted/80 text-foreground flex h-8 w-8 items-center justify-center rounded-full transition-colors">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>
            <div className="px-5 py-5">
              <p className="text-foreground leading-relaxed whitespace-pre-line">{bio}</p>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}

/* ─── Tab Content: Overview ─── */

function OverviewTab({
  popularTracks,
  allTracks,
  albums,
  artistName,
  onSeeAllSongs,
}: {
  popularTracks: PopularTrack[];
  allTracks: MusicCardData[];
  albums: AlbumCardData[];
  artistName: string;
  onSeeAllSongs: () => void;
}) {
  return (
    <>
      {/* Popular Tracks */}
      {popularTracks.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-foreground text-lg font-bold">Popular</h2>
            {allTracks.length > 5 && (
              <button
                type="button"
                onClick={onSeeAllSongs}
                className="text-brand text-sm font-medium hover:underline"
              >
                See all
              </button>
            )}
          </div>
          <PopularTracksList tracks={popularTracks} artistName={artistName} />
        </div>
      )}

      {/* Albums shelf */}
      {albums.length > 0 && (
        <div className="mb-8">
          <ScrollShelf title="Discography">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/albums/${album.slug}`}
                className="group w-[160px] flex-shrink-0 sm:w-[180px]"
              >
                <div className="bg-muted relative aspect-square overflow-hidden rounded-xl">
                  {album.coverArt ? (
                    <Image
                      src={album.coverArt}
                      alt={album.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="180px"
                    />
                  ) : (
                    <div className="from-brand/10 to-muted flex h-full items-center justify-center bg-gradient-to-br">
                      <Disc className="text-muted-foreground/40 h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <p className="text-foreground group-hover:text-brand line-clamp-1 text-sm font-semibold transition-colors">
                    {album.title}
                  </p>
                  <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                    {album.releaseYear && <span>{album.releaseYear}</span>}
                    {album.releaseYear && album.trackCount > 0 && <span>·</span>}
                    {album.trackCount > 0 && (
                      <span>
                        {album.trackCount} {album.trackCount === 1 ? "track" : "tracks"}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </ScrollShelf>
        </div>
      )}

      {/* Latest tracks shelf */}
      {allTracks.length > 0 && (
        <ScrollShelf title="Latest Releases">
          {allTracks.slice(0, 10).map((track) => (
            <div key={track.id} className="w-[150px] flex-shrink-0 sm:w-[170px]">
              <MusicShelfCard track={track} shelfTracks={allTracks.slice(0, 10)} />
            </div>
          ))}
        </ScrollShelf>
      )}
    </>
  );
}

/* ─── Tab Content: Songs ─── */

function SongsTab({ tracks, artistName }: { tracks: MusicCardData[]; artistName: string }) {
  const { currentTrack, isPlaying, isBuffering, setTrack, togglePlay, setContextQueue } =
    usePlayerStore();

  const handlePlay = (track: MusicCardData, index: number) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    const queue: Track[] = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artistName,
      coverArt: t.coverArt ?? null,
      r2Key: t.r2Key,
      duration: 0,
      slug: t.slug,
    }));
    setContextQueue(queue, artistName);
    setTrack(queue[index]);
  };

  return tracks.length > 0 ? (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {tracks.map((track, index) => {
        const isCurrentTrack = currentTrack?.id === track.id;
        const isActivelyPlaying = isCurrentTrack && isPlaying;

        return (
          <div
            key={track.id}
            className="group overflow-hidden rounded-xl transition-all duration-200"
          >
            {/* Cover art — tap to play/pause */}
            <button
              type="button"
              onClick={() => handlePlay(track, index)}
              className="relative aspect-square w-full overflow-hidden"
              aria-label={isActivelyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            >
              {track.coverArt ? (
                <Image
                  src={track.coverArt}
                  alt={track.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="from-brand/10 to-muted flex h-full items-center justify-center bg-gradient-to-br">
                  <Music className="text-muted-foreground/50 h-12 w-12" />
                </div>
              )}

              {/* Loading / Equalizer overlay */}
              {isCurrentTrack && isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="bg-brand flex h-11 w-11 items-center justify-center rounded-full shadow-lg">
                    {isBuffering ? (
                      <svg
                        className="text-brand-foreground h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <EqualizerBarsMini className="bg-brand-foreground" />
                    )}
                  </div>
                </div>
              )}
            </button>

            {/* Track info — title + artist only */}
            <div className="p-2.5">
              <Link href={`/music/${track.slug}`}>
                <p
                  className={cn(
                    "line-clamp-1 text-sm font-semibold transition-colors",
                    isCurrentTrack ? "text-brand" : "text-foreground"
                  )}
                >
                  {track.title}
                </p>
              </Link>
              <p className="text-muted-foreground mt-0.5 truncate text-xs">{artistName}</p>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <p className="text-muted-foreground py-16 text-center text-sm">No songs uploaded yet.</p>
  );
}

/* ─── Tab Content: Albums ─── */

function AlbumsTab({ albums }: { albums: AlbumCardData[] }) {
  return albums.length > 0 ? (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {albums.map((album) => (
        <Link
          key={album.id}
          href={`/albums/${album.slug}`}
          className="group overflow-hidden rounded-xl transition-all duration-200"
        >
          {/* Cover art */}
          <div className="bg-muted relative aspect-square overflow-hidden rounded-xl">
            {album.coverArt ? (
              <Image
                src={album.coverArt}
                alt={album.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="from-brand/10 to-muted flex h-full items-center justify-center bg-gradient-to-br">
                <Disc className="text-muted-foreground/40 h-12 w-12" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pt-2.5 pb-1">
            <p className="text-foreground group-hover:text-brand line-clamp-1 text-sm font-semibold transition-colors">
              {album.title}
            </p>
            <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
              {album.releaseYear && <span>{album.releaseYear}</span>}
              {album.releaseYear && album.trackCount > 0 && <span>·</span>}
              {album.trackCount > 0 && (
                <span>
                  {album.trackCount} {album.trackCount === 1 ? "track" : "tracks"}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  ) : (
    <p className="text-muted-foreground py-16 text-center text-sm">No albums yet.</p>
  );
}

/* ─── Tab Content: About ─── */

function AboutTab({
  artist,
  stats,
  activeSocials,
}: {
  artist: ArtistData;
  stats: { songCount: number; albumCount: number; totalDownloads: number };
  activeSocials: typeof socialConfig extends readonly (infer T)[] ? T[] : never;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-[1fr,auto]">
      {/* Bio */}
      <div>
        {artist.bio ? (
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{artist.bio}</p>
        ) : (
          <p className="text-muted-foreground/60 italic">No biography available.</p>
        )}

        {/* Social links — labeled */}
        {activeSocials.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {activeSocials.map((s) => {
              const value = artist[s.key]!;
              const href = value.startsWith("http") ? value : `${s.baseUrl}${value}`;
              const Icon = s.icon;
              return (
                <a
                  key={s.key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border text-muted-foreground hover:text-brand hover:border-brand flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {s.label}
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats card */}
      <div className="bg-card ring-border/40 flex flex-col gap-4 rounded-2xl p-5 ring-1 sm:min-w-[200px]">
        <StatItem icon={Music} label="Songs" value={stats.songCount} />
        {stats.albumCount > 0 && <StatItem icon={Disc} label="Albums" value={stats.albumCount} />}
        {stats.totalDownloads > 0 && (
          <StatItem
            icon={Download}
            label="Downloads"
            value={stats.totalDownloads.toLocaleString()}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Stat item ─── */

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-muted/70 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
        <Icon className="text-muted-foreground h-4 w-4" />
      </div>
      <div>
        <p className="text-foreground text-lg leading-none font-bold">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </div>
    </div>
  );
}

/* ─── Popular Tracks List ─── */

function PopularTracksList({ tracks, artistName }: { tracks: PopularTrack[]; artistName: string }) {
  const { currentTrack, isPlaying, isBuffering, setTrack, togglePlay, setContextQueue } =
    usePlayerStore();

  const handlePlay = (track: PopularTrack, index: number) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    // Set queue from popular tracks
    const queue: Track[] = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: artistName,
      coverArt: t.coverArt,
      r2Key: t.r2Key,
      duration: t.duration ?? 0,
      slug: t.slug,
    }));
    setContextQueue(queue, artistName);
    setTrack(queue[index]);
  };

  return (
    <div className="space-y-1">
      {tracks.map((track, index) => {
        const isCurrentTrack = currentTrack?.id === track.id;
        const isActivelyPlaying = isCurrentTrack && isPlaying;

        return (
          <button
            key={track.id}
            type="button"
            onClick={() => handlePlay(track, index)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
              isCurrentTrack ? "bg-brand/5" : "hover:bg-muted/60"
            )}
          >
            {/* Number / Play indicator */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
              {isCurrentTrack && isPlaying && isBuffering ? (
                <svg className="text-brand h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : isActivelyPlaying ? (
                <EqualizerBarsMini />
              ) : (
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    isCurrentTrack ? "text-brand" : "text-muted-foreground group-hover:hidden"
                  )}
                >
                  {index + 1}
                </span>
              )}
              {!isActivelyPlaying && !isCurrentTrack && (
                <Play className="text-foreground hidden h-4 w-4 group-hover:block" />
              )}
            </div>

            {/* Cover art thumbnail */}
            <div className="bg-muted relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
              {track.coverArt ? (
                <Image
                  src={track.coverArt}
                  alt={track.title}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Music className="text-muted-foreground/40 h-4 w-4" />
                </div>
              )}
            </div>

            {/* Track info */}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-sm font-semibold",
                  isCurrentTrack ? "text-brand" : "text-foreground"
                )}
              >
                {track.title}
              </p>
              {track.albumTitle && (
                <p className="text-muted-foreground truncate text-xs">{track.albumTitle}</p>
              )}
            </div>

            {/* Duration + downloads */}
            <div className="text-muted-foreground hidden items-center gap-4 text-xs sm:flex">
              {track.downloadCount > 0 && (
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  {track.downloadCount.toLocaleString()}
                </span>
              )}
              {track.duration && (
                <span className="w-10 text-right tabular-nums">
                  {formatDuration(track.duration)}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
