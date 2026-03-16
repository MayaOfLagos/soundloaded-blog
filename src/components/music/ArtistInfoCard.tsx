"use client";

import Link from "next/link";
import Image from "next/image";
import { Music, MapPin, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ArtistInfoCardProps {
  artist: {
    name: string;
    slug: string;
    photo: string | null;
    bio: string | null;
    country: string | null;
    genre: string | null;
    instagram: string | null;
    twitter: string | null;
    facebook: string | null;
    spotify: string | null;
    appleMusic: string | null;
  };
  songCount: number;
  className?: string;
}

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

const socialLinks = [
  {
    key: "instagram" as const,
    icon: InstagramIcon,
    label: "Instagram",
    baseUrl: "https://instagram.com/",
  },
  { key: "twitter" as const, icon: XIcon, label: "X (Twitter)", baseUrl: "https://x.com/" },
  { key: "spotify" as const, icon: SpotifyIcon, label: "Spotify", baseUrl: "" },
  { key: "appleMusic" as const, icon: ExternalLink, label: "Apple Music", baseUrl: "" },
  {
    key: "facebook" as const,
    icon: ExternalLink,
    label: "Facebook",
    baseUrl: "https://facebook.com/",
  },
] as const;

export function ArtistInfoCard({ artist, songCount, className }: ArtistInfoCardProps) {
  const hasSocials = socialLinks.some((s) => artist[s.key]);

  return (
    <div
      className={cn("bg-card/50 ring-border/40 rounded-2xl p-5 ring-1 backdrop-blur-sm", className)}
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <Link
          href={`/artists/${artist.slug}`}
          className="bg-muted relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full"
        >
          {artist.photo ? (
            <Image
              src={artist.photo}
              alt={artist.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="from-brand/20 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
              <Music className="text-muted-foreground/40 h-8 w-8" />
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <Link
            href={`/artists/${artist.slug}`}
            className="text-foreground text-lg font-bold hover:underline"
          >
            {artist.name}
          </Link>

          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
            {artist.country && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {artist.country}
              </span>
            )}
            {artist.genre && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {artist.genre}
              </Badge>
            )}
            <span>
              {songCount} {songCount === 1 ? "song" : "songs"}
            </span>
          </div>

          {artist.bio && (
            <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{artist.bio}</p>
          )}
        </div>
      </div>

      {/* Social links + View all */}
      <div className="mt-4 flex items-center justify-between">
        {hasSocials && (
          <div className="flex items-center gap-2">
            {socialLinks.map((s) => {
              const value = artist[s.key];
              if (!value) return null;
              const href = value.startsWith("http") ? value : `${s.baseUrl}${value}`;
              const Icon = s.icon;
              return (
                <a
                  key={s.key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  aria-label={s.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              );
            })}
          </div>
        )}

        <Link
          href={`/artists/${artist.slug}`}
          className="text-brand ml-auto text-xs font-semibold hover:underline"
        >
          View all songs
        </Link>
      </div>
    </div>
  );
}
