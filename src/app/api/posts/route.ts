import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import sanitizeHtml from "sanitize-html";
import { createUserPostSchema } from "@/lib/validations/post";
import { getExcludedUserIds } from "@/lib/services/blocks";
import {
  createRecommendationCacheKey,
  createRecommendationRequestId,
  diversifyRankedPosts,
  getRecommendationCacheTtlSeconds,
  getUserAffinityProfile,
  isRecommendationV1Enabled,
  rankPosts,
  trackRecommendationImpressions,
  withRecommendationCache,
} from "@/lib/recommendation";
import { RecommendationEntityType, RecommendationSurface } from "@prisma/client";

// ── Role hierarchy ────────────────────────────────────────────────────
const ROLE_LEVELS: Record<string, number> = {
  READER: 0,
  CONTRIBUTOR: 1,
  EDITOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

function hasMinRole(role: string | undefined, minRole: string): boolean {
  return (ROLE_LEVELS[role ?? "READER"] ?? 0) >= (ROLE_LEVELS[minRole] ?? 0);
}

// ── Text extraction for excerpts ──────────────────────────────────────
function extractTextFromJson(node: unknown, maxLen = 200): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;
  if (n.text && typeof n.text === "string") return n.text;
  if (Array.isArray(n.content)) {
    const texts = n.content.map((child: unknown) => extractTextFromJson(child, maxLen));
    return texts.join(" ").slice(0, maxLen);
  }
  return "";
}

// ── Slug generation ───────────────────────────────────────────────────
function generateSlug(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `post-${datePart}-${randomPart}`;
}

// ── Sanitize TipTap JSON body ─────────────────────────────────────────
function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const node = { ...(body as Record<string, unknown>) };

  if (typeof node.text === "string") {
    node.text = sanitizeHtml(node.text, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }

  const ALLOWED_TYPES = [
    "doc",
    "paragraph",
    "text",
    "heading",
    "bulletList",
    "orderedList",
    "listItem",
    "blockquote",
    "hardBreak",
    "horizontalRule",
    "image",
    "codeBlock",
    "code",
  ];

  if (typeof node.type === "string" && !ALLOWED_TYPES.includes(node.type)) {
    return null;
  }

  if (Array.isArray(node.content)) {
    node.content = (node.content as unknown[]).map((child) => sanitizeBody(child)).filter(Boolean);
  }

  return node;
}

// ── Feed post shape for algorithmic ranking ───────────────────────────
interface FeedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: unknown;
  coverImage: string | null;
  type: string;
  isUserGenerated: boolean;
  mediaAttachments: unknown;
  publishedAt: Date | null;
  createdAt: Date;
  views: number;
  author: { id: string; name: string | null; image: string | null; username?: string | null };
  category: { name: string; slug: string } | null;
  commentCount: number;
  reactionCount: number;
  bookmarkCount?: number;
  favoriteCount?: number;
  _score?: number;
  _reasonKey?: string;
  _candidateSource?: string;
}

interface FeedPageResult {
  posts: FeedPost[];
  nextCursor: string | null;
}

function getFeedOffset(cursor: string | null) {
  if (!cursor?.startsWith("offset:")) return 0;
  const parsed = Number.parseInt(cursor.slice(7), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getFeedSurface(feed: "foryou" | "following" | "discover") {
  if (feed === "following") return RecommendationSurface.FEED_FOLLOWING;
  if (feed === "discover") return RecommendationSurface.FEED_DISCOVER;
  return RecommendationSurface.FEED_FORYOU;
}

function trackFeedImpressions({
  posts,
  userId,
  feed,
  offset = 0,
}: {
  posts: FeedPost[];
  userId?: string;
  feed: "foryou" | "following" | "discover";
  offset?: number;
}) {
  const surface = getFeedSurface(feed);
  trackRecommendationImpressions({
    requestId: createRecommendationRequestId(surface),
    userId,
    surface,
    items: posts.map((post, index) => ({
      entityType: RecommendationEntityType.POST,
      entityId: post.id,
      position: offset + index + 1,
      candidateSource: post._candidateSource ?? feed,
      reasonKey: post._reasonKey,
      score: post._score,
    })),
  });
}

function formatPost(p: FeedPost) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    body: p.body,
    coverImage: p.coverImage,
    type: p.type,
    isUserGenerated: p.isUserGenerated,
    mediaAttachments: p.mediaAttachments,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    views: p.views,
    author: p.author,
    category: p.category,
    commentCount: p.commentCount,
    reactionCount: p.reactionCount,
  };
}

// ── GET — Posts with pagination (page-based + cursor-based) ───────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Cursor-based pagination (for infinite-scroll feed)
  const cursor = searchParams.get("cursor");
  // Page-based pagination (for admin/grids — backward compat)
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10), 50);
  const category = searchParams.get("category") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const feed = searchParams.get("feed"); // "foryou" | "following" | "discover"

  try {
    // ── New feed modes (community-only, algorithm-driven) ──
    if (feed === "foryou" || feed === "following" || feed === "discover") {
      const session = await auth();
      const userId = (session?.user as { id: string } | undefined)?.id;

      // Base filter: only community posts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        status: "PUBLISHED" as const,
        isUserGenerated: true,
        type: "COMMUNITY" as const,
      };

      // Exclude hidden posts and blocked users for logged-in users
      if (userId) {
        const [hiddenPosts, excludedUserIds] = await Promise.all([
          db.hiddenPost.findMany({
            where: { userId },
            select: { postId: true },
          }),
          getExcludedUserIds(userId),
        ]);
        if (hiddenPosts.length > 0) {
          where.id = { notIn: hiddenPosts.map((hp) => hp.postId) };
        }
        if (excludedUserIds.length > 0) {
          where.authorId = { ...(where.authorId ?? {}), notIn: excludedUserIds };
        }
      }

      // Fetch followed user IDs (needed for following + foryou)
      let followingIds = new Set<string>();
      if (userId && (feed === "following" || feed === "foryou")) {
        const follows = await db.follow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
        });
        followingIds = new Set(follows.map((f) => f.followingId));
      }

      const includeFields = {
        author: { select: { id: true, name: true, image: true, username: true } },
        category: { select: { name: true, slug: true } },
        _count: { select: { comments: true, reactions: true, bookmarks: true, favorites: true } },
      };

      // ── "following" — reverse-chronological from followed users ──
      if (feed === "following") {
        if (!userId || followingIds.size === 0) {
          return NextResponse.json({ posts: [], nextCursor: null });
        }

        where.authorId = { in: Array.from(followingIds) };

        const posts = await db.post.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          include: includeFields,
        });

        const hasMore = posts.length > limit;
        const items = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? items[items.length - 1].id : null;
        const mappedItems = items.map((p) => ({
          ...p,
          commentCount: p._count.comments,
          reactionCount: p._count.reactions,
          bookmarkCount: p._count.bookmarks,
          favoriteCount: p._count.favorites,
          _candidateSource: "following",
          _reasonKey: "FOLLOWED_CREATOR",
        }));
        trackFeedImpressions({ posts: mappedItems, userId, feed: "following" });

        return NextResponse.json({
          posts: mappedItems.map(formatPost),
          nextCursor,
        });
      }

      // ── "discover" — trending community posts (7 days) ──
      if (feed === "discover") {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        where.createdAt = { gte: sevenDaysAgo };

        const offset = getFeedOffset(cursor);

        const loadDiscoverPage = async (): Promise<FeedPageResult> => {
          if (!isRecommendationV1Enabled()) {
            const posts = await db.post.findMany({
              where,
              orderBy: { createdAt: "desc" },
              take: limit + 1,
              skip: offset,
              include: includeFields,
            });
            const hasMore = posts.length > limit;
            const items = hasMore ? posts.slice(0, limit) : posts;

            return {
              posts: items.map((p) => ({
                ...p,
                commentCount: p._count.comments,
                reactionCount: p._count.reactions,
                bookmarkCount: p._count.bookmarks,
                favoriteCount: p._count.favorites,
                _candidateSource: "legacy_discover",
              })),
              nextCursor: hasMore ? `offset:${offset + limit}` : null,
            };
          }

          const pool = await db.post.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 100,
            include: includeFields,
          });

          const mapped: FeedPost[] = pool.map((p) => ({
            ...p,
            commentCount: p._count.comments,
            reactionCount: p._count.reactions,
            bookmarkCount: p._count.bookmarks,
            favoriteCount: p._count.favorites,
          }));

          const scored = diversifyRankedPosts(
            rankPosts(mapped, {
              decayPower: 1.5,
              viewWeight: 0.25,
              candidateSource: "trending_community",
            }),
            { maxConsecutiveAuthors: 2, maxConsecutiveCategories: 3 }
          );

          return {
            posts: scored.slice(offset, offset + limit),
            nextCursor: offset + limit < scored.length ? `offset:${offset + limit}` : null,
          };
        };

        const pageResult = userId
          ? await loadDiscoverPage()
          : await withRecommendationCache({
              key: createRecommendationCacheKey(["feed", "discover", offset, limit]),
              ttlSeconds: getRecommendationCacheTtlSeconds("feed"),
              load: loadDiscoverPage,
            });
        trackFeedImpressions({ posts: pageResult.posts, userId, feed: "discover", offset });

        return NextResponse.json({
          posts: pageResult.posts.map(formatPost),
          nextCursor: pageResult.nextCursor,
        });
      }

      // ── "foryou" — algorithmic mix (14 days, follow-boosted) ──
      if (feed === "foryou") {
        // If not logged in, fall back to discover-style trending
        const daysBack = userId ? 14 : 7;
        const poolLimit = userId ? 200 : 100;
        const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
        where.createdAt = { gte: cutoff };

        const offset = getFeedOffset(cursor);

        const loadForYouPage = async (): Promise<FeedPageResult> => {
          if (!isRecommendationV1Enabled()) {
            const posts = await db.post.findMany({
              where,
              orderBy: { createdAt: "desc" },
              take: limit + 1,
              skip: offset,
              include: includeFields,
            });
            const hasMore = posts.length > limit;
            const items = hasMore ? posts.slice(0, limit) : posts;

            return {
              posts: items.map((p) => ({
                ...p,
                commentCount: p._count.comments,
                reactionCount: p._count.reactions,
                bookmarkCount: p._count.bookmarks,
                favoriteCount: p._count.favorites,
                _candidateSource: "legacy_foryou",
              })),
              nextCursor: hasMore ? `offset:${offset + limit}` : null,
            };
          }

          const [pool, affinity] = await Promise.all([
            db.post.findMany({
              where,
              orderBy: { createdAt: "desc" },
              take: poolLimit,
              include: includeFields,
            }),
            userId ? getUserAffinityProfile({ userId }) : Promise.resolve(null),
          ]);

          const mapped: FeedPost[] = pool.map((p) => ({
            ...p,
            commentCount: p._count.comments,
            reactionCount: p._count.reactions,
            bookmarkCount: p._count.bookmarks,
            favoriteCount: p._count.favorites,
          }));

          let scored = rankPosts(mapped, {
            followingIds,
            decayPower: 1.2,
            followBoost: 50,
            viewWeight: 0.25,
            candidateSource: userId ? "personalized_recent" : "trending_community",
            authorAffinity: affinity?.authorScores,
            categoryAffinity: affinity?.categoryScores,
            postTypeAffinity: affinity?.postTypeScores,
            affinityWeight: 8,
          });
          if (userId) {
            scored = diversifyRankedPosts(scored, {
              maxConsecutiveAuthors: 3,
              maxConsecutiveCategories: 3,
            });
          }

          return {
            posts: scored.slice(offset, offset + limit),
            nextCursor: offset + limit < scored.length ? `offset:${offset + limit}` : null,
          };
        };

        const pageResult = userId
          ? await loadForYouPage()
          : await withRecommendationCache({
              key: createRecommendationCacheKey(["feed", "foryou-anonymous", offset, limit]),
              ttlSeconds: getRecommendationCacheTtlSeconds("feed"),
              load: loadForYouPage,
            });
        trackFeedImpressions({ posts: pageResult.posts, userId, feed: "foryou", offset });

        return NextResponse.json({
          posts: pageResult.posts.map(formatPost),
          nextCursor: pageResult.nextCursor,
        });
      }
    }

    // ── Legacy feed modes (backward compat for other pages) ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: "PUBLISHED" as const,
      ...(category ? { category: { slug: category } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { excerpt: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    if (type) {
      where.type = type as never;
    }

    // Exclude hidden posts for cursor-based requests
    if (cursor) {
      const session = await auth();
      if (session?.user) {
        const userId = (session.user as { id: string }).id;
        const hiddenPosts = await db.hiddenPost.findMany({
          where: { userId },
          select: { postId: true },
        });
        if (hiddenPosts.length > 0) {
          where.id = { notIn: hiddenPosts.map((hp) => hp.postId) };
        }
      }
    }

    // ── Cursor-based mode (non-feed infinite scroll) ──
    if (cursor) {
      const posts = await db.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: { id: cursor },
        skip: 1,
        include: {
          author: { select: { id: true, name: true, image: true, username: true } },
          category: { select: { name: true, slug: true } },
          _count: { select: { comments: true, reactions: true } },
        },
      });

      const hasMore = posts.length > limit;
      const items = hasMore ? posts.slice(0, limit) : posts;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      return NextResponse.json({
        posts: items.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          body: p.body,
          coverImage: p.coverImage,
          type: p.type,
          isUserGenerated: p.isUserGenerated,
          mediaAttachments: p.mediaAttachments,
          publishedAt: p.publishedAt,
          createdAt: p.createdAt,
          views: p.views,
          author: p.author,
          category: p.category,
          commentCount: p._count.comments,
          reactionCount: p._count.reactions,
        })),
        nextCursor,
      });
    }

    // ── Page-based mode (backward compat) ──
    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          views: true,
          type: true,
          category: { select: { name: true, slug: true } },
          author: { select: { name: true, image: true } },
        },
      }),
      db.post.count({ where }),
    ]);

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        coverImage: p.coverImage,
        publishedAt: p.publishedAt,
        viewCount: p.views,
        type: p.type,
        category: p.category,
        author: p.author,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    });
  } catch (err) {
    console.error("[GET /api/posts]", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// ── POST — Create a user post (CONTRIBUTOR+ only) ─────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role?: string }).role;

    if (!hasMinRole(userRole, "READER")) {
      return NextResponse.json({ error: "You need an account to create posts" }, { status: 403 });
    }

    const json = await request.json();
    const parsed = createUserPostSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { body, excerpt, mediaAttachments, coverImage } = parsed.data;

    const sanitizedBody = sanitizeBody(body);
    const finalExcerpt = excerpt || extractTextFromJson(sanitizedBody, 200);

    // Generate unique slug
    let slug = generateSlug();
    const existing = await db.post.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 4)}`;
    }

    // Auto-publish community posts for now
    const publishedAt = new Date();

    // Use first image as cover if not explicitly set
    const firstImage = mediaAttachments.find((a) => a.type === "IMAGE");
    const finalCoverImage = coverImage || firstImage?.url || null;

    // Title from excerpt (feed posts are excerpt-first, title is secondary)
    const title = finalExcerpt.slice(0, 60) || "Untitled post";

    const post = await db.post.create({
      data: {
        title,
        slug,
        excerpt: finalExcerpt,
        body: sanitizedBody as object,
        coverImage: finalCoverImage,
        status: "PUBLISHED",
        type: "COMMUNITY",
        publishedAt,
        isUserGenerated: true,
        mediaAttachments: mediaAttachments as object[],
        authorId: userId,
      },
      include: {
        author: { select: { id: true, name: true, image: true, username: true } },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/posts] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
