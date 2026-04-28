import { db } from "@/lib/db";
import { getPostUrl } from "@/lib/urls";
import { getSettings } from "@/lib/settings";
import { getExcludedUserIds } from "@/lib/services/blocks";
import {
  createRecommendationCacheKey,
  createRecommendationRequestId,
  diversifyRankedPosts,
  getRecommendationCacheTtlSeconds,
  isRecommendationV1Enabled,
  rankPosts,
  trackRecommendationImpressions,
  withRecommendationCache,
} from "@/lib/recommendation";
import { RecommendationEntityType, RecommendationSurface } from "@prisma/client";

export interface ExplorePost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  mediaAttachments: Array<{ url: string; key: string; type: string; mimeType: string }>;
  isUserGenerated: boolean;
  publishedAt: Date;
  views: number;
  type: string;
  href: string;
  category: { name: string; slug: string } | null;
  author: { id: string; name: string | null; avatar: string | null; username: string | null };
  commentCount: number;
  bookmarkCount: number;
  favoriteCount: number;
  reactionCount: number;
}

interface ExplorePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

export interface ExploreResult {
  posts: ExplorePost[];
  pagination: ExplorePagination;
}

const EXPLORE_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  mediaAttachments: true,
  isUserGenerated: true,
  publishedAt: true,
  createdAt: true,
  views: true,
  type: true,
  category: { select: { name: true, slug: true } },
  author: { select: { id: true, name: true, image: true, username: true } },
  _count: { select: { comments: true, bookmarks: true, favorites: true, reactions: true } },
} as const;

type RawExplorePost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  mediaAttachments: unknown;
  isUserGenerated: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  views: number;
  type: string;
  category: { name: string; slug: string } | null;
  author: { id: string; name: string | null; image: string | null; username: string | null };
  _count: { comments: number; bookmarks: number; favorites: number; reactions: number };
};

type RankableExplorePost = RawExplorePost & {
  commentCount: number;
  bookmarkCount: number;
  favoriteCount: number;
  reactionCount: number;
  _score?: number;
  _reasonKey?: string;
  _candidateSource?: string;
};

interface ExploreRankedResult {
  posts: RankableExplorePost[];
  total: number;
}

function mapExplorePost(p: RawExplorePost, permalinkStructure?: string): ExplorePost {
  const media = Array.isArray(p.mediaAttachments)
    ? (p.mediaAttachments as Array<{ url: string; key: string; type: string; mimeType: string }>)
    : [];

  const effectiveCover = p.coverImage ?? media.find((m) => m.type === "IMAGE")?.url ?? null;

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: effectiveCover,
    mediaAttachments: media,
    isUserGenerated: p.isUserGenerated ?? false,
    publishedAt: p.publishedAt ?? new Date(),
    views: p.views,
    type: p.type,
    href: p.isUserGenerated
      ? ""
      : permalinkStructure
        ? getPostUrl(p, permalinkStructure)
        : `/${p.slug}`,
    category: p.category,
    author: {
      id: p.author.id,
      name: p.author.name,
      avatar: p.author.image,
      username: p.author.username,
    },
    commentCount: p._count.comments,
    bookmarkCount: p._count.bookmarks,
    favoriteCount: p._count.favorites,
    reactionCount: p._count.reactions,
  };
}

function buildPagination(page: number, limit: number, total: number): ExplorePagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
  };
}

// ── Base filter for explore (all published content, excludes music track pages) ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildBaseWhere(excludeUserId?: string, type?: string): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: "PUBLISHED" as const,
    music: null, // exclude auto-created music track pages
  };

  if (excludeUserId) {
    const blockedIds = await getExcludedUserIds(excludeUserId);
    const allExcluded = [excludeUserId, ...blockedIds];
    where.authorId = { notIn: allExcluded };
  }

  if (type && type !== "all") {
    if (type === "community") {
      where.isUserGenerated = true;
      where.type = "COMMUNITY" as const;
    } else if (type === "editorial") {
      where.isUserGenerated = false;
    } else {
      where.type = type.toUpperCase() as never;
    }
  }

  return where;
}

function toRankableExplorePost(p: RawExplorePost): RankableExplorePost {
  return {
    ...p,
    commentCount: p._count.comments,
    bookmarkCount: p._count.bookmarks,
    favoriteCount: p._count.favorites,
    reactionCount: p._count.reactions,
  };
}

function trackExploreImpressions({
  posts,
  userId,
  surface,
  page,
  limit,
  candidateSource,
}: {
  posts: Array<
    RawExplorePost & { _score?: number; _reasonKey?: string; _candidateSource?: string }
  >;
  userId?: string;
  surface: RecommendationSurface;
  page: number;
  limit: number;
  candidateSource: string;
}) {
  const offset = Math.max(0, page - 1) * limit;
  trackRecommendationImpressions({
    requestId: createRecommendationRequestId(surface),
    userId,
    surface,
    items: posts.map((post, index) => ({
      entityType: RecommendationEntityType.POST,
      entityId: post.id,
      position: offset + index + 1,
      candidateSource: post._candidateSource ?? candidateSource,
      reasonKey: post._reasonKey,
      score: post._score,
    })),
  });
}

// ── Get user's following list ───────────────────────────────────────────
async function getFollowingIds(userId?: string): Promise<Set<string>> {
  if (!userId) return new Set();
  const follows = await db.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return new Set(follows.map((f) => f.followingId));
}

// ── Latest community posts ──────────────────────────────────────────────
export async function getExploreLatest(
  page = 1,
  limit = 10,
  type?: string,
  excludeUserId?: string
): Promise<ExploreResult> {
  const settings = await getSettings();
  const where = await buildBaseWhere(excludeUserId, type);

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      select: EXPLORE_SELECT,
    }),
    db.post.count({ where }),
  ]);

  trackExploreImpressions({
    posts: posts as RawExplorePost[],
    userId: excludeUserId,
    surface: RecommendationSurface.EXPLORE_LATEST,
    page,
    limit,
    candidateSource: "explore_latest",
  });

  return {
    posts: posts.map((p) => mapExplorePost(p as RawExplorePost, settings.permalinkStructure)),
    pagination: buildPagination(page, limit, total),
  };
}

// ── Top community posts (all time, by views) ────────────────────────────
export async function getExploreTop(
  page = 1,
  limit = 10,
  type?: string,
  excludeUserId?: string
): Promise<ExploreResult> {
  const settings = await getSettings();
  const where = await buildBaseWhere(excludeUserId, type);

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { views: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      select: EXPLORE_SELECT,
    }),
    db.post.count({ where }),
  ]);

  trackExploreImpressions({
    posts: posts as RawExplorePost[],
    userId: excludeUserId,
    surface: RecommendationSurface.EXPLORE_TOP,
    page,
    limit,
    candidateSource: "explore_top",
  });

  return {
    posts: posts.map((p) => mapExplorePost(p as RawExplorePost, settings.permalinkStructure)),
    pagination: buildPagination(page, limit, total),
  };
}

// ── Trending community posts (last 7 days) ──────────────────────────────
export async function getExploreTrending(
  page = 1,
  limit = 10,
  type?: string,
  excludeUserId?: string
): Promise<ExploreResult> {
  const settings = await getSettings();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const baseWhere = await buildBaseWhere(excludeUserId, type);
  const where = {
    ...baseWhere,
    publishedAt: { gte: sevenDaysAgo },
  };

  const loadTrending = async (): Promise<ExploreRankedResult> => {
    if (!isRecommendationV1Enabled()) {
      const [legacyPosts, total] = await Promise.all([
        db.post.findMany({
          where,
          orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
          take: page * limit,
          select: EXPLORE_SELECT,
        }),
        db.post.count({ where }),
      ]);

      return {
        posts: (legacyPosts as RawExplorePost[]).map((post) => ({
          ...toRankableExplorePost(post),
          _candidateSource: "legacy_explore_trending",
        })),
        total,
      };
    }

    const [pool, total] = await Promise.all([
      db.post.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: 200,
        select: EXPLORE_SELECT,
      }),
      db.post.count({ where }),
    ]);

    const scored = diversifyRankedPosts(
      rankPosts((pool as RawExplorePost[]).map(toRankableExplorePost), {
        decayPower: 1.1,
        viewWeight: 0.1,
        candidateSource: "explore_trending",
      }),
      { maxConsecutiveAuthors: 2, maxConsecutiveCategories: 3 }
    );

    return { posts: scored, total };
  };

  const ranked = excludeUserId
    ? await loadTrending()
    : await withRecommendationCache({
        key: createRecommendationCacheKey(["explore", "trending", type ?? "all", page, limit]),
        ttlSeconds: getRecommendationCacheTtlSeconds("explore"),
        load: loadTrending,
      });
  const start = (page - 1) * limit;
  const posts = ranked.posts.slice(start, start + limit);
  trackExploreImpressions({
    posts,
    userId: excludeUserId,
    surface: RecommendationSurface.EXPLORE_TRENDING,
    page,
    limit,
    candidateSource: "explore_trending",
  });

  return {
    posts: posts.map((p) => mapExplorePost(p, settings.permalinkStructure)),
    pagination: buildPagination(page, limit, ranked.total),
  };
}

// ── Hot: algorithmic scoring with randomization ─────────────────────────
export async function getExploreHot(
  page = 1,
  limit = 10,
  type?: string,
  excludeUserId?: string
): Promise<ExploreResult> {
  const settings = await getSettings();
  const where = await buildBaseWhere(excludeUserId, type);

  const loadHot = async (): Promise<ExploreRankedResult> => {
    if (!isRecommendationV1Enabled()) {
      const [legacyPosts, total] = await Promise.all([
        db.post.findMany({
          where,
          orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
          take: page * limit,
          select: EXPLORE_SELECT,
        }),
        db.post.count({ where }),
      ]);

      return {
        posts: (legacyPosts as RawExplorePost[]).map((post) => ({
          ...toRankableExplorePost(post),
          _candidateSource: "legacy_explore_hot",
        })),
        total,
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    const followingIds = await getFollowingIds(excludeUserId);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [pool, total] = await Promise.all([
      db.post.findMany({
        where: {
          ...where,
          publishedAt: { gte: fourteenDaysAgo },
        },
        orderBy: { publishedAt: "desc" },
        take: 200,
        select: EXPLORE_SELECT,
      }),
      db.post.count({ where }),
    ]);

    const scored = diversifyRankedPosts(
      rankPosts((pool as RawExplorePost[]).map(toRankableExplorePost), {
        followingIds,
        decayPower: 1.2,
        followBoost: 30,
        viewWeight: 0.1,
        randomSeed: today,
        randomSpread: 0.3,
        candidateSource: "explore_hot",
      }),
      { maxConsecutiveAuthors: 2, maxConsecutiveCategories: 3 }
    );

    return { posts: scored, total };
  };

  const ranked = excludeUserId
    ? await loadHot()
    : await withRecommendationCache({
        key: createRecommendationCacheKey(["explore", "hot", type ?? "all", page, limit]),
        ttlSeconds: getRecommendationCacheTtlSeconds("explore"),
        load: loadHot,
      });

  // Paginate from scored results
  const start = (page - 1) * limit;
  const paginated = ranked.posts.slice(start, start + limit);
  trackExploreImpressions({
    posts: paginated,
    userId: excludeUserId,
    surface: RecommendationSurface.EXPLORE_HOT,
    page,
    limit,
    candidateSource: "explore_hot",
  });

  return {
    posts: paginated.map((p) => mapExplorePost(p, settings.permalinkStructure)),
    pagination: buildPagination(page, limit, ranked.total),
  };
}
