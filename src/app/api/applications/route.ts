import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { creatorApplicationSchema } from "@/lib/validations/application";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applications = await db.creatorApplication.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = creatorApplicationSchema.parse(body);

    // Check if user already has an approved profile
    const [existingArtist, existingLabel] = await Promise.all([
      db.artist.findUnique({ where: { ownerId: session.user.id }, select: { id: true } }),
      db.label.findUnique({ where: { ownerId: session.user.id }, select: { id: true } }),
    ]);

    if (existingArtist || existingLabel) {
      return NextResponse.json(
        { error: "You already have an approved creator profile" },
        { status: 409 }
      );
    }

    // Check for pending application
    const pendingApp = await db.creatorApplication.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
    });

    if (pendingApp) {
      return NextResponse.json(
        { error: "You already have a pending application" },
        { status: 409 }
      );
    }

    // Check slug availability
    if (data.type === "ARTIST") {
      const existingSlug = await db.artist.findUnique({ where: { slug: data.slug } });
      if (existingSlug) {
        return NextResponse.json({ error: "This slug is already taken" }, { status: 409 });
      }
    } else {
      const existingSlug = await db.label.findUnique({ where: { slug: data.slug } });
      if (existingSlug) {
        return NextResponse.json({ error: "This slug is already taken" }, { status: 409 });
      }
    }

    const application = await db.creatorApplication.create({
      data: {
        userId: session.user.id,
        type: data.type,
        displayName: data.displayName,
        slug: data.slug,
        bio: data.bio ?? null,
        genre: data.genre ?? null,
        country: data.country ?? "Nigeria",
        photo: data.photo || null,
        socialLinks: data.socialLinks ?? undefined,
        proofUrls: data.proofUrls ?? undefined,
      },
    });

    // Notify admins
    const admins = await db.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          actorId: session.user.id,
          type: "APPLICATION_SUBMITTED" as const,
          title: "New creator application",
          body: `${session.user.name ?? "A user"} applied as ${data.type.toLowerCase()}: ${data.displayName}`,
          link: "/admin/creators",
        })),
      });
    }

    return NextResponse.json(application, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[POST /api/applications]", err);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
