import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Clock3,
  Disc3,
  Download,
  Headphones,
  ListChecks,
  Megaphone,
  Music,
  RadioTower,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
  Users,
} from "lucide-react";

import type { CreatorAnalyticsReport, CreatorAnalyticsMetric } from "@/lib/creator-analytics";
import type {
  ActionItem,
  ChecklistItem,
  CreatorCommandTrack,
  CreatorRosterArtist,
  CreatorStat,
} from "@/lib/creator-command-center";
import { cn, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreatorPromotionActions } from "@/components/dashboard/CreatorPromotionActions";

const STAT_ICONS: Record<string, LucideIcon> = {
  artists: Users,
  tracks: Music,
  streams: Headphones,
  downloads: Download,
  followers: Users,
  revenue: Banknote,
};

const ANALYTICS_ICONS: Record<CreatorAnalyticsMetric["key"], LucideIcon> = {
  qualifiedPlays: Headphones,
  downloads: Download,
  saves: CheckCircle2,
  shares: Share2,
  playlistAdds: ListChecks,
  followers: Users,
  paidDownloads: Banknote,
  grossSales: Banknote,
};

const ACTION_STYLES: Record<ActionItem["tone"], string> = {
  danger: "border-red-500/25 bg-red-500/10 text-red-500",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-500",
  info: "border-blue-500/25 bg-blue-500/10 text-blue-500",
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-500",
};

type CreatorHealthSignals = {
  missingArtworkCount?: number;
  pendingProcessingCount?: number;
  failedProcessingCount?: number;
  premiumTrackCount?: number;
  grossRevenue?: number;
  purchaseCount?: number;
  recentDownloadCount?: number;
  trackCount?: number;
  artistsWithoutMusic?: number;
  artistsWithoutPhoto?: number;
};

type CreatorInsight = {
  key: string;
  title: string;
  body: string;
  value?: string;
  tone: ActionItem["tone"];
  icon: LucideIcon;
};

function formatStatValue(stat: CreatorStat) {
  if (stat.key === "revenue") return `₦${formatNumber(stat.value)}`;
  return formatNumber(stat.value);
}

function formatPrice(track: CreatorCommandTrack) {
  const price = track.creatorPrice ?? track.price;
  if (!price) return null;
  return `₦${formatNumber(Math.round(price / 100))}`;
}

function trackHref(track: CreatorCommandTrack) {
  return `/music/${track.slug}`;
}

function profileScoreTone(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function formatAnalyticsValue(metric: CreatorAnalyticsMetric, value = metric.value) {
  if (metric.format === "currency") return `₦${formatNumber(Math.round(value / 100))}`;
  return formatNumber(value);
}

function deltaTone(metric: CreatorAnalyticsMetric) {
  if (metric.delta > 0) return "text-emerald-500";
  if (metric.delta < 0) return "text-red-500";
  return "text-muted-foreground";
}

function formatDelta(metric: CreatorAnalyticsMetric) {
  const sign = metric.delta > 0 ? "+" : metric.delta < 0 ? "-" : "";
  const value = formatAnalyticsValue(metric, Math.abs(metric.delta));
  const directionValue = `${sign}${value}`;
  if (metric.changePercent === null) return directionValue;
  return `${directionValue} (${sign}${Math.abs(metric.changePercent)}%)`;
}

function getMetric(
  analytics: CreatorAnalyticsReport,
  key: CreatorAnalyticsMetric["key"]
): CreatorAnalyticsMetric {
  return (
    analytics.metrics.find((metric) => metric.key === key) ?? {
      key,
      label: key,
      value: 0,
      previousValue: 0,
      delta: 0,
      changePercent: null,
      format: key === "grossSales" ? "currency" : "number",
    }
  );
}

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/+$/, "");
}

function absoluteTrackUrl(siteUrl: string, track: CreatorCommandTrack) {
  return `${normalizeSiteUrl(siteUrl)}${trackHref(track)}`;
}

function ogImageUrl(siteUrl: string, track: CreatorCommandTrack) {
  const params = new URLSearchParams({
    title: track.title,
    category: "MUSIC",
    author: track.artist.name,
  });

  return `${normalizeSiteUrl(siteUrl)}/api/og?${params.toString()}`;
}

function promotionCaption(track: CreatorCommandTrack, url: string) {
  return `New on Soundloaded: ${track.title} by ${track.artist.name}. Listen, save, and share here: ${url}`;
}

function isPremiumTrack(track: CreatorCommandTrack) {
  return track.accessModel !== "free" || track.streamAccess !== "free";
}

export function CreatorHero({
  title,
  name,
  description,
  image,
  imageAlt,
  verified,
  primaryActionHref,
  primaryActionLabel,
  secondaryActionHref,
  secondaryActionLabel,
}: {
  title: string;
  name: string;
  description: string;
  image?: string | null;
  imageAlt: string;
  verified: boolean;
  primaryActionHref: string;
  primaryActionLabel: string;
  secondaryActionHref: string;
  secondaryActionLabel: string;
}) {
  return (
    <section className="border-border/50 bg-card/60 overflow-hidden rounded-lg border">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {image ? (
            <Image
              src={image}
              alt={imageAlt}
              width={72}
              height={72}
              className="h-16 w-16 shrink-0 rounded-lg object-cover sm:h-[72px] sm:w-[72px]"
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-lg font-black sm:h-[72px] sm:w-[72px]">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-muted-foreground text-xs font-bold tracking-[0.16em] uppercase">
                {title}
              </p>
              {verified && (
                <Badge className="bg-brand/10 text-brand border-transparent text-[10px]">
                  <BadgeCheck className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            <h1 className="text-foreground mt-1 truncate text-2xl font-black">{name}</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button asChild size="sm">
            <Link href={primaryActionHref}>
              <Sparkles className="h-4 w-4" />
              {primaryActionLabel}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={secondaryActionHref}>
              {secondaryActionLabel}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function CreatorStatsGrid({ stats }: { stats: CreatorStat[] }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => {
        const Icon = STAT_ICONS[stat.key] ?? ShieldCheck;
        return (
          <div key={stat.key} className="border-border/50 bg-card/60 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs font-medium">{stat.label}</p>
                <p className="text-foreground mt-2 text-2xl font-black">{formatStatValue(stat)}</p>
              </div>
              <div className="bg-brand/10 text-brand flex h-9 w-9 items-center justify-center rounded-lg">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-muted-foreground mt-3 truncate text-xs">{stat.helper}</p>
          </div>
        );
      })}
    </section>
  );
}

export function CreatorAnalyticsSummary({ analytics }: { analytics: CreatorAnalyticsReport }) {
  const primaryMetrics = analytics.metrics.filter((metric) =>
    ["qualifiedPlays", "downloads", "saves", "shares", "grossSales"].includes(metric.key)
  );

  return (
    <section className="border-border/50 bg-card/60 rounded-lg border p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-brand h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold">Last {analytics.period.days} Days</h2>
        </div>
        <p className="text-muted-foreground text-xs">
          Compared with previous {analytics.period.days} days
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {primaryMetrics.map((metric) => {
          const Icon = ANALYTICS_ICONS[metric.key];
          const DeltaIcon = metric.delta >= 0 ? TrendingUp : TrendingDown;
          return (
            <div key={metric.key} className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-xs font-medium">{metric.label}</p>
                <Icon className="text-muted-foreground h-4 w-4" />
              </div>
              <p className="text-foreground mt-2 text-xl font-black">
                {formatAnalyticsValue(metric)}
              </p>
              <p
                className={cn(
                  "mt-2 flex items-center gap-1 text-xs font-semibold",
                  deltaTone(metric)
                )}
              >
                <DeltaIcon className="h-3.5 w-3.5" />
                {formatDelta(metric)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="text-foreground mb-3 text-xs font-bold tracking-[0.14em] uppercase">
            Play Sources
          </p>
          {analytics.sourceBreakdown.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
              No qualified play source data yet.
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.sourceBreakdown.slice(0, 5).map((source) => (
                <div key={source.surface}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-foreground truncate text-xs font-semibold">
                      {source.label}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {source.share}% · {formatNumber(source.count)}
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-brand h-full rounded-full"
                      style={{ width: `${Math.max(source.share, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-foreground mb-3 text-xs font-bold tracking-[0.14em] uppercase">
            Momentum Tracks
          </p>
          {analytics.topTracks.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
              Track momentum will appear after plays, downloads, saves, or purchases.
            </p>
          ) : (
            <div className="space-y-2">
              {analytics.topTracks.map((track) => (
                <Link
                  key={track.id}
                  href={`/music/${track.slug}`}
                  className="hover:bg-muted/40 flex items-center gap-3 rounded-lg p-2 transition-colors"
                >
                  {track.coverArt ? (
                    <Image
                      src={track.coverArt}
                      alt={track.title}
                      width={38}
                      height={38}
                      className="h-[38px] w-[38px] shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg">
                      <Music className="text-muted-foreground h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-semibold">{track.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {formatNumber(track.plays)} plays · {formatNumber(track.downloads)} downloads
                      · {formatNumber(track.shares)} shares
                    </p>
                  </div>
                  <ArrowUpRight className="text-muted-foreground h-4 w-4 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function CreatorPromotionKit({
  tracks,
  analytics,
  siteUrl,
  emptyHref,
  emptyLabel,
}: {
  tracks: CreatorCommandTrack[];
  analytics: CreatorAnalyticsReport;
  siteUrl: string;
  emptyHref: string;
  emptyLabel: string;
}) {
  const analyticsByTrackId = new Map(analytics.topTracks.map((track) => [track.id, track]));
  const displayTracks = tracks.filter((track) => track.processingStatus !== "failed").slice(0, 3);
  const hasOnlyFailedTracks = tracks.length > 0 && displayTracks.length === 0;

  return (
    <section className="border-border/50 bg-card/60 rounded-lg border p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="text-brand h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold">Promotion Kit</h2>
        </div>
        <Badge variant="outline" className="w-fit text-[10px]">
          Smart share assets
        </Badge>
      </div>

      {displayTracks.length === 0 ? (
        <div className="py-8 text-center">
          <RadioTower className="text-muted-foreground mx-auto h-9 w-9" />
          <p className="text-foreground mt-3 text-sm font-semibold">
            {hasOnlyFailedTracks ? "Fix failed releases before promoting them" : emptyLabel}
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href={emptyHref}>
              <Sparkles className="h-4 w-4" />
              {hasOnlyFailedTracks ? "Review releases" : "Start release"}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          {displayTracks.map((track) => {
            const momentum = analyticsByTrackId.get(track.id);
            const url = absoluteTrackUrl(siteUrl, track);
            const caption = promotionCaption(track, url);
            const imageUrl = ogImageUrl(siteUrl, track);
            const price = formatPrice(track);

            return (
              <div
                key={track.id}
                className="border-border/50 bg-background/40 rounded-lg border p-3"
              >
                <Link href={trackHref(track)} className="flex items-center gap-3">
                  {track.coverArt ? (
                    <Image
                      src={track.coverArt}
                      alt={track.title}
                      width={48}
                      height={48}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                      <Music className="text-muted-foreground h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-semibold">{track.title}</p>
                    <p className="text-muted-foreground truncate text-xs">{track.artist.name}</p>
                  </div>
                </Link>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge
                    variant={track.processingStatus === "failed" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {track.processingStatus}
                  </Badge>
                  {price && (
                    <Badge variant="outline" className="text-[10px]">
                      {price}
                    </Badge>
                  )}
                  {isPremiumTrack(track) && (
                    <Badge className="bg-brand/10 text-brand border-transparent text-[10px]">
                      Premium
                    </Badge>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-muted/30 rounded-md p-2">
                    <p className="text-muted-foreground">Plays</p>
                    <p className="text-foreground mt-1 font-black">
                      {formatNumber(momentum?.plays ?? track.streamCount)}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-md p-2">
                    <p className="text-muted-foreground">Saves</p>
                    <p className="text-foreground mt-1 font-black">
                      {formatNumber(momentum?.saves ?? 0)}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-md p-2">
                    <p className="text-muted-foreground">Shares</p>
                    <p className="text-foreground mt-1 font-black">
                      {formatNumber(momentum?.shares ?? 0)}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <CreatorPromotionActions url={url} caption={caption} imageUrl={imageUrl} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function CreatorInsightPanel({
  analytics,
  health,
  profileScore,
  scopeType,
}: {
  analytics: CreatorAnalyticsReport;
  health: CreatorHealthSignals;
  profileScore: number;
  scopeType: "artist" | "label";
}) {
  const plays = getMetric(analytics, "qualifiedPlays");
  const saves = getMetric(analytics, "saves");
  const shares = getMetric(analytics, "shares");
  const playlistAdds = getMetric(analytics, "playlistAdds");
  const grossSales = getMetric(analytics, "grossSales");
  const creatorLabel = scopeType === "label" ? "roster" : "artist";
  const insights: CreatorInsight[] = [];

  insights.push(
    shares.value > 0
      ? {
          key: "share-loop",
          title: "Share loop is active",
          body: `${formatAnalyticsValue(shares)} shares in ${analytics.period.days} days. Push the tracks already moving with fans.`,
          value: formatDelta(shares),
          tone: shares.delta >= 0 ? "success" : "warning",
          icon: Share2,
        }
      : {
          key: "share-loop",
          title: "Start the share loop",
          body: "Use the promotion kit to copy clean links, captions, and share artwork for your next push.",
          tone: "info",
          icon: Megaphone,
        }
  );

  if (saves.value > 0 || playlistAdds.value > 0) {
    insights.push({
      key: "save-depth",
      title: "Fan intent is showing",
      body: `${formatAnalyticsValue(saves)} saves and ${formatAnalyticsValue(playlistAdds)} playlist adds. Turn this into follows and repeat visits.`,
      value: formatDelta(saves),
      tone: saves.delta >= 0 ? "success" : "info",
      icon: Target,
    });
  }

  if (grossSales.value > 0 || (health.purchaseCount ?? 0) > 0) {
    insights.push({
      key: "paid-demand",
      title: "Paid demand is active",
      body: `${formatAnalyticsValue(grossSales)} in recent gross sales with ${formatNumber(
        health.purchaseCount ?? 0
      )} lifetime paid downloads.`,
      value: formatDelta(grossSales),
      tone: grossSales.delta >= 0 ? "success" : "warning",
      icon: Banknote,
    });
  }

  if (profileScore < 80) {
    insights.push({
      key: "profile-friction",
      title: "Profile needs polish",
      body: `Your ${creatorLabel} profile is ${profileScore}% ready. Complete the missing fields before bigger promotions.`,
      value: `${profileScore}%`,
      tone: "warning",
      icon: ShieldCheck,
    });
  }

  if ((health.failedProcessingCount ?? 0) > 0) {
    insights.push({
      key: "failed-processing",
      title: "Fix failed releases",
      body: `${formatNumber(
        health.failedProcessingCount ?? 0
      )} releases need attention before they can fully convert listeners.`,
      tone: "danger",
      icon: AlertTriangle,
    });
  } else if ((health.missingArtworkCount ?? 0) > 0) {
    insights.push({
      key: "artwork-gap",
      title: "Artwork is blocking trust",
      body: `${formatNumber(
        health.missingArtworkCount ?? 0
      )} releases need cover art before they look ready for sharing.`,
      tone: "warning",
      icon: Sparkles,
    });
  }

  if (insights.length < 3 && plays.value === 0) {
    insights.push({
      key: "no-play-data",
      title: "No play data yet",
      body: "Your next goal is simple: get the first qualified plays into the analytics loop.",
      tone: "info",
      icon: Zap,
    });
  }

  return (
    <section className="border-border/50 bg-card/60 rounded-lg border p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <RadioTower className="text-brand h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold">Insight Alerts</h2>
        </div>
        <Badge variant="outline" className="text-[10px]">
          Live signals
        </Badge>
      </div>

      <div className="space-y-3">
        {insights.slice(0, 4).map((insight) => {
          const Icon = insight.icon;
          return (
            <div
              key={insight.key}
              className="border-border/50 flex items-start gap-3 rounded-lg border p-3"
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                  ACTION_STYLES[insight.tone]
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-foreground text-sm font-semibold">{insight.title}</p>
                  {insight.value && (
                    <span className="text-muted-foreground shrink-0 text-xs font-semibold">
                      {insight.value}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{insight.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CreatorActionQueue({ actions }: { actions: ActionItem[] }) {
  return (
    <section className="border-border/50 bg-card/60 rounded-lg border p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks className="text-brand h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold">Growth Queue</h2>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {actions.length || "Clear"}
        </Badge>
      </div>

      {actions.length === 0 ? (
        <div className="py-7 text-center">
          <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />
          <p className="text-foreground mt-3 text-sm font-semibold">Everything important is tidy</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Keep releasing, sharing, and watching which tracks move.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => (
            <Link
              key={action.key}
              href={action.href}
              className="border-border/50 hover:bg-muted/40 flex items-start gap-3 rounded-lg border p-3 transition-colors"
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                  ACTION_STYLES[action.tone]
                )}
              >
                {action.tone === "danger" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : action.tone === "info" ? (
                  <Clock3 className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-foreground text-sm font-semibold">{action.label}</p>
                  {action.value && (
                    <span className="text-muted-foreground shrink-0 text-xs font-semibold">
                      {action.value}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function CreatorProfileReadiness({
  score,
  items,
}: {
  score: number;
  items: ChecklistItem[];
}) {
  return (
    <section className="border-border/50 bg-card/60 rounded-lg border p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-brand h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold">Profile Readiness</h2>
        </div>
        <span className={cn("text-sm font-black", profileScoreTone(score))}>{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href ?? "/dashboard"}
            className="hover:bg-muted/40 flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors"
          >
            <span className="text-foreground min-w-0 truncate text-xs font-medium">
              {item.label}
            </span>
            {item.complete ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function CreatorTrackList({
  title,
  href,
  tracks,
  emptyLabel,
}: {
  title: string;
  href: string;
  tracks: CreatorCommandTrack[];
  emptyLabel: string;
}) {
  return (
    <section className="border-border/50 bg-card/60 rounded-lg border p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Music className="text-brand h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold">{title}</h2>
        </div>
        <Link href={href} className="text-brand text-xs font-medium hover:underline">
          View all
        </Link>
      </div>

      {tracks.length === 0 ? (
        <div className="py-8 text-center">
          <Disc3 className="text-muted-foreground mx-auto h-9 w-9" />
          <p className="text-muted-foreground mt-2 text-sm">{emptyLabel}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tracks.map((track, index) => (
            <Link
              key={track.id}
              href={trackHref(track)}
              className="hover:bg-muted/40 flex items-center gap-3 rounded-lg p-2 transition-colors"
            >
              <span className="text-muted-foreground w-5 shrink-0 text-center text-xs font-bold">
                {index + 1}
              </span>
              {track.coverArt ? (
                <Image
                  src={track.coverArt}
                  alt={track.title}
                  width={42}
                  height={42}
                  className="h-[42px] w-[42px] shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="bg-muted flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg">
                  <Music className="text-muted-foreground h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-semibold">{track.title}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {formatNumber(track.streamCount)} plays · {formatNumber(track.downloadCount)}{" "}
                  downloads
                  {formatPrice(track) ? ` · ${formatPrice(track)}` : ""}
                </p>
              </div>
              <Badge
                variant={track.processingStatus === "failed" ? "destructive" : "secondary"}
                className="hidden shrink-0 text-[10px] sm:inline-flex"
              >
                {track.processingStatus}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function CreatorRosterPreview({
  artists,
  href,
}: {
  artists: CreatorRosterArtist[];
  href: string;
}) {
  return (
    <section className="border-border/50 bg-card/60 rounded-lg border p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="text-brand h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold">Roster Pulse</h2>
        </div>
        <Link href={href} className="text-brand text-xs font-medium hover:underline">
          Manage
        </Link>
      </div>

      {artists.length === 0 ? (
        <div className="py-8 text-center">
          <Users className="text-muted-foreground mx-auto h-9 w-9" />
          <p className="text-muted-foreground mt-2 text-sm">No artists on your roster yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {artists.map((artist) => (
            <Link
              key={artist.id}
              href={`/artists/${artist.slug}`}
              className="hover:bg-muted/40 flex items-center gap-3 rounded-lg p-2 transition-colors"
            >
              {artist.photo ? (
                <Image
                  src={artist.photo}
                  alt={artist.name}
                  width={42}
                  height={42}
                  className="h-[42px] w-[42px] shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="bg-muted text-muted-foreground flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg text-xs font-black">
                  {artist.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-semibold">{artist.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {artist.genre ?? "No genre"} · {artist._count.music} tracks ·{" "}
                  {artist._count.artistFollows} followers
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
