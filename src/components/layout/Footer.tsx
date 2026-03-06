"use client";

import Link from "next/link";
import { Instagram, Twitter, Youtube, Facebook, Music, Send, Phone } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/hooks/useSettings";

const FOOTER_LINKS = {
  Content: [
    { href: "/news", label: "Music News" },
    { href: "/music", label: "Free Downloads" },
    { href: "/gist", label: "Gist" },
    { href: "/albums", label: "Albums" },
    { href: "/artists", label: "Artists" },
  ],
  Company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/advertise", label: "Advertise" },
    { href: "/submit-music", label: "Submit Music" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Use" },
    { href: "/dmca", label: "DMCA" },
  ],
};

const SOCIAL_ICON_MAP: Record<string, typeof Instagram> = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  facebook: Facebook,
  tiktok: Music,
  spotify: Music,
  telegram: Send,
  whatsapp: Phone,
};

const SOCIAL_URL_MAP: Record<string, (handle: string) => string> = {
  instagram: (h) => `https://instagram.com/${h}`,
  twitter: (h) => `https://twitter.com/${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  facebook: (h) => `https://facebook.com/${h}`,
  tiktok: (h) => `https://tiktok.com/@${h}`,
  spotify: (h) => (h.startsWith("http") ? h : `https://open.spotify.com/artist/${h}`),
  telegram: (h) => `https://t.me/${h}`,
  whatsapp: (h) => `https://wa.me/${h}`,
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  twitter: "Twitter/X",
  youtube: "YouTube",
  facebook: "Facebook",
  tiktok: "TikTok",
  spotify: "Spotify",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
};

export function Footer() {
  const { data: settings } = useSettings();

  const socialLinks = settings
    ? (
        [
          "instagram",
          "twitter",
          "youtube",
          "facebook",
          "tiktok",
          "spotify",
          "telegram",
          "whatsapp",
        ] as const
      )
        .filter((key) => settings[key])
        .map((key) => ({
          href: SOCIAL_URL_MAP[key](settings[key]),
          label: SOCIAL_LABELS[key],
          icon: SOCIAL_ICON_MAP[key],
        }))
    : [
        { href: "https://instagram.com/soundloadedng", label: "Instagram", icon: Instagram },
        { href: "https://twitter.com/soundloadedng", label: "Twitter/X", icon: Twitter },
        { href: "https://youtube.com/@soundloadedng", label: "YouTube", icon: Youtube },
        { href: "https://facebook.com/soundloadedng", label: "Facebook", icon: Facebook },
      ];

  const copyrightText = settings?.copyrightText || "Soundloaded Nigeria. All rights reserved.";
  const tagline =
    settings?.tagline ||
    "Nigeria's #1 music blog — latest Afrobeats news, free music downloads, artist profiles, and gist. Empowering African artists since day one.";

  return (
    <footer className="border-border bg-card border-t">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        {/* Top row */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-2">
            <Logo
              logoLightUrl={settings?.logoLight}
              logoDarkUrl={settings?.logoDark}
              siteName={settings?.siteName}
            />
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">{tagline}</p>

            {/* Social icons */}
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="border-border text-muted-foreground hover:text-brand hover:border-brand flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="space-y-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                {category}
              </p>
              <ul className="space-y-2">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter strip */}
        <div className="bg-muted mt-10 rounded-xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-foreground font-semibold">Stay in the loop</p>
              <p className="text-muted-foreground text-sm">
                Get new music drops delivered to your inbox. No spam.
              </p>
            </div>
            <NewsletterForm compact />
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom bar */}
        <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-xs sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {copyrightText}
          </p>
          <p>Built with love for African music</p>
        </div>
      </div>
    </footer>
  );
}
