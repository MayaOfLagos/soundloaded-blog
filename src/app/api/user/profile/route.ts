import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProfileSchema } from "@/lib/validations/user";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      bio: true,
      location: true,
      socialLinks: true,
      createdAt: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();
  const result = updateProfileSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid data", issues: result.error.issues },
      { status: 400 }
    );
  }

  const { name, bio, location, socialLinks, image } = result.data;

  const user = await db.user.update({
    where: { id: userId },
    data: { name, bio, location, socialLinks, image },
    select: {
      name: true,
      email: true,
      image: true,
      bio: true,
      location: true,
      socialLinks: true,
      createdAt: true,
      role: true,
    },
  });

  return NextResponse.json(user);
}
