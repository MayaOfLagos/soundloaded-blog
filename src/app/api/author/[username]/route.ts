import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      location: true,
      socialLinks: true,
      createdAt: true,
      _count: {
        select: {
          posts: { where: { status: "PUBLISHED" } },
          followers: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  // Fetch the author's latest published posts
  const posts = await db.post.findMany({
    where: {
      authorId: user.id,
      status: "PUBLISHED",
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
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
  });

  return NextResponse.json({
    author: {
      name: user.name,
      username: user.username,
      image: user.image,
      bio: user.bio,
      location: user.location,
      socialLinks: user.socialLinks,
      createdAt: user.createdAt,
      postCount: user._count.posts,
      followerCount: user._count.followers,
    },
    posts: posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverImage: p.coverImage,
      publishedAt: p.publishedAt,
      viewCount: p.views,
      type: p.type,
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
      author: p.author.name ? { name: p.author.name, avatar: p.author.image } : null,
    })),
  });
}
