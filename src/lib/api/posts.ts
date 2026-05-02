import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { PostCardData } from "@/components/blog/PostCard";
import { getPostUrl } from "@/lib/urls";
import {
  createRecommendationCacheKey,
  diversifyRankedPosts,
  getRecommendationCacheTtlSeconds,
  isRecommendationV1Enabled,
  rankRelatedPosts,
  withRecommendationCache,
} from "@/lib/recommendation";
import type { Prisma } from "@prisma/client";

const SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  publishedAt: true,
  views: true,
  category: { select: { name: true, slug: true } },
  author: { select: { name: true, image: true } },
} as const;

const RELATED_SELECT = {
  ...SELECT,
  type: true,
  createdAt: true,
  author: { select: { id: true, name: true, image: true } },
  tags: { select: { tag: { select: { slug: true } } } },
  _count: { select: { comments: true, reactions: true, bookmarks: true, favorites: true } },
} as const;

type RawPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  views: number;
  category: { name: string; slug: string } | null;
  author: { name: string | null; image: string | null };
};

type RelatedPostCandidate = RawPost & {
  type: string;
  createdAt: Date;
  author: { id: string; name: string | null; image: string | null };
  tags: { tag: { slug: string } }[];
  _count: {
    comments: number;
    reactions: number;
    bookmarks: number;
    favorites: number;
  };
};

type RankableRelatedPostCandidate = RelatedPostCandidate & {
  createdAt: Date;
  tagSlugs: string[];
  commentCount: number;
  reactionCount: number;
  bookmarkCount: number;
  favoriteCount: number;
};

function mapPost(p: RawPost, permalinkStructure?: string): PostCardData {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    publishedAt: p.publishedAt ?? new Date(),
    viewCount: p.views,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
    author: p.author.name ? { name: p.author.name, avatar: p.author.image } : null,
    href: permalinkStructure ? getPostUrl(p, permalinkStructure) : undefined,
  };
}

function dedupeById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }

  return result;
}

function toRankableRelatedPost(post: RelatedPostCandidate): RankableRelatedPostCandidate {
  return {
    ...post,
    createdAt: post.publishedAt ?? post.createdAt,
    tagSlugs: post.tags.map(({ tag }) => tag.slug),
    commentCount: post._count.comments,
    reactionCount: post._count.reactions,
    bookmarkCount: post._count.bookmarks,
    favoriteCount: post._count.favorites,
  };
}

export const getFeaturedPost = unstable_cache(
  async (permalinkStructure?: string): Promise<PostCardData | null> => {
    try {
      const post = await db.post.findFirst({
        where: { status: "PUBLISHED", isUserGenerated: false, music: null },
        orderBy: { publishedAt: "desc" },
        select: SELECT,
      });
      return post ? mapPost(post, permalinkStructure) : null;
    } catch {
      return null;
    }
  },
  ["featured-post"],
  { revalidate: 300, tags: ["posts"] }
);

export const getFeaturedPosts = unstable_cache(
  async ({
    limit = 5,
    permalinkStructure,
  }: { limit?: number; permalinkStructure?: string } = {}): Promise<PostCardData[]> => {
    try {
      const posts = await db.post.findMany({
        where: { status: "PUBLISHED", isUserGenerated: false, music: { isNot: null } },
        orderBy: { publishedAt: "desc" },
        take: limit * 4,
        select: SELECT,
      });
      for (let i = posts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posts[i], posts[j]] = [posts[j], posts[i]];
      }
      return posts.slice(0, limit).map((p) => mapPost(p, permalinkStructure));
    } catch {
      return [];
    }
  },
  ["featured-posts"],
  { revalidate: 300, tags: ["posts"] }
);

export const getFeaturedPostsByType = unstable_cache(
  async ({
    type,
    limit = 3,
    permalinkStructure,
  }: {
    type: string;
    limit?: number;
    permalinkStructure?: string;
  }): Promise<PostCardData[]> => {
    try {
      const posts = await db.post.findMany({
        where: { status: "PUBLISHED", isUserGenerated: false, music: null, type: type as never },
        orderBy: { publishedAt: "desc" },
        take: limit,
        select: SELECT,
      });
      return posts.map((p) => mapPost(p, permalinkStructure));
    } catch {
      return [];
    }
  },
  ["featured-posts-by-type"],
  { revalidate: 300, tags: ["posts"] }
);

export const getLatestPosts = unstable_cache(
  async ({
    limit = 12,
    page = 1,
    categorySlug,
    type,
    permalinkStructure,
  }: {
    limit?: number;
    page?: number;
    categorySlug?: string;
    type?: string;
    permalinkStructure?: string;
  } = {}): Promise<PostCardData[]> => {
    try {
      const posts = await db.post.findMany({
        where: {
          status: "PUBLISHED",
          isUserGenerated: false,
          music: null,
          ...(categorySlug ? { category: { slug: categorySlug } } : {}),
          ...(type ? { type: type as never } : {}),
        },
        orderBy: { publishedAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        select: SELECT,
      });
      return posts.map((p) => mapPost(p, permalinkStructure));
    } catch {
      return [];
    }
  },
  ["latest-posts"],
  { revalidate: 60, tags: ["posts"] }
);

export const getTrendingPosts = unstable_cache(
  async ({
    limit = 5,
    permalinkStructure,
  }: { limit?: number; permalinkStructure?: string } = {}): Promise<PostCardData[]> => {
    try {
      const posts = await db.post.findMany({
        where: { status: "PUBLISHED", isUserGenerated: false, music: null },
        orderBy: { views: "desc" },
        take: limit,
        select: SELECT,
      });
      return posts.map((p) => mapPost(p, permalinkStructure));
    } catch {
      return [];
    }
  },
  ["trending-posts"],
  { revalidate: 300, tags: ["posts"] }
);

const POST_DETAIL_INCLUDE = {
  author: { select: { name: true, image: true, email: true } },
  category: { select: { name: true, slug: true } },
  tags: { include: { tag: { select: { name: true, slug: true } } } },
  downloadMedia: {
    select: {
      id: true,
      filename: true,
      r2Key: true,
      type: true,
      mimeType: true,
      size: true,
    },
  },
  music: {
    include: {
      artist: true,
      album: {
        include: {
          tracks: { orderBy: { trackNumber: "asc" as const } },
          artist: { select: { name: true, slug: true } },
        },
      },
    },
  },
} as const;

export async function getPostBySlug(slug: string) {
  try {
    return await db.post.findUnique({
      where: { slug, status: "PUBLISHED" },
      include: POST_DETAIL_INCLUDE,
    });
  } catch {
    return null;
  }
}

export async function getPostById(id: string) {
  try {
    return await db.post.findUnique({
      where: { id, status: "PUBLISHED" },
      include: POST_DETAIL_INCLUDE,
    });
  } catch {
    return null;
  }
}

export async function getRelatedPosts(
  postId: string,
  categorySlug?: string,
  limit = 4,
  permalinkStructure?: string
): Promise<PostCardData[]> {
  try {
    const posts = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        id: { not: postId },
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: SELECT,
    });
    return posts.map((p) => mapPost(p, permalinkStructure));
  } catch {
    return [];
  }
}

export async function getRelatedPostsByType(
  postId: string,
  type: string,
  categorySlug?: string,
  limit = 4,
  permalinkStructure?: string,
  tagSlugs: string[] = []
): Promise<PostCardData[]> {
  try {
    if (!isRecommendationV1Enabled()) {
      return getLegacyRelatedPostsByType(postId, type, categorySlug, limit, permalinkStructure);
    }

    const cleanTagSlugs = Array.from(new Set(tagSlugs.filter(Boolean)));
    const cacheKey = createRecommendationCacheKey([
      "related-posts",
      postId,
      type,
      categorySlug ?? "none",
      cleanTagSlugs.join(",") || "none",
      limit,
      permalinkStructure ?? "default",
    ]);

    return await withRecommendationCache({
      key: cacheKey,
      ttlSeconds: getRecommendationCacheTtlSeconds("relatedPosts"),
      load: async () =>
        getRankedRelatedPostsByType(
          postId,
          type,
          categorySlug,
          limit,
          permalinkStructure,
          cleanTagSlugs
        ),
    });
  } catch {
    return [];
  }
}

async function getRankedRelatedPostsByType(
  postId: string,
  type: string,
  categorySlug: string | undefined,
  limit: number,
  permalinkStructure: string | undefined,
  cleanTagSlugs: string[]
): Promise<PostCardData[]> {
  const candidateTake = Math.min(Math.max(limit * 8, 24), 80);
  const baseWhere: Prisma.PostWhereInput = {
    status: "PUBLISHED",
    id: { not: postId },
    type: type as never,
  };
  const affinityWhere: Prisma.PostWhereInput[] = [];

  if (categorySlug) {
    affinityWhere.push({ category: { slug: categorySlug } });
  }

  if (cleanTagSlugs.length > 0) {
    affinityWhere.push({ tags: { some: { tag: { slug: { in: cleanTagSlugs } } } } });
  }

  const [focused, broad] = await Promise.all([
    affinityWhere.length > 0
      ? db.post.findMany({
          where: { ...baseWhere, OR: affinityWhere },
          orderBy: [{ publishedAt: "desc" }, { views: "desc" }],
          take: candidateTake,
          select: RELATED_SELECT,
        })
      : Promise.resolve([] as RelatedPostCandidate[]),
    db.post.findMany({
      where: baseWhere,
      orderBy: [{ publishedAt: "desc" }, { views: "desc" }],
      take: candidateTake,
      select: RELATED_SELECT,
    }),
  ]);

  const candidates = dedupeById([...focused, ...broad]).map(toRankableRelatedPost);
  const ranked = rankRelatedPosts(candidates, {
    type,
    categorySlug,
    tagSlugs: cleanTagSlugs,
    candidateSource: "same_content_type",
  });
  const diversified = diversifyRankedPosts(ranked, {
    maxConsecutiveAuthors: 2,
    maxConsecutiveCategories: 3,
  });

  return diversified.slice(0, limit).map((p) => mapPost(p, permalinkStructure));
}

async function getLegacyRelatedPostsByType(
  postId: string,
  type: string,
  categorySlug?: string,
  limit = 4,
  permalinkStructure?: string
): Promise<PostCardData[]> {
  const sameCat = categorySlug
    ? await db.post.findMany({
        where: {
          status: "PUBLISHED",
          id: { not: postId },
          type: type as never,
          category: { slug: categorySlug },
        },
        orderBy: { publishedAt: "desc" },
        take: limit,
        select: SELECT,
      })
    : [];

  if (sameCat.length < limit) {
    const excludeIds = [postId, ...sameCat.map((p) => p.id)];
    const filler = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: excludeIds },
        type: type as never,
      },
      orderBy: { publishedAt: "desc" },
      take: limit - sameCat.length,
      select: SELECT,
    });
    return [...sameCat, ...filler].map((p) => mapPost(p, permalinkStructure));
  }

  return sameCat.map((p) => mapPost(p, permalinkStructure));
}

export async function getMoreFromArtist(artistId: string, excludeMusicId: string, limit = 5) {
  try {
    return await db.music.findMany({
      where: { artistId, id: { not: excludeMusicId } },
      orderBy: { downloadCount: "desc" },
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        coverArt: true,
        downloadCount: true,
        duration: true,
      },
    });
  } catch {
    return [];
  }
}

/** Gist sidebar: trending gist posts (most views) */
export async function getTrendingGistPosts({
  limit = 5,
  excludeId,
  permalinkStructure,
}: {
  limit?: number;
  excludeId?: string;
  permalinkStructure?: string;
}): Promise<PostCardData[]> {
  try {
    const posts = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        isUserGenerated: false,
        type: "GIST",
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      orderBy: { views: "desc" },
      take: limit,
      select: SELECT,
    });
    return posts.map((p) => mapPost(p, permalinkStructure));
  } catch {
    return [];
  }
}

/** Gist sidebar: hot gist (most views in recent 7 days) */
export async function getHotGistPosts({
  limit = 5,
  excludeId,
  permalinkStructure,
}: {
  limit?: number;
  excludeId?: string;
  permalinkStructure?: string;
}): Promise<PostCardData[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const posts = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        isUserGenerated: false,
        type: "GIST",
        publishedAt: { gte: sevenDaysAgo },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      orderBy: { views: "desc" },
      take: limit,
      select: SELECT,
    });
    return posts.map((p) => mapPost(p, permalinkStructure));
  } catch {
    return [];
  }
}

/** Gist sidebar: categories with post counts */
export async function getGistCategories(): Promise<
  { name: string; slug: string; postCount: number }[]
> {
  try {
    const cats = await db.category.findMany({
      where: { posts: { some: { type: "GIST", status: "PUBLISHED" } } },
      select: {
        name: true,
        slug: true,
        _count: { select: { posts: { where: { type: "GIST", status: "PUBLISHED" } } } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return cats.map((c) => ({ name: c.name, slug: c.slug, postCount: c._count.posts }));
  } catch {
    return [];
  }
}

/** Gist sidebar: mixed content from other types (NEWS, VIDEO, etc.) — excludes MUSIC */
export async function getMixedContent({
  limit = 5,
  permalinkStructure,
}: {
  limit?: number;
  permalinkStructure?: string;
}): Promise<PostCardData[]> {
  try {
    const posts = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        isUserGenerated: false,
        type: { in: ["NEWS", "VIDEO", "LYRICS"] },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: SELECT,
    });
    return posts.map((p) => mapPost(p, permalinkStructure));
  } catch {
    return [];
  }
}

/** News sidebar: trending news posts (most views) */
export async function getTrendingNewsPosts({
  limit = 5,
  excludeId,
  permalinkStructure,
}: {
  limit?: number;
  excludeId?: string;
  permalinkStructure?: string;
}): Promise<PostCardData[]> {
  try {
    const posts = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        isUserGenerated: false,
        type: "NEWS",
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      orderBy: { views: "desc" },
      take: limit,
      select: SELECT,
    });
    return posts.map((p) => mapPost(p, permalinkStructure));
  } catch {
    return [];
  }
}

/** News sidebar: recent news from the last 7 days */
export async function getRecentNewsPosts({
  limit = 5,
  excludeId,
  permalinkStructure,
}: {
  limit?: number;
  excludeId?: string;
  permalinkStructure?: string;
}): Promise<PostCardData[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const posts = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        isUserGenerated: false,
        type: "NEWS",
        publishedAt: { gte: sevenDaysAgo },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: SELECT,
    });
    return posts.map((p) => mapPost(p, permalinkStructure));
  } catch {
    return [];
  }
}

/** News sidebar: news categories with post counts */
export async function getNewsCategories(): Promise<
  { name: string; slug: string; postCount: number }[]
> {
  try {
    const cats = await db.category.findMany({
      where: { posts: { some: { type: "NEWS", status: "PUBLISHED" } } },
      select: {
        name: true,
        slug: true,
        _count: { select: { posts: { where: { type: "NEWS", status: "PUBLISHED" } } } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return cats.map((c) => ({ name: c.name, slug: c.slug, postCount: c._count.posts }));
  } catch {
    return [];
  }
}

/** Video sidebar: trending videos (most views all-time) */
export async function getTrendingVideoPosts({
  limit = 5,
  excludeId,
  permalinkStructure,
}: {
  limit?: number;
  excludeId?: string;
  permalinkStructure?: string;
}): Promise<PostCardData[]> {
  try {
    const posts = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        isUserGenerated: false,
        type: "VIDEO",
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      orderBy: { views: "desc" },
      take: limit,
      select: SELECT,
    });
    return posts.map((p) => mapPost(p, permalinkStructure));
  } catch {
    return [];
  }
}

/** Video sidebar: recent videos from the last 7 days */
export async function getRecentVideoPosts({
  limit = 5,
  excludeId,
  permalinkStructure,
}: {
  limit?: number;
  excludeId?: string;
  permalinkStructure?: string;
}): Promise<PostCardData[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const posts = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        isUserGenerated: false,
        type: "VIDEO",
        publishedAt: { gte: sevenDaysAgo },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: SELECT,
    });
    return posts.map((p) => mapPost(p, permalinkStructure));
  } catch {
    return [];
  }
}

/** Video sidebar: video categories with post counts */
export async function getVideoCategories(): Promise<
  { name: string; slug: string; postCount: number }[]
> {
  try {
    const cats = await db.category.findMany({
      where: { posts: { some: { type: "VIDEO", status: "PUBLISHED" } } },
      select: {
        name: true,
        slug: true,
        _count: { select: { posts: { where: { type: "VIDEO", status: "PUBLISHED" } } } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return cats.map((c) => ({ name: c.name, slug: c.slug, postCount: c._count.posts }));
  } catch {
    return [];
  }
}

export async function getPostCount(categorySlug?: string, type?: string): Promise<number> {
  try {
    return await db.post.count({
      where: {
        status: "PUBLISHED",
        isUserGenerated: false,
        music: null,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(type ? { type: type as never } : {}),
      },
    });
  } catch {
    return 0;
  }
}

export async function incrementViewCount(postId: string) {
  try {
    await db.post.update({ where: { id: postId }, data: { views: { increment: 1 } } });
  } catch {
    // silent
  }
}
