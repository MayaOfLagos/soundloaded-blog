"use client";

import type { ReactNode } from "react";
import { AdminSidebar, type AdminLogo } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { useAdminSidebar } from "./AdminSidebarContext";

export function AdminShell({ children, logo }: { children: ReactNode; logo?: AdminLogo }) {
  const { collapsed } = useAdminSidebar();

  return (
    <div className="bg-sidebar text-foreground flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={`bg-sidebar hidden shrink-0 flex-col transition-[width] duration-200 ease-in-out md:flex ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <AdminSidebar logo={logo} />
      </aside>

      {/* Inset content area */}
      <div className="md:border-sidebar-border md:bg-background bg-background flex flex-1 flex-col overflow-hidden md:m-2 md:ml-0 md:rounded-xl md:border md:shadow-sm">
        <AdminHeader logo={logo} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
