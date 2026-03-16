import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import sanitizeHtml from "sanitize-html";
import { createUserPostSchema } from "@/lib/validations/post";

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

// ── Scoring helpers for algorithmic feeds ─────────────────────────────
interface ScoredPost {
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
  author: { id: string; name: string | null; image: string | null };
  category: { name: string; slug: string } | null;
  commentCount: number;
  reactionCount: number;
  _score?: number;
}

function scorePosts(
  posts: ScoredPost[],
  followingIds: Set<string>,
  decayPower: number,
  followBoost: number
): ScoredPost[] {
  const now = Date.now();
  return posts
    .map((p) => {
      const hoursAge = (now - new Date(p.createdAt).getTime()) / 3600000;
      const base = p.reactionCount * 3 + p.commentCount * 5 + p.views * 0.5;
      const boost = followingIds.has(p.author.id) ? followBoost : 0;
      p._score = (base + boost) / Math.pow(hoursAge + 2, decayPower);
      return p;
    })
    .sort((a, b) => (b._score ?? 0) - (a._score ?? 0));
}

function applyDiversity(posts: ScoredPost[], maxConsecutive = 3): ScoredPost[] {
  const result: ScoredPost[] = [];
  let consecutiveAuthor = "";
  let consecutiveCount = 0;
  const deferred: ScoredPost[] = [];

  for (const p of posts) {
    if (p.author.id === consecutiveAuthor) {
      consecutiveCount++;
      if (consecutiveCount > maxConsecutive) {
        deferred.push(p);
        continue;
      }
    } else {
      consecutiveAuthor = p.author.id;
      consecutiveCount = 1;
    }
    result.push(p);
  }

  // Append deferred posts at the end
  return [...result, ...deferred];
}

function formatPost(p: ScoredPost) {
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

      // Exclude hidden posts for logged-in users
      if (userId) {
        const hiddenPosts = await db.hiddenPost.findMany({
          where: { userId },
          select: { postId: true },
        });
        if (hiddenPosts.length > 0) {
          where.id = { notIn: hiddenPosts.map((hp) => hp.postId) };
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
        author: { select: { id: true, name: true, image: true } },
        category: { select: { name: true, slug: true } },
        _count: { select: { comments: true, reactions: true } },
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

        return NextResponse.json({
          posts: items.map((p) =>
            formatPost({
              ...p,
              commentCount: p._count.comments,
              reactionCount: p._count.reactions,
            })
          ),
          nextCursor,
        });
      }

      // ── "discover" — trending community posts (7 days) ──
      if (feed === "discover") {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        where.createdAt = { gte: sevenDaysAgo };

        const offset = cursor?.startsWith("offset:") ? parseInt(cursor.slice(7), 10) : 0;

        const pool = await db.post.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
          include: includeFields,
        });

        const mapped: ScoredPost[] = pool.map((p) => ({
          ...p,
          commentCount: p._count.comments,
          reactionCount: p._count.reactions,
        }));

        const scored = scorePosts(mapped, new Set(), 1.5, 0);
        const paginated = scored.slice(offset, offset + limit);
        const nextCursor = offset + limit < scored.length ? `offset:${offset + limit}` : null;

        return NextResponse.json({
          posts: paginated.map(formatPost),
          nextCursor,
        });
      }

      // ── "foryou" — algorithmic mix (14 days, follow-boosted) ──
      if (feed === "foryou") {
        // If not logged in, fall back to discover-style trending
        const daysBack = userId ? 14 : 7;
        const poolLimit = userId ? 200 : 100;
        const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
        where.createdAt = { gte: cutoff };

        const offset = cursor?.startsWith("offset:") ? parseInt(cursor.slice(7), 10) : 0;

        const pool = await db.post.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: poolLimit,
          include: includeFields,
        });

        const mapped: ScoredPost[] = pool.map((p) => ({
          ...p,
          commentCount: p._count.comments,
          reactionCount: p._count.reactions,
        }));

        let scored = scorePosts(mapped, followingIds, 1.2, 50);
        if (userId) {
          scored = applyDiversity(scored, 3);
        }

        const paginated = scored.slice(offset, offset + limit);
        const nextCursor = offset + limit < scored.length ? `offset:${offset + limit}` : null;

        return NextResponse.json({
          posts: paginated.map(formatPost),
          nextCursor,
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
          author: { select: { id: true, name: true, image: true } },
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
      posts,
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

    if (!hasMinRole(userRole, "CONTRIBUTOR")) {
      return NextResponse.json(
        { error: "You need Contributor access to create posts" },
        { status: 403 }
      );
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
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/posts] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
