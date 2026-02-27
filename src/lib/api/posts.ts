import { db } from "@/lib/db";
import type { PostCardData } from "@/components/blog/PostCard";

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

function mapPost(p: {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  views: number;
  category: { name: string; slug: string } | null;
  author: { name: string | null; image: string | null };
}): PostCardData {
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
  };
}

export async function getFeaturedPost(): Promise<PostCardData | null> {
  try {
    const post = await db.post.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: SELECT,
    });
    return post ? mapPost(post) : null;
  } catch {
    return null;
  }
}

export async function getLatestPosts({
  limit = 12,
  page = 1,
  categorySlug,
  type,
}: {
  limit?: number;
  page?: number;
  categorySlug?: string;
  type?: string;
} = {}): Promise<PostCardData[]> {
  try {
    const posts = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(type ? { type: type as never } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      select: SELECT,
    });
    return posts.map(mapPost);
  } catch {
    return [];
  }
}

export async function getTrendingPosts({ limit = 5 }: { limit?: number } = {}): Promise<
  PostCardData[]
> {
  try {
    const posts = await db.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { views: "desc" },
      take: limit,
      select: SELECT,
    });
    return posts.map(mapPost);
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  try {
    return await db.post.findUnique({
      where: { slug, status: "PUBLISHED" },
      include: {
        author: { select: { name: true, image: true, email: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
      },
    });
  } catch {
    return null;
  }
}

export async function getRelatedPosts(
  postId: string,
  categorySlug?: string,
  limit = 4
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
    return posts.map(mapPost);
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
