import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteAccountSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();
  const parsed = deleteAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user?.password) {
    return NextResponse.json(
      { error: "Account uses OAuth — password deletion not supported" },
      { status: 400 }
    );
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
  }

  await db.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
