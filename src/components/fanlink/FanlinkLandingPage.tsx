"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Mail, Heart, ShoppingBag, Music, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReleaseDateCountdown } from "./ReleaseDateCountdown";

export type PlatformLink = {
  platform: string;
  url: string;
  label?: string;
  isEnabled: boolean;
  sortOrder: number;
};

export type FanlinkVariantData = {
  id: string;
  label: string;
  title?: string | null;
  description?: string | null;
  coverArt?: string | null;
  accentColor?: string | null;
  platformLinks: PlatformLink[];
};

export type FanlinkData = {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  type: string;
  releaseDate?: string | null;
  description?: string | null;
  coverArt?: string | null;
  bgColor?: string | null;
  accentColor?: string | null;
  buttonStyle: string;
  pageTheme: string;
  platformLinks: PlatformLink[];
  emailCaptureEnabled: boolean;
  emailCapturePrompt: string;
  showSocialIcons: boolean;
  tipEnabled: boolean;
  tipLabel: string;
  tipAmounts: number[];
  merchUrl?: string | null;
  merchLabel?: string | null;
  preSaveEnabled: boolean;
  preSaveSpotifyUrl?: string | null;
  preSaveAppleUrl?: string | null;
  preSaveDeezerUrl?: string | null;
  preSaveMessage: string;
  fanGateEnabled: boolean;
  fanGateAction: "follow" | "share" | "both";
  fanGateSpotifyUrl?: string | null;
  fanGateTwitterText?: string | null;
  abEnabled: boolean;
  abSplit: number;
  variants: FanlinkVariantData[];
  artist?: {
    instagram?: string | null;
    twitter?: string | null;
    facebook?: string | null;
    spotify?: string | null;
    youtube?: string | null;
    tiktok?: string | null;
    soundcloud?: string | null;
    boomplay?: string | null;
    website?: string | null;
  };
};

const PLATFORM_ICONS: Record<string, string> = {
  soundloaded: "🎵",
  audiomack: "🎶",
  boomplay: "🔊",
  spotify: "🎧",
  "apple music": "🍎",
  "youtube music": "▶️",
  youtube: "▶️",
  deezer: "🎼",
  tidal: "🌊",
  "amazon music": "📦",
  soundcloud: "☁️",
  tiktok: "🎤",
};

function getPlatformIcon(platform: string): string {
  return PLATFORM_ICONS[platform.toLowerCase()] ?? "🔗";
}

function formatKoboToNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

function generateSessionId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type Props = {
  fanlink: FanlinkData;
};

export function FanlinkLandingPage({ fanlink }: Props) {
  const [sessionId] = useState(() =>
    typeof window !== "undefined"
      ? (sessionStorage.getItem("fl_sid") ??
        (() => {
          const id = generateSessionId();
          sessionStorage.setItem("fl_sid", id);
          return id;
        })())
      : generateSessionId()
  );

  const searchParams = useSearchParams();
  const [emailUnlocked, setEmailUnlocked] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [tipEmail, setTipEmail] = useState("");
  const [tipLoading, setTipLoading] = useState<number | null>(null);
  const [tipSuccess, setTipSuccess] = useState(searchParams?.get("tip") === "success");

  const [fanGateUnlocked, setFanGateUnlocked] = useState(false);
  const [activeVariant, setActiveVariant] = useState<FanlinkVariantData | null>(null);

  useEffect(() => {
    if (fanlink.abEnabled && fanlink.variants.length > 0) {
      const roll = Math.random() * 100;
      if (roll < fanlink.abSplit) {
        setActiveVariant(fanlink.variants[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accentColor = activeVariant?.accentColor ?? fanlink.accentColor ?? "#e11d48";
  const isDark = fanlink.pageTheme === "dark" || fanlink.pageTheme === "auto";
  const displayTitle = activeVariant?.title ?? fanlink.title;
  const displayCoverArt = activeVariant?.coverArt ?? fanlink.coverArt;
  const displayDescription = activeVariant?.description ?? fanlink.description;
  const sourcePlatformLinks = activeVariant?.platformLinks.length
    ? activeVariant.platformLinks
    : fanlink.platformLinks;
  const enabledLinks = sourcePlatformLinks
    .filter((l) => l.isEnabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const recordClick = useCallback(
    async (platform?: string) => {
      try {
        await fetch(`/api/fanlink/${fanlink.slug}/click`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: platform ?? null, sessionId }),
        });
      } catch {
        // fire-and-forget
      }
    },
    [fanlink.slug, sessionId]
  );

  useEffect(() => {
    recordClick();
  }, [recordClick]);

  const handlePlatformClick = (link: PlatformLink) => {
    recordClick(link.platform);
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  const handleTip = async (amount: number) => {
    if (!tipEmail || !/^[^@]+@[^@]+\.[^@]+$/.test(tipEmail)) {
      return;
    }
    setTipLoading(amount);
    try {
      const res = await fetch(`/api/fanlink/${fanlink.slug}/tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, email: tipEmail }),
      });
      const data = await res.json();
      if (!res.ok) return;
      window.location.href = data.authorization_url;
    } catch {
      // noop
    } finally {
      setTipLoading(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailSubmitting(true);
    try {
      const res = await fetch(`/api/fanlink/${fanlink.slug}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      if (!res.ok) {
        const data = await res.json();
        setEmailError(data.error ?? "Something went wrong");
        return;
      }
      setEmailUnlocked(true);
    } catch {
      setEmailError("Network error, please try again");
    } finally {
      setEmailSubmitting(false);
    }
  };

  const showLinks =
    (!fanlink.emailCaptureEnabled || emailUnlocked) && (!fanlink.fanGateEnabled || fanGateUnlocked);

  const buttonClass = cn(
    "w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
    fanlink.buttonStyle === "pill" && "rounded-full",
    fanlink.buttonStyle === "outline"
      ? isDark
        ? "border border-white/20 text-white bg-white/5 hover:bg-white/10"
        : "border border-black/20 text-black bg-black/5 hover:bg-black/10"
      : isDark
        ? "bg-white/10 text-white hover:bg-white/15"
        : "bg-black/5 text-black hover:bg-black/10"
  );

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{
        background: fanlink.bgColor
          ? `linear-gradient(135deg, ${fanlink.bgColor}cc 0%, ${isDark ? "#0a0a0a" : "#f8f8f8"} 60%)`
          : isDark
            ? "linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 60%)"
            : "linear-gradient(135deg, #f0f0f5 0%, #ffffff 60%)",
      }}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-md overflow-hidden rounded-3xl shadow-2xl",
          isDark
            ? "border border-white/10 bg-black/60 backdrop-blur-xl"
            : "border border-black/10 bg-white/80 backdrop-blur-xl"
        )}
      >
        {/* Cover Art */}
        <div className="relative aspect-square w-full overflow-hidden">
          {displayCoverArt ? (
            <Image
              src={displayCoverArt}
              alt={`${displayTitle} by ${fanlink.artistName}`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 448px) 100vw, 448px"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}80)` }}
            >
              <Music className="h-20 w-20 text-white/60" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Type badge */}
          <div className="absolute top-4 left-4">
            <Badge
              className="border-white/20 bg-black/40 text-[10px] tracking-wider text-white uppercase backdrop-blur-sm"
              variant="outline"
            >
              {fanlink.type}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 pt-5 pb-2">
          <h1
            className={cn(
              "text-2xl leading-tight font-black tracking-tight",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            {displayTitle}
          </h1>
          <p
            className={cn("mt-1 text-sm font-semibold", isDark ? "text-white/60" : "text-gray-500")}
          >
            {fanlink.artistName}
          </p>
          {displayDescription && (
            <p
              className={cn(
                "mt-2 text-[13px] leading-relaxed",
                isDark ? "text-white/50" : "text-gray-500"
              )}
            >
              {displayDescription}
            </p>
          )}
        </div>

        {/* Email capture gate */}
        {fanlink.emailCaptureEnabled && !emailUnlocked && (
          <div className="px-6 pb-4">
            <p
              className={cn(
                "mb-3 text-center text-sm font-medium",
                isDark ? "text-white/70" : "text-gray-600"
              )}
            >
              {fanlink.emailCapturePrompt}
            </p>
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                required
                className={cn(
                  "rounded-xl",
                  isDark ? "border-white/20 bg-white/10 text-white placeholder:text-white/40" : ""
                )}
              />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              <Button
                type="submit"
                disabled={emailSubmitting}
                className="rounded-xl font-semibold"
                style={{ backgroundColor: accentColor }}
              >
                <Mail className="mr-2 h-4 w-4" />
                {emailSubmitting ? "Submitting..." : "Unlock"}
              </Button>
            </form>
          </div>
        )}

        {/* Release date countdown */}
        {fanlink.releaseDate && new Date(fanlink.releaseDate) > new Date() && (
          <ReleaseDateCountdown
            releaseDate={fanlink.releaseDate}
            isDark={isDark}
            accentColor={accentColor}
          />
        )}

        {/* Pre-save banner */}
        {fanlink.preSaveEnabled && (
          <div
            className={cn(
              "mx-6 mb-3 space-y-3 rounded-xl p-4",
              isDark ? "border border-white/10 bg-white/5" : "border border-black/8 bg-black/3"
            )}
          >
            <p
              className={cn(
                "text-center text-sm font-semibold",
                isDark ? "text-white/80" : "text-gray-700"
              )}
            >
              {fanlink.preSaveMessage}
            </p>
            <div className="flex flex-col gap-2">
              {fanlink.preSaveSpotifyUrl && (
                <a
                  href={fanlink.preSaveSpotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClass, "justify-center")}
                  style={{
                    backgroundColor: `${accentColor}22`,
                    borderColor: `${accentColor}44`,
                    color: accentColor,
                  }}
                >
                  <span className="text-lg">🎧</span>
                  <span>Pre-Save on Spotify</span>
                </a>
              )}
              {fanlink.preSaveAppleUrl && (
                <a
                  href={fanlink.preSaveAppleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClass, "justify-center")}
                  style={{
                    backgroundColor: `${accentColor}22`,
                    borderColor: `${accentColor}44`,
                    color: accentColor,
                  }}
                >
                  <span className="text-lg">🍎</span>
                  <span>Pre-Add on Apple Music</span>
                </a>
              )}
              {fanlink.preSaveDeezerUrl && (
                <a
                  href={fanlink.preSaveDeezerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClass, "justify-center")}
                  style={{
                    backgroundColor: `${accentColor}22`,
                    borderColor: `${accentColor}44`,
                    color: accentColor,
                  }}
                >
                  <span className="text-lg">🎼</span>
                  <span>Pre-Save on Deezer</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Fan-gate */}
        {fanlink.fanGateEnabled && !fanGateUnlocked && (
          <div
            className={cn(
              "mx-6 mb-3 space-y-3 rounded-xl p-5 text-center",
              isDark ? "border border-white/10 bg-white/5" : "border border-black/8 bg-black/3"
            )}
          >
            <p className={cn("text-base font-bold", isDark ? "text-white" : "text-gray-800")}>
              🔒 Unlock Streaming Links
            </p>
            <p className={cn("text-xs", isDark ? "text-white/50" : "text-gray-500")}>
              {fanlink.fanGateAction === "follow" && "Follow on Spotify to unlock"}
              {fanlink.fanGateAction === "share" && "Share on Twitter/X to unlock"}
              {fanlink.fanGateAction === "both" && "Follow & share to unlock"}
            </p>
            <div className="flex flex-col gap-2">
              {(fanlink.fanGateAction === "follow" || fanlink.fanGateAction === "both") &&
                fanlink.fanGateSpotifyUrl && (
                  <a
                    href={fanlink.fanGateSpotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonClass, "justify-center")}
                    style={{
                      backgroundColor: "#1DB95422",
                      borderColor: "#1DB95444",
                      color: "#1DB954",
                    }}
                  >
                    <span className="text-lg">🎧</span>
                    <span>Follow on Spotify</span>
                  </a>
                )}
              {(fanlink.fanGateAction === "share" || fanlink.fanGateAction === "both") && (
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(fanlink.fanGateTwitterText ?? `I just discovered ${fanlink.title} by ${fanlink.artistName}!`)}&url=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClass, "justify-center")}
                  style={{
                    backgroundColor: "#1DA1F222",
                    borderColor: "#1DA1F244",
                    color: "#1DA1F2",
                  }}
                >
                  <span className="text-lg">𝕏</span>
                  <span>Share on Twitter/X</span>
                </a>
              )}
            </div>
            <button
              onClick={() => setFanGateUnlocked(true)}
              className={cn(
                "mt-1 text-xs underline",
                isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
              )}
            >
              I already did this — unlock
            </button>
          </div>
        )}

        {/* Platform links */}
        {showLinks && (
          <div className="space-y-2.5 px-6 pb-4">
            {enabledLinks.length > 0 ? (
              enabledLinks.map((link) => (
                <button
                  key={`${link.platform}-${link.sortOrder}`}
                  onClick={() => handlePlatformClick(link)}
                  className={buttonClass}
                >
                  <span className="w-7 flex-shrink-0 text-center text-xl">
                    {getPlatformIcon(link.platform)}
                  </span>
                  <span className="flex-1 text-left">
                    {link.label || `Listen on ${link.platform}`}
                  </span>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-50" />
                </button>
              ))
            ) : (
              <p
                className={cn(
                  "py-4 text-center text-sm",
                  isDark ? "text-white/40" : "text-gray-400"
                )}
              >
                No streaming links added yet
              </p>
            )}
          </div>
        )}

        {/* Monetization */}
        {showLinks && (fanlink.tipEnabled || fanlink.merchUrl) && (
          <div className="space-y-2.5 px-6 pb-4">
            <div className={cn("my-1 border-t", isDark ? "border-white/10" : "border-black/10")} />

            {fanlink.merchUrl && (
              <a
                href={fanlink.merchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonClass, "no-underline")}
                onClick={() => recordClick("merch")}
              >
                <ShoppingBag className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1 text-left">{fanlink.merchLabel ?? "Buy Merch"}</span>
                <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-50" />
              </a>
            )}

            {fanlink.tipEnabled && (
              <div
                className={cn(
                  "space-y-3 rounded-xl p-4",
                  isDark ? "border border-white/10 bg-white/5" : "border border-black/8 bg-black/3"
                )}
              >
                {tipSuccess ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    <p
                      className={cn(
                        "text-center text-sm font-semibold",
                        isDark ? "text-white/80" : "text-gray-700"
                      )}
                    >
                      Thank you for your support! 🎉
                    </p>
                    <button
                      onClick={() => setTipSuccess(false)}
                      className="text-xs underline opacity-60"
                    >
                      Tip again
                    </button>
                  </div>
                ) : (
                  <>
                    <p
                      className={cn(
                        "flex items-center gap-2 text-sm font-semibold",
                        isDark ? "text-white/80" : "text-gray-700"
                      )}
                    >
                      <Heart className="h-4 w-4 text-pink-500" />
                      {fanlink.tipLabel}
                    </p>
                    <Input
                      type="email"
                      value={tipEmail}
                      onChange={(e) => setTipEmail(e.target.value)}
                      placeholder="Your email for receipt"
                      className={cn(
                        "h-9 text-sm",
                        isDark
                          ? "border-white/20 bg-white/10 text-white placeholder:text-white/40"
                          : "border-black/15 bg-black/5 text-black placeholder:text-black/40"
                      )}
                    />
                    <div className="flex flex-wrap gap-2">
                      {fanlink.tipAmounts.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => handleTip(amount)}
                          disabled={tipLoading !== null || !tipEmail}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50",
                            isDark
                              ? "border border-pink-500/30 bg-pink-500/20 text-pink-300 hover:bg-pink-500/30"
                              : "border border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100"
                          )}
                        >
                          {tipLoading === amount ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          {formatKoboToNaira(amount)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          className={cn(
            "px-6 py-4 text-center text-[11px]",
            isDark ? "text-white/25" : "text-gray-400"
          )}
        >
          Powered by{" "}
          <Link
            href="/"
            className={cn("font-bold hover:underline", isDark ? "text-white/50" : "text-gray-600")}
          >
            Soundloaded
          </Link>
        </div>
      </div>
    </div>
  );
}
