"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const COOKIE_NAME = "admin-sidebar-collapsed";

type SidebarContextType = {
  collapsed: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => {},
});

export function AdminSidebarProvider({
  children,
  defaultCollapsed = false,
}: {
  children: ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      // Persist to cookie (365 days, accessible server-side on next request)
      document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>{children}</SidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  return useContext(SidebarContext);
}
