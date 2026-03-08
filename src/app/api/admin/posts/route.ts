import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { indexPost } from "@/lib/meilisearch";
import { autoSharePost } from "@/lib/social-share";
import { getPostUrl } from "@/lib/urls";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "EDITOR"];

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !ADMIN_ROLES.includes(role)) {
    return null;
  }
  return session;
}

const createSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional(),
  body: z.any(),
  coverImage: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).default("DRAFT"),
  type: z.enum(["NEWS", "MUSIC", "GIST", "ALBUM", "VIDEO", "LYRICS"]).default("NEWS"),
  publishedAt: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  authorId: z.string().optional().nullable(),
  enableDownload: z.boolean().optional().default(false),
  downloadLabel: z.string().max(120).optional().nullable(),
  downloadMediaId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const q = searchParams.get("q");

  const where = {
    ...(status ? { status: status as never } : {}),
    ...(type ? { type: type as never } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }] } : {}),
  };

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        type: true,
        publishedAt: true,
        views: true,
        createdAt: true,
        category: { select: { name: true, slug: true } },
        author: { select: { name: true } },
        _count: { select: { comments: true } },
      },
    }),
    db.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const userId = (session.user as { id?: string }).id;

    if (data.downloadMediaId) {
      const media = await db.media.findUnique({
        where: { id: data.downloadMediaId },
        select: { id: true, type: true },
      });

      if (!media || (media.type !== "AUDIO" && media.type !== "DOCUMENT")) {
        return NextResponse.json(
          { error: "Download attachment must be an audio or document file" },
          { status: 422 }
        );
      }
    }

    const post = await db.post.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        body: data.body ?? {},
        coverImage: data.coverImage,
        status: data.status,
        type: data.type,
        publishedAt: data.publishedAt
          ? new Date(data.publishedAt)
          : data.status === "PUBLISHED"
            ? new Date()
            : null,
        categoryId: data.categoryId ?? null,
        authorId: data.authorId ?? userId!,
        enableDownload: data.enableDownload && !!data.downloadMediaId,
        downloadLabel: data.downloadLabel?.trim() ? data.downloadLabel.trim() : null,
        downloadMediaId: data.downloadMediaId ?? null,
      },
    });

    indexPost(post);

    if (post.status === "PUBLISHED") {
      const settings = await db.siteSettings.findUnique({
        where: { id: "default" },
        select: { permalinkStructure: true },
      });
      const url = getPostUrl(post, settings?.permalinkStructure ?? "/%postname%");
      autoSharePost({ title: post.title, url, excerpt: post.excerpt, type: post.type });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[POST /api/admin/posts]", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
