import { NextResponse } from "next/server";
import {
  RecommendationEntityType,
  RecommendationEventName,
  RecommendationSurface,
  type Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";
import { trackInteractionEvent } from "@/lib/recommendation";

export type MusicAccessIntent = "stream" | "download" | "waveform" | "metadata" | "adminPreview";

export type MusicAccessReason =
  | "allowed"
  | "not_found"
  | "no_audio"
  | "downloads_disabled"
  | "track_download_disabled"
  | "requires_auth"
  | "requires_subscription"
  | "requires_purchase"
  | "requires_subscription_or_purchase"
  | "quota_exceeded";

const musicAccessSelect = {
  id: true,
  r2Key: true,
  filename: true,
  processedR2Key: true,
  processingStatus: true,
  enableDownload: true,
  isExclusive: true,
  price: true,
  creatorPrice: true,
  accessModel: true,
  streamAccess: true,
  artistId: true,
  albumId: true,
  genre: true,
} satisfies Prisma.MusicSelect;

const siteSettingsSelect = {
  enableDownloads: true,
  maxDownloadsPerHour: true,
  freeDownloadQuota: true,
} satisfies Prisma.SiteSettingsSelect;

export type MusicAccessTrack = Prisma.MusicGetPayload<{ select: typeof musicAccessSelect }>;
export type MusicAccessSiteSettings = Prisma.SiteSettingsGetPayload<{
  select: typeof siteSettingsSelect;
}>;

export interface MusicAccessResult {
  allowed: boolean;
  intent: MusicAccessIntent;
  reason: MusicAccessReason;
  statusCode: number;
  error: string | null;
  requiresAuth: boolean;
  requiresSubscription: boolean;
  requiresPurchase: boolean;
  quotaExceeded: boolean;
  downloadsDisabled: boolean;
  price: number | null;
  accessModel: string;
  streamAccess: string;
  isExclusive: boolean;
  hasActiveSubscription: boolean;
  hasPurchase: boolean;
  quota: number | null;
  used: number | null;
  music: MusicAccessTrack | null;
  siteSettings: MusicAccessSiteSettings | null;
}

interface GetMusicAccessInput {
  musicId: string;
  userId?: string | null;
  intent: MusicAccessIntent;
}

function isActiveSubscription(
  subscription: { status: string; currentPeriodEnd: Date | null } | null | undefined
) {
  return (
    subscription?.status === "ACTIVE" &&
    subscription.currentPeriodEnd !== null &&
    subscription.currentPeriodEnd > new Date()
  );
}

function musicPrice(music: MusicAccessTrack | null) {
  if (!music) return null;
  return music.creatorPrice ?? music.price ?? null;
}

function emptyResult(input: GetMusicAccessInput, reason: MusicAccessReason): MusicAccessResult {
  return {
    allowed: false,
    intent: input.intent,
    reason,
    statusCode: reason === "not_found" || reason === "no_audio" ? 404 : 403,
    error: reason === "not_found" ? "Track not found" : "Access denied",
    requiresAuth: false,
    requiresSubscription: false,
    requiresPurchase: false,
    quotaExceeded: false,
    downloadsDisabled: false,
    price: null,
    accessModel: "free",
    streamAccess: "free",
    isExclusive: false,
    hasActiveSubscription: false,
    hasPurchase: false,
    quota: null,
    used: null,
    music: null,
    siteSettings: null,
  };
}

function baseResult(
  input: GetMusicAccessInput,
  music: MusicAccessTrack,
  siteSettings: MusicAccessSiteSettings | null
): MusicAccessResult {
  return {
    allowed: true,
    intent: input.intent,
    reason: "allowed",
    statusCode: 200,
    error: null,
    requiresAuth: false,
    requiresSubscription: false,
    requiresPurchase: false,
    quotaExceeded: false,
    downloadsDisabled: false,
    price: musicPrice(music),
    accessModel: music.accessModel ?? "free",
    streamAccess: music.streamAccess ?? "free",
    isExclusive: music.isExclusive,
    hasActiveSubscription: false,
    hasPurchase: false,
    quota: null,
    used: null,
    music,
    siteSettings,
  };
}

function deny(
  result: MusicAccessResult,
  reason: MusicAccessReason,
  statusCode: number,
  error: string,
  flags: Partial<
    Pick<
      MusicAccessResult,
      | "requiresAuth"
      | "requiresSubscription"
      | "requiresPurchase"
      | "quotaExceeded"
      | "downloadsDisabled"
      | "quota"
      | "used"
      | "hasActiveSubscription"
      | "hasPurchase"
    >
  > = {}
): MusicAccessResult {
  return {
    ...result,
    allowed: false,
    reason,
    statusCode,
    error,
    ...flags,
  };
}

function getPremiumPolicy(music: MusicAccessTrack, intent: MusicAccessIntent) {
  const accessModel = music.accessModel ?? "free";
  const streamAccess = music.streamAccess ?? "free";

  if (intent === "metadata" || intent === "adminPreview") {
    return { isPremium: false, subscriptionAllowed: false, purchaseAllowed: false };
  }

  if (intent === "download") {
    return {
      isPremium: music.isExclusive || accessModel !== "free",
      subscriptionAllowed:
        music.isExclusive || accessModel === "subscription" || accessModel === "both",
      purchaseAllowed: accessModel === "purchase" || accessModel === "both",
    };
  }

  return {
    isPremium: music.isExclusive || streamAccess === "subscription" || accessModel !== "free",
    subscriptionAllowed:
      music.isExclusive ||
      streamAccess === "subscription" ||
      accessModel === "subscription" ||
      accessModel === "both",
    purchaseAllowed: accessModel === "purchase" || accessModel === "both",
  };
}

function getDeniedPremiumResult(
  result: MusicAccessResult,
  subscriptionAllowed: boolean,
  purchaseAllowed: boolean
) {
  if (subscriptionAllowed && purchaseAllowed) {
    return deny(result, "requires_subscription_or_purchase", 402, "Premium content", {
      requiresSubscription: true,
      requiresPurchase: true,
    });
  }

  if (purchaseAllowed) {
    return deny(result, "requires_purchase", 402, "Premium content", {
      requiresPurchase: true,
    });
  }

  return deny(result, "requires_subscription", 402, "Premium content", {
    requiresSubscription: true,
  });
}

export async function getMusicAccess(input: GetMusicAccessInput): Promise<MusicAccessResult> {
  const [music, siteSettings] = await Promise.all([
    db.music.findUnique({ where: { id: input.musicId }, select: musicAccessSelect }),
    input.intent === "download"
      ? db.siteSettings.findUnique({ where: { id: "default" }, select: siteSettingsSelect })
      : Promise.resolve(null),
  ]);

  if (!music) {
    return emptyResult(input, "not_found");
  }

  let result = baseResult(input, music, siteSettings);

  if ((input.intent === "stream" || input.intent === "waveform") && !music.r2Key) {
    return deny(result, "no_audio", 404, "No audio file available");
  }

  if (input.intent === "metadata" || input.intent === "adminPreview") {
    return result;
  }

  if (input.intent === "download") {
    if (siteSettings && !siteSettings.enableDownloads) {
      return deny(result, "downloads_disabled", 403, "Downloads are currently disabled", {
        downloadsDisabled: true,
      });
    }

    if (!music.enableDownload) {
      return deny(result, "track_download_disabled", 403, "Downloads are disabled for this track", {
        downloadsDisabled: true,
      });
    }
  }

  const policy = getPremiumPolicy(music, input.intent);

  if (policy.isPremium) {
    if (!input.userId) {
      const denied = getDeniedPremiumResult(result, policy.subscriptionAllowed, policy.purchaseAllowed);
      return deny(denied, "requires_auth", 402, "Premium content", {
        requiresAuth: true,
      });
    }

    const [subscription, purchase] = await Promise.all([
      db.subscription.findUnique({
        where: { userId: input.userId },
        select: { status: true, currentPeriodEnd: true },
      }),
      policy.purchaseAllowed
        ? db.transaction.findFirst({
            where: {
              userId: input.userId,
              musicId: music.id,
              type: "download",
              status: "success",
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    const hasActiveSubscription = isActiveSubscription(subscription);
    const hasPurchase = Boolean(purchase);

    result = {
      ...result,
      hasActiveSubscription,
      hasPurchase,
    };

    if (policy.subscriptionAllowed && hasActiveSubscription) {
      return result;
    }

    if (policy.purchaseAllowed && hasPurchase) {
      return result;
    }

    return getDeniedPremiumResult(result, policy.subscriptionAllowed, policy.purchaseAllowed);
  }

  if (input.intent === "download" && input.userId) {
    const freeQuota = siteSettings?.freeDownloadQuota ?? 5;
    if (freeQuota > 0) {
      const subscription = await db.subscription.findUnique({
        where: { userId: input.userId },
        select: { status: true, currentPeriodEnd: true },
      });
      const hasActiveSubscription = isActiveSubscription(subscription);

      result = {
        ...result,
        hasActiveSubscription,
      };

      if (!hasActiveSubscription) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyCount = await db.download.count({
          where: { userId: input.userId, createdAt: { gte: startOfMonth } },
        });

        if (monthlyCount >= freeQuota) {
          return deny(result, "quota_exceeded", 402, "Monthly download quota reached", {
            quotaExceeded: true,
            quota: freeQuota,
            used: monthlyCount,
          });
        }
      }
    }
  }

  return result;
}

export function serializeMusicAccessResult(result: MusicAccessResult) {
  return {
    allowed: result.allowed,
    intent: result.intent,
    reason: result.reason,
    error: result.error,
    requiresAuth: result.requiresAuth,
    requiresSubscription: result.requiresSubscription,
    requiresPurchase: result.requiresPurchase,
    quotaExceeded: result.quotaExceeded,
    downloadsDisabled: result.downloadsDisabled,
    price: result.price,
    accessModel: result.accessModel,
    streamAccess: result.streamAccess,
    isExclusive: result.isExclusive,
    hasActiveSubscription: result.hasActiveSubscription,
    hasPurchase: result.hasPurchase,
    quota: result.quota,
    used: result.used,
  };
}

export function musicAccessDeniedResponse(result: MusicAccessResult) {
  return NextResponse.json(serializeMusicAccessResult(result), { status: result.statusCode });
}

export function trackMusicAccessDenied({
  result,
  userId,
  surface = RecommendationSurface.MUSIC_DETAIL,
  placement,
}: {
  result: MusicAccessResult;
  userId?: string | null;
  surface?: RecommendationSurface;
  placement?: string | null;
}) {
  if (result.allowed || !result.music) return;

  trackInteractionEvent({
    eventName: RecommendationEventName.MUSIC_DETAIL_OPEN,
    entityType: RecommendationEntityType.MUSIC,
    entityId: result.music.id,
    userId,
    surface,
    placement,
    artistId: result.music.artistId,
    albumId: result.music.albumId,
    genre: result.music.genre,
    weightHint: 0,
    metadata: {
      eventKind: "music_access_denied",
      intent: result.intent,
      reason: result.reason,
      accessModel: result.accessModel,
      streamAccess: result.streamAccess,
      isExclusive: result.isExclusive,
      requiresAuth: result.requiresAuth,
      requiresSubscription: result.requiresSubscription,
      requiresPurchase: result.requiresPurchase,
      price: result.price,
    } satisfies Prisma.InputJsonValue,
  });
}
