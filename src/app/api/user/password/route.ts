import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validations/user";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();
  const result = changePasswordSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid data", issues: result.error.issues },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = result.data;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user?.password) {
    return NextResponse.json(
      { error: "Cannot change password for OAuth-only accounts" },
      { status: 400 }
    );
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await db.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ message: "Password updated successfully" });
}
