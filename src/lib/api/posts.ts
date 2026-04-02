import { db } from "@/lib/db";
import type { PostCardData } from "@/components/blog/PostCard";
import { getPostUrl } from "@/lib/urls";

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

export async function getFeaturedPost(permalinkStructure?: string): Promise<PostCardData | null> {
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
}

export async function getFeaturedPosts({
  limit = 5,
  permalinkStructure,
}: { limit?: number; permalinkStructure?: string } = {}): Promise<PostCardData[]> {
  try {
    const posts = await db.post.findMany({
      where: { status: "PUBLISHED", isUserGenerated: false, music: null },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: SELECT,
    });
    return posts.map((p) => mapPost(p, permalinkStructure));
  } catch {
    return [];
  }
}

export async function getFeaturedPostsByType({
  type,
  limit = 3,
  permalinkStructure,
}: {
  type: string;
  limit?: number;
  permalinkStructure?: string;
}): Promise<PostCardData[]> {
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
}

export async function getLatestPosts({
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
} = {}): Promise<PostCardData[]> {
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
}

export async function getTrendingPosts({
  limit = 5,
  permalinkStructure,
}: { limit?: number; permalinkStructure?: string } = {}): Promise<PostCardData[]> {
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
}

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
  permalinkStructure?: string
): Promise<PostCardData[]> {
  try {
    // First: try same category
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

    // Fallback: fill remaining slots from any category of the same type
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
  } catch {
    return [];
  }
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

export async function incrementViewCount(postId: string) {
  try {
    await db.post.update({ where: { id: postId }, data: { views: { increment: 1 } } });
  } catch {
    // silent
  }
}
