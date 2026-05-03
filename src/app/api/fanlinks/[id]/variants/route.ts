import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const variantSchema = z.object({
  label: z.string().max(20).default("B"),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  coverArt: z.string().optional().nullable(),
  accentColor: z.string().optional().nullable(),
  platformLinks: z
    .array(
      z.object({
        platform: z.string(),
        url: z.string().url(),
        label: z.string().optional(),
        isEnabled: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
      })
    )
    .default([]),
});

async function getOwnedFanlink(id: string, userId: string) {
  return db.fanlink.findFirst({ where: { id, createdById: userId }, select: { id: true } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  if (!(await getOwnedFanlink(id, userId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const variants = await db.fanlinkVariant.findMany({
    where: { fanlinkId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(variants);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  if (!(await getOwnedFanlink(id, userId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = variantSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const variant = await db.fanlinkVariant.create({
    data: { fanlinkId: id, ...parsed.data },
  });
  return NextResponse.json(variant, { status: 201 });
}
