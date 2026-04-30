import { NextResponse } from "next/server";
import { getAdminOpsSnapshot } from "@/lib/admin-ops";
import { getSessionRole, isEditor, unauthorizedResponse } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessionRole = await getSessionRole();
  if (!sessionRole || !isEditor(sessionRole.role)) return unauthorizedResponse();

  const snapshot = await getAdminOpsSnapshot(sessionRole.role);
  return NextResponse.json(snapshot);
}
