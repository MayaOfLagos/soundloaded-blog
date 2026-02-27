import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { indexPost, removeFromIndex, INDEXES } from "@/lib/meilisearch";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "EDITOR"];

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !ADMIN_ROLES.includes(role)) return null;
  return session;
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  excerpt: z.string().optional().nullable(),
  body: z.any().optional(),
  coverImage: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
  type: z.enum(["NEWS", "MUSIC", "GIST", "ALBUM", "VIDEO", "LYRICS"]).optional(),
  publishedAt: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  authorId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post = await db.post.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const { publishedAt: rawPublishedAt, ...rest } = data;
    const updateData: Record<string, unknown> = { ...rest };

    if (rawPublishedAt !== undefined) {
      updateData.publishedAt = rawPublishedAt ? new Date(rawPublishedAt) : null;
    } else if (data.status === "PUBLISHED") {
      updateData.publishedAt = new Date();
    }

    const post = await db.post.update({
      where: { id },
      data: updateData as Parameters<typeof db.post.update>[0]["data"],
    });

    indexPost(post);
    return NextResponse.json(post);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[PUT /api/admin/posts/[id]]", err);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Archive instead of hard delete to preserve data integrity
  const post = await db.post.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  removeFromIndex(INDEXES.POSTS, id);
  return NextResponse.json(post);
}
