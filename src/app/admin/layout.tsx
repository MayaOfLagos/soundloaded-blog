import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { SessionProvider } from "next-auth/react";
import { AdminSidebarProvider } from "@/components/admin/AdminSidebarContext";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [session, settings, cookieStore] = await Promise.all([auth(), getSettings(), cookies()]);
  const sidebarCollapsed = cookieStore.get("admin-sidebar-collapsed")?.value === "true";

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string }).role;
  if (!["ADMIN", "SUPER_ADMIN", "EDITOR"].includes(role ?? "")) {
    redirect("/login");
  }

  const logo = {
    light: settings.logoLight,
    dark: settings.logoDark,
    favicon: settings.favicon,
  };

  return (
    <SessionProvider session={session}>
      <AdminSidebarProvider defaultCollapsed={sidebarCollapsed}>
        <AdminShell logo={logo}>{children}</AdminShell>
      </AdminSidebarProvider>
    </SessionProvider>
  );
}
