import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { applicationReviewSchema } from "@/lib/validations/application";
import { indexArtist } from "@/lib/meilisearch";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !ADMIN_ROLES.includes(role)) return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const application = await db.creatorApplication.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true, username: true, role: true },
      },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json(application);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const data = applicationReviewSchema.parse(body);

    const application = await db.creatorApplication.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.status !== "PENDING") {
      return NextResponse.json({ error: "Application already reviewed" }, { status: 409 });
    }

    if (data.status === "APPROVED") {
      // Handle slug collision
      let finalSlug = application.slug;
      if (application.type === "ARTIST") {
        let existing = await db.artist.findUnique({ where: { slug: finalSlug } });
        let counter = 2;
        while (existing) {
          finalSlug = `${application.slug}-${counter}`;
          existing = await db.artist.findUnique({ where: { slug: finalSlug } });
          counter++;
        }
      } else {
        let existing = await db.label.findUnique({ where: { slug: finalSlug } });
        let counter = 2;
        while (existing) {
          finalSlug = `${application.slug}-${counter}`;
          existing = await db.label.findUnique({ where: { slug: finalSlug } });
          counter++;
        }
      }

      const socialLinks = (application.socialLinks as Record<string, string> | null) ?? {};

      // Atomically: update application + create Artist/Label record
      const result = await db.$transaction(async (tx) => {
        const updated = await tx.creatorApplication.update({
          where: { id },
          data: {
            status: "APPROVED",
            reviewedById: session.user.id,
            reviewNote: data.reviewNote ?? null,
            reviewedAt: new Date(),
          },
        });

        if (application.type === "ARTIST") {
          const artist = await tx.artist.create({
            data: {
              name: application.displayName,
              slug: finalSlug,
              bio: application.bio ?? null,
              photo: application.photo ?? null,
              country: application.country ?? "Nigeria",
              genre: application.genre ?? null,
              instagram: socialLinks.instagram ?? null,
              twitter: socialLinks.twitter ?? null,
              facebook: socialLinks.facebook ?? null,
              spotify: socialLinks.spotify ?? null,
              appleMusic: socialLinks.appleMusic ?? null,
              verified: false,
              ownerId: application.userId,
            },
          });
          return { updated, created: artist };
        } else {
          const label = await tx.label.create({
            data: {
              name: application.displayName,
              slug: finalSlug,
              bio: application.bio ?? null,
              logo: application.photo ?? null,
              country: application.country ?? "Nigeria",
              website: socialLinks.website ?? null,
              instagram: socialLinks.instagram ?? null,
              twitter: socialLinks.twitter ?? null,
              facebook: socialLinks.facebook ?? null,
              spotify: socialLinks.spotify ?? null,
              appleMusic: socialLinks.appleMusic ?? null,
              verified: false,
              ownerId: application.userId,
            },
          });
          return { updated, created: label };
        }
      });

      // Index artist in Meilisearch if applicable
      if (application.type === "ARTIST") {
        indexArtist(result.created);
      }

      // Notify applicant
      await db.notification.create({
        data: {
          userId: application.userId,
          actorId: session.user.id,
          type: "APPLICATION_APPROVED",
          title: "Application approved!",
          body: `Your ${application.type.toLowerCase()} application for "${application.displayName}" has been approved!`,
          link: "/dashboard",
        },
      });

      return NextResponse.json(result);
    } else {
      // REJECTED
      const updated = await db.creatorApplication.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedById: session.user.id,
          reviewNote: data.reviewNote ?? null,
          reviewedAt: new Date(),
        },
      });

      // Notify applicant
      await db.notification.create({
        data: {
          userId: application.userId,
          actorId: session.user.id,
          type: "APPLICATION_REJECTED",
          title: "Application update",
          body: `Your ${application.type.toLowerCase()} application for "${application.displayName}" was not approved.${data.reviewNote ? ` Note: ${data.reviewNote}` : ""}`,
          link: "/apply/artist",
        },
      });

      return NextResponse.json(updated);
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[PUT /api/admin/creators/[id]]", err);
    return NextResponse.json({ error: "Failed to review application" }, { status: 500 });
  }
}
