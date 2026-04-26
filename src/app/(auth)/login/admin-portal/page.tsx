import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin-login-form";

type SearchParams = Promise<{
  callbackUrl?: string | string[];
  reason?: string | string[];
  error?: string | string[];
}>;

function getFirstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

function getSafeCallbackUrl(raw: string | null): string {
  if (!raw?.startsWith("/admin")) return "/admin";
  return raw;
}

export default async function AdminPortalPage({ searchParams }: { searchParams: SearchParams }) {
  // Verify this request came through the middleware rewrite.
  // Direct browser access never carries this header.
  const h = await headers();
  if (h.get("x-admin-gateway-origin") !== process.env.ADMIN_PORTAL_SECRET) {
    notFound();
  }

  // Already-authenticated admins skip the form
  const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "EDITOR"]);
  const session = await auth();
  if (session?.user && ADMIN_ROLES.has((session.user as { role?: string }).role ?? "")) {
    redirect("/admin");
  }

  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(getFirstParam(params.callbackUrl));
  const reason = getFirstParam(params.reason);
  const authError = getFirstParam(params.error);

  return (
    <div className="w-full max-w-sm md:max-w-3xl">
      <AdminLoginForm callbackUrl={callbackUrl} authError={authError} reason={reason} />
    </div>
  );
}
