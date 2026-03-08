import Image from "next/image";
import Link from "next/link";
import { Instagram, Twitter, Mic2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ArtistSidebarCardProps {
  artist: {
    name: string;
    slug: string;
    photo: string | null;
    genre: string | null;
    bio: string | null;
    country: string | null;
    instagram: string | null;
    twitter: string | null;
  };
}

export function ArtistSidebarCard({ artist }: ArtistSidebarCardProps) {
  const socialLinks = [
    { url: artist.instagram, icon: Instagram, label: "Instagram" },
    { url: artist.twitter, icon: Twitter, label: "Twitter" },
  ].filter((s) => !!s.url);

  return (
    <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
      <div className="border-border/50 flex items-center gap-2 border-b px-4 py-3">
        <div className="bg-brand/10 flex h-7 w-7 items-center justify-center rounded-lg">
          <Mic2 className="text-brand h-3.5 w-3.5" />
        </div>
        <h3 className="text-foreground text-sm font-bold">About the Artist</h3>
      </div>

      <div className="flex flex-col items-center p-4">
        <div className="bg-muted ring-border relative h-20 w-20 overflow-hidden rounded-full ring-2">
          {artist.photo ? (
            <Image
              src={artist.photo}
              alt={artist.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Mic2 className="text-muted-foreground/30 h-8 w-8" />
            </div>
          )}
        </div>

        <Link
          href={`/artists/${artist.slug}`}
          className="text-foreground hover:text-brand mt-3 text-sm font-bold transition-colors"
        >
          {artist.name}
        </Link>

        {artist.genre && (
          <Badge variant="secondary" className="mt-1.5 text-[10px]">
            {artist.genre}
          </Badge>
        )}

        {artist.bio && (
          <p className="text-muted-foreground mt-2 line-clamp-2 text-center text-xs leading-relaxed">
            {artist.bio}
          </p>
        )}

        {socialLinks.length > 0 && (
          <div className="mt-3 flex gap-2">
            {socialLinks.map(({ url, icon: Icon, label }) => (
              <a
                key={label}
                href={url!}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border text-muted-foreground hover:text-brand hover:border-brand flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        )}

        <Link
          href={`/artists/${artist.slug}`}
          className="text-brand mt-3 text-xs font-semibold hover:underline"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
