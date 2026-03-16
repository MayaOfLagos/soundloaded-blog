import { db } from "@/lib/db";
import { getPostUrl } from "@/lib/urls";
import { getSettings } from "@/lib/settings";

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
  author: { id: string; name: string | null; avatar: string | null };
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
  author: { select: { id: true, name: true, image: true } },
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
  author: { id: string; name: string | null; image: string | null };
  _count: { comments: number; bookmarks: number; favorites: number; reactions: number };
};

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
    author: { id: p.author.id, name: p.author.name, avatar: p.author.image },
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

// ── Community-only base filter ──────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildBaseWhere(excludeUserId?: string, type?: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: "PUBLISHED" as const,
    isUserGenerated: true,
    type: "COMMUNITY" as const,
  };

  if (excludeUserId) {
    where.authorId = { not: excludeUserId };
  }

  if (type && type !== "all") {
    // For community posts, type filter applies to media type within the post
    // but keep the post type as COMMUNITY
    delete where.type;
    where.type = type.toUpperCase() as never;
  }

  return where;
}

// ── Deterministic daily hash for stable randomization ───────────────────
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ── Algorithmic scoring ─────────────────────────────────────────────────
function scorePost(p: RawExplorePost, followingIds: Set<string>, seed: number): number {
  const now = Date.now();
  const hoursAge = (now - new Date(p.createdAt).getTime()) / 3600000;

  // Engagement score (weighted)
  const engagement =
    p._count.reactions * 3 +
    p._count.comments * 5 +
    p._count.bookmarks * 4 +
    p._count.favorites * 4 +
    p.views * 0.1;

  // Follow boost
  const followBoost = followingIds.has(p.author.id) ? 30 : 0;

  // Time decay (gravity algorithm like Hacker News)
  const decayFactor = 1 / Math.pow(hoursAge + 2, 1.2);

  // Deterministic random factor (varies daily, stable within a day)
  const postHash = simpleHash(p.id + seed);
  const randomFactor = 0.7 + (postHash % 60) / 100; // 0.7 – 1.3

  return (engagement + followBoost) * decayFactor * randomFactor;
}

// ── Author diversity (max 2 consecutive from same author) ───────────────
function diversifyPosts(posts: ExplorePost[]): ExplorePost[] {
  const result: ExplorePost[] = [];
  const deferred: ExplorePost[] = [];
  let lastAuthorId = "";
  let consecutiveCount = 0;

  for (const p of posts) {
    if (p.author.id === lastAuthorId) {
      consecutiveCount++;
      if (consecutiveCount > 2) {
        deferred.push(p);
        continue;
      }
    } else {
      lastAuthorId = p.author.id;
      consecutiveCount = 1;
    }
    result.push(p);
  }

  return [...result, ...deferred];
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
  const where = buildBaseWhere(excludeUserId, type);

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
  const where = buildBaseWhere(excludeUserId, type);

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
  const where = {
    ...buildBaseWhere(excludeUserId, type),
    publishedAt: { gte: sevenDaysAgo },
  };

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

  return {
    posts: posts.map((p) => mapExplorePost(p as RawExplorePost, settings.permalinkStructure)),
    pagination: buildPagination(page, limit, total),
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
  const where = buildBaseWhere(excludeUserId, type);

  // Daily seed for stable-within-a-day randomization
  const today = new Date().toISOString().slice(0, 10);
  const seed = simpleHash(today);

  // Get following IDs for boost
  const followingIds = await getFollowingIds(excludeUserId);

  // Fetch a larger pool for scoring (up to 200 posts from last 14 days)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const pool = await db.post.findMany({
    where: {
      ...where,
      publishedAt: { gte: fourteenDaysAgo },
    },
    orderBy: { publishedAt: "desc" },
    take: 200,
    select: EXPLORE_SELECT,
  });

  const total = await db.post.count({ where });

  // Score and sort
  const scored = (pool as RawExplorePost[])
    .map((p) => ({ post: p, score: scorePost(p, followingIds, seed) }))
    .sort((a, b) => b.score - a.score);

  // Paginate from scored results
  const start = (page - 1) * limit;
  const paginated = scored.slice(start, start + limit);

  // Map and diversify
  const mapped = paginated.map((s) => mapExplorePost(s.post, settings.permalinkStructure));
  const diversified = diversifyPosts(mapped);

  return {
    posts: diversified,
    pagination: buildPagination(page, limit, total),
  };
}
