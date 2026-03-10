import { db } from "@/lib/db";
import { getPostUrl } from "@/lib/urls";
import { getSettings } from "@/lib/settings";

export interface ExplorePost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date;
  views: number;
  type: string;
  href: string;
  category: { name: string; slug: string } | null;
  author: { name: string | null; avatar: string | null };
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
  publishedAt: true,
  views: true,
  type: true,
  category: { select: { name: true, slug: true } },
  author: { select: { name: true, image: true } },
  _count: { select: { comments: true, bookmarks: true, favorites: true, reactions: true } },
} as const;

type RawExplorePost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  views: number;
  type: string;
  category: { name: string; slug: string } | null;
  author: { name: string | null; image: string | null };
  _count: { comments: number; bookmarks: number; favorites: number; reactions: number };
};

function mapExplorePost(p: RawExplorePost, permalinkStructure?: string): ExplorePost {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    publishedAt: p.publishedAt ?? new Date(),
    views: p.views,
    type: p.type,
    href: permalinkStructure ? getPostUrl(p, permalinkStructure) : `/${p.slug}`,
    category: p.category,
    author: { name: p.author.name, avatar: p.author.image },
    commentCount: p._count.comments,
    bookmarkCount: p._count.bookmarks,
    favoriteCount: p._count.favorites,
    reactionCount: p._count.reactions,
  };
}

function buildTypeFilter(type?: string) {
  if (!type || type === "all") return {};
  return { type: type.toUpperCase() as never };
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

/** Latest posts, ordered by publishedAt desc */
export async function getExploreLatest(
  page = 1,
  limit = 10,
  type?: string
): Promise<ExploreResult> {
  const settings = await getSettings();
  const where = { status: "PUBLISHED" as const, ...buildTypeFilter(type) };

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

/** Top posts of all time, ordered by views desc */
export async function getExploreTop(page = 1, limit = 10, type?: string): Promise<ExploreResult> {
  const settings = await getSettings();
  const where = { status: "PUBLISHED" as const, ...buildTypeFilter(type) };

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

/** Trending: posts from last 7 days, ordered by views desc */
export async function getExploreTrending(
  page = 1,
  limit = 10,
  type?: string
): Promise<ExploreResult> {
  const settings = await getSettings();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const where = {
    status: "PUBLISHED" as const,
    publishedAt: { gte: sevenDaysAgo },
    ...buildTypeFilter(type),
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

/** Hot: posts with most bookmarks + favorites in the last 7 days */
export async function getExploreHot(page = 1, limit = 10, type?: string): Promise<ExploreResult> {
  const settings = await getSettings();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const typeFilter = type && type !== "all" ? `AND p."type" = '${type.toUpperCase()}'` : "";

  const countResult = await db.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) as count FROM "Post" p WHERE p."status" = 'PUBLISHED' ${typeFilter}`
  );
  const total = Number(countResult[0]?.count ?? 0);

  const rawPosts = await db.$queryRawUnsafe<
    {
      id: string;
      slug: string;
      title: string;
      excerpt: string | null;
      coverImage: string | null;
      publishedAt: Date | null;
      views: number;
      type: string;
      categoryName: string | null;
      categorySlug: string | null;
      authorName: string | null;
      authorImage: string | null;
      commentCount: bigint;
      bookmarkCount: bigint;
      favoriteCount: bigint;
      reactionCount: bigint;
      hotScore: bigint;
    }[]
  >(
    `SELECT
      p."id", p."slug", p."title", p."excerpt", p."coverImage",
      p."publishedAt", p."views", p."type",
      c."name" as "categoryName", c."slug" as "categorySlug",
      u."name" as "authorName", u."image" as "authorImage",
      (SELECT COUNT(*) FROM "Comment" cm WHERE cm."postId" = p."id") as "commentCount",
      (SELECT COUNT(*) FROM "Bookmark" b WHERE b."postId" = p."id") as "bookmarkCount",
      (SELECT COUNT(*) FROM "Favorite" f WHERE f."postId" = p."id") as "favoriteCount",
      (SELECT COUNT(*) FROM "Reaction" r WHERE r."postId" = p."id") as "reactionCount",
      (
        (SELECT COUNT(*) FROM "Bookmark" b WHERE b."postId" = p."id" AND b."createdAt" >= $1) +
        (SELECT COUNT(*) FROM "Favorite" f WHERE f."postId" = p."id" AND f."createdAt" >= $1)
      ) as "hotScore"
    FROM "Post" p
    LEFT JOIN "Category" c ON c."id" = p."categoryId"
    LEFT JOIN "User" u ON u."id" = p."authorId"
    WHERE p."status" = 'PUBLISHED' ${typeFilter}
    ORDER BY "hotScore" DESC, p."views" DESC
    LIMIT $2 OFFSET $3`,
    sevenDaysAgo,
    limit,
    (page - 1) * limit
  );

  const posts: ExplorePost[] = rawPosts.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    coverImage: r.coverImage,
    publishedAt: r.publishedAt ?? new Date(),
    views: r.views,
    type: r.type,
    href: settings.permalinkStructure
      ? getPostUrl(
          {
            slug: r.slug,
            id: r.id,
            publishedAt: r.publishedAt,
            category: r.categorySlug ? { slug: r.categorySlug } : null,
            author: { name: r.authorName },
          },
          settings.permalinkStructure
        )
      : `/${r.slug}`,
    category: r.categoryName ? { name: r.categoryName, slug: r.categorySlug! } : null,
    author: { name: r.authorName, avatar: r.authorImage },
    commentCount: Number(r.commentCount),
    bookmarkCount: Number(r.bookmarkCount),
    favoriteCount: Number(r.favoriteCount),
    reactionCount: Number(r.reactionCount),
  }));

  return { posts, pagination: buildPagination(page, limit, total) };
}
