import { db } from "@/lib/db";
import {
  getRecommendationEngineVersion,
  isRecommendationCacheEnabled,
  shouldTrackRecommendationImpressions,
} from "./config";

export async function getRecommendationOpsSnapshot() {
  const now = Date.now();
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [
    events24h,
    events7d,
    impressions24h,
    impressions7d,
    affinitySnapshots,
    affinityUsers,
    surfaces,
    reasonKeys,
    candidateSources,
    latestEvents,
  ] = await Promise.all([
    db.interactionEvent.count({ where: { occurredAt: { gte: twentyFourHoursAgo } } }),
    db.interactionEvent.count({ where: { occurredAt: { gte: sevenDaysAgo } } }),
    db.recommendationImpression.count({ where: { servedAt: { gte: twentyFourHoursAgo } } }),
    db.recommendationImpression.count({ where: { servedAt: { gte: sevenDaysAgo } } }),
    db.userAffinitySnapshot.count(),
    db.userAffinitySnapshot.findMany({
      distinct: ["userId"],
      select: { userId: true },
      take: 10000,
    }),
    db.recommendationImpression.groupBy({
      by: ["surface"],
      where: { servedAt: { gte: sevenDaysAgo } },
      _count: { _all: true },
      orderBy: { _count: { surface: "desc" } },
      take: 8,
    }),
    db.recommendationImpression.groupBy({
      by: ["reasonKey"],
      where: { servedAt: { gte: sevenDaysAgo }, reasonKey: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { reasonKey: "desc" } },
      take: 8,
    }),
    db.recommendationImpression.groupBy({
      by: ["candidateSource"],
      where: { servedAt: { gte: sevenDaysAgo }, candidateSource: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { candidateSource: "desc" } },
      take: 8,
    }),
    db.interactionEvent.findMany({
      orderBy: { occurredAt: "desc" },
      take: 8,
      select: {
        id: true,
        eventName: true,
        entityType: true,
        entityId: true,
        surface: true,
        reasonKey: true,
        candidateSource: true,
        occurredAt: true,
        userId: true,
      },
    }),
  ]);

  return {
    config: {
      engineVersion: getRecommendationEngineVersion(),
      cacheEnabled: isRecommendationCacheEnabled(),
      impressionsEnabled: shouldTrackRecommendationImpressions(),
      redisConfigured: Boolean(
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ),
      cronSecretConfigured: Boolean(process.env.CRON_SECRET),
    },
    totals: {
      events24h,
      events7d,
      impressions24h,
      impressions7d,
      affinitySnapshots,
      affinityUsers: affinityUsers.length,
    },
    surfaces: surfaces.map((item) => ({
      key: item.surface,
      count: item._count._all,
    })),
    reasonKeys: reasonKeys.map((item) => ({
      key: item.reasonKey,
      count: item._count._all,
    })),
    candidateSources: candidateSources.map((item) => ({
      key: item.candidateSource,
      count: item._count._all,
    })),
    latestEvents,
  };
}
