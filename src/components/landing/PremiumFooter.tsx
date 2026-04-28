import Link from "next/link";
import { Facebook, Instagram, Music, Send, Smartphone, Twitter, Youtube } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import type { PublicSettings } from "@/lib/settings";

type FooterColumn = {
  heading: string;
  links: Array<{ label: string; href: string }>;
};

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Discover",
    links: [
      { label: "New Music", href: "/music" },
      { label: "Top Charts", href: "/music?sort=trending" },
      { label: "Genres", href: "/music" },
      { label: "Artists", href: "/artists" },
      { label: "Albums", href: "/api/enter?next=/albums" },
      { label: "Playlists", href: "/api/enter?next=/playlists" },
    ],
  },
  {
    heading: "For Artists",
    links: [
      { label: "Submit Your Music", href: "/api/enter?next=/dashboard/music/upload" },
      { label: "Promote a Song", href: "/api/enter?next=/promote" },
      { label: "Verified Artist Program", href: "/api/enter?next=/dashboard/artist/verify" },
      { label: "Distribution", href: "/api/enter?next=/distribution" },
      { label: "Artist Resources", href: "/api/enter?next=/help/artists" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Press", href: "/press" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Newsroom", href: "/api/enter?next=/" },
    ],
  },
  {
    heading: "Help & Legal",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "DMCA / Copyright", href: "/dmca" },
      { label: "Acceptable Use", href: "/acceptable-use" },
    ],
  },
];

type SocialLink = { icon: typeof Instagram; label: string; href: string };

function buildSocialLinks(settings: PublicSettings): SocialLink[] {
  const result: SocialLink[] = [];
  const wrap = (handle: string, prefix: string): string =>
    handle.startsWith("http") ? handle : `${prefix}${handle.replace(/^@/, "")}`;

  if (settings.instagram)
    result.push({
      icon: Instagram,
      label: "Instagram",
      href: wrap(settings.instagram, "https://instagram.com/"),
    });
  if (settings.twitter)
    result.push({
      icon: Twitter,
      label: "X / Twitter",
      href: wrap(settings.twitter, "https://x.com/"),
    });
  if (settings.tiktok)
    result.push({
      icon: Music,
      label: "TikTok",
      href: wrap(settings.tiktok, "https://tiktok.com/@"),
    });
  if (settings.youtube)
    result.push({
      icon: Youtube,
      label: "YouTube",
      href: wrap(settings.youtube, "https://youtube.com/@"),
    });
  if (settings.facebook)
    result.push({
      icon: Facebook,
      label: "Facebook",
      href: wrap(settings.facebook, "https://facebook.com/"),
    });
  if (settings.telegram)
    result.push({ icon: Send, label: "Telegram", href: wrap(settings.telegram, "https://t.me/") });

  return result;
}

export function PremiumFooter({ settings }: { settings: PublicSettings }) {
  const siteName = settings.siteName || "Soundloaded";
  const tagline = settings.tagline || "The home of Afrobeats — stream, download, discover.";
  const socials = buildSocialLinks(settings);
  const year = new Date().getFullYear();
  const copyrightLine = settings.copyrightText
    ? `© ${year} ${settings.copyrightText}`
    : `© ${year} ${siteName}. All rights reserved.`;

  return (
    <footer className="border-border/40 bg-background border-t">
      {/* Top band — brand + 4 link columns */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] lg:gap-8">
          {/* Brand column */}
          <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
            <Logo
              logoLightUrl={settings.logoLight}
              logoDarkUrl={settings.logoDark}
              siteName={siteName}
            />
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">{tagline}</p>

            {socials.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {socials.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="border-border/60 text-muted-foreground hover:text-foreground hover:border-brand/50 hover:bg-brand/5 inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}

            {settings.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {settings.contactEmail}
              </a>
            )}
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-4">
              <h3 className="text-foreground text-sm font-bold tracking-wider uppercase">
                {col.heading}
              </h3>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-border/40 border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
          <p className="text-muted-foreground text-xs">{copyrightLine}</p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <span className="text-muted-foreground inline-flex items-center gap-1.5">
              Made in Lagos <span aria-hidden="true">🇳🇬</span>
            </span>
            <span className="text-border/60" aria-hidden="true">
              ·
            </span>
            <Link
              href="/api/enter?next=/install"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <Smartphone className="h-3.5 w-3.5" />
              Install Soundloaded
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
