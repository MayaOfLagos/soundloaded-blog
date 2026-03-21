import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { indexArtist } from "@/lib/meilisearch";
import { z } from "zod";

const updateArtistProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional().nullable(),
  photo: z.string().url().optional().nullable().or(z.literal("")),
  coverImage: z.string().url().optional().nullable().or(z.literal("")),
  country: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  spotify: z.string().optional().nullable(),
  appleMusic: z.string().optional().nullable(),
});

async function requireArtist() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const artistProfileId = (session.user as { artistProfileId?: string | null }).artistProfileId;
  if (!artistProfileId) return null;
  return { session, artistProfileId };
}

export async function GET() {
  const result = await requireArtist();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const artist = await db.artist.findUnique({
    where: { id: result.artistProfileId },
    include: {
      _count: { select: { music: true, albums: true, artistFollows: true } },
    },
  });

  if (!artist) return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
  return NextResponse.json(artist);
}

export async function PUT(req: NextRequest) {
  const result = await requireArtist();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = updateArtistProfileSchema.parse(body);

    const artist = await db.artist.update({
      where: { id: result.artistProfileId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        bio: data.bio ?? undefined,
        photo: data.photo || undefined,
        coverImage: data.coverImage || undefined,
        country: data.country || undefined,
        genre: data.genre ?? undefined,
        instagram: data.instagram ?? undefined,
        twitter: data.twitter ?? undefined,
        facebook: data.facebook ?? undefined,
        spotify: data.spotify ?? undefined,
        appleMusic: data.appleMusic ?? undefined,
      },
    });

    indexArtist(artist);
    return NextResponse.json(artist);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[PUT /api/artist/profile]", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
