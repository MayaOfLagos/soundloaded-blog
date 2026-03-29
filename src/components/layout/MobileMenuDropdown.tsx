"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import useMeasure from "react-use-measure";
import {
  Menu,
  Home,
  Rss,
  Compass,
  User,
  Download,
  Bookmark,
  Heart,
  Moon,
  Sun,
  Bell,
  Settings,
  Shield,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "EDITOR"];
const easeOutQuint: [number, number, number, number] = [0.23, 1, 0.32, 1];

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }> | null;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}

export function MobileMenuDropdown() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const { data: settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentRef, contentBounds] = useMeasure();

  /* eslint-disable react-hooks/set-state-in-effect -- hydration guard */
  useEffect(() => {
    setHasMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isAuthenticated = status === "authenticated" && !!session;
  const user = session?.user as
    | {
        id?: string;
        name?: string | null;
        role?: string;
      }
    | undefined;
  const isAdmin = ADMIN_ROLES.includes(user?.role ?? "");

  // Build nav links based on feature toggles
  const navItems: MenuItem[] = [
    { id: "home", label: "Home", icon: Home, href: "/" },
    ...(settings?.enableFeed !== false
      ? [{ id: "feed", label: "Feed", icon: Rss, href: "/feed" } as MenuItem]
      : []),
    ...(settings?.enableExplore !== false
      ? [{ id: "explore", label: "Explore", icon: Compass, href: "/explore" } as MenuItem]
      : []),
  ];

  // Build menu items based on auth state
  let menuItems: MenuItem[];

  if (isAuthenticated) {
    menuItems = [
      ...navItems,
      { id: "divider-1", label: "", icon: null },
      { id: "profile", label: "My Profile", icon: User, href: "/settings" },
      { id: "downloads", label: "My Downloads", icon: Download, href: "/downloads" },
      { id: "bookmarks", label: "Bookmarks", icon: Bookmark, href: "/bookmarks" },
      { id: "favorites", label: "Favorites", icon: Heart, href: "/favorites" },
      { id: "notifications", label: "Notifications", icon: Bell, href: "/notifications" },
      { id: "divider-2", label: "", icon: null },
      { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
      ...(isAdmin
        ? [{ id: "admin", label: "Admin Panel", icon: Shield, href: "/admin" } as MenuItem]
        : []),
      { id: "divider-3", label: "", icon: null },
      { id: "theme", label: "Dark Mode", icon: null },
      {
        id: "logout",
        label: "Sign Out",
        icon: LogOut,
        danger: true,
        onClick: () => signOut({ callbackUrl: "/" }),
      },
    ];
  } else {
    menuItems = [
      ...navItems,
      { id: "divider-1", label: "", icon: null },
      { id: "signin", label: "Sign In", icon: LogIn, href: "/login" },
      { id: "signup", label: "Sign Up", icon: UserPlus, href: "/register" },
    ];
  }

  const openHeight = Math.max(40, Math.ceil(contentBounds.height));

  return (
    <div ref={containerRef} className="not-prose relative h-10 w-10 md:hidden">
      <motion.div
        layout
        initial={false}
        animate={{
          width: isOpen ? 220 : 40,
          height: isOpen ? openHeight : 40,
          borderRadius: isOpen ? 14 : 20,
        }}
        transition={{
          type: "spring" as const,
          damping: 34,
          stiffness: 380,
          mass: 0.8,
        }}
        className="border-border bg-popover absolute top-0 right-0 origin-top-right cursor-pointer overflow-hidden border shadow-lg"
        onClick={() => !isOpen && setIsOpen(true)}
      >
        {/* Collapsed: Hamburger icon */}
        <motion.div
          initial={false}
          animate={{
            opacity: isOpen ? 0 : 1,
            scale: isOpen ? 0.8 : 1,
          }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: isOpen ? "none" : "auto" }}
        >
          <Menu className="text-foreground h-5 w-5" />
        </motion.div>

        {/* Expanded: Menu content */}
        <div ref={contentRef}>
          <motion.div
            layout
            initial={false}
            animate={{ opacity: isOpen ? 1 : 0 }}
            transition={{ duration: 0.2, delay: isOpen ? 0.08 : 0 }}
            className="p-2"
            style={{ pointerEvents: isOpen ? "auto" : "none" }}
          >
            <ul className="m-0! flex list-none! flex-col gap-0.5 p-0!">
              {menuItems.map((item, index) => {
                // Divider
                if (item.id.startsWith("divider")) {
                  return (
                    <motion.hr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isOpen ? 1 : 0 }}
                      transition={{ delay: isOpen ? 0.12 + index * 0.015 : 0 }}
                      className="border-border my-1"
                    />
                  );
                }

                // Dark mode toggle
                if (item.id === "theme") {
                  const ThemeIcon = hasMounted && theme === "dark" ? Sun : Moon;
                  const itemDelay = isOpen ? 0.06 + index * 0.02 : 0;

                  return (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 8 }}
                      transition={{ delay: itemDelay, duration: 0.15, ease: easeOutQuint }}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTheme(theme === "dark" ? "light" : "dark");
                      }}
                      className="text-muted-foreground hover:text-foreground relative flex cursor-pointer items-center gap-3 rounded-lg py-2 pr-3 pl-3 text-sm transition-colors duration-200"
                    >
                      {hoveredItem === item.id && (
                        <motion.div
                          layoutId="mobileMenuIndicator"
                          className="bg-muted absolute inset-0 rounded-lg"
                          transition={{ type: "spring", damping: 30, stiffness: 520, mass: 0.8 }}
                        />
                      )}
                      <ThemeIcon className="relative z-10 h-[18px] w-[18px]" />
                      <span className="relative z-10 flex-1 font-medium">Dark Mode</span>
                      <div
                        className={`relative z-10 h-5 w-9 rounded-full transition-colors ${
                          hasMounted && theme === "dark" ? "bg-brand" : "bg-muted-foreground/30"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                            hasMounted && theme === "dark" ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </motion.li>
                  );
                }

                // Regular menu item
                const Icon = item.icon!;
                const isActive = item.href
                  ? item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                  : false;
                const showIndicator = hoveredItem === item.id || isActive;
                const itemDelay = isOpen ? 0.06 + index * 0.02 : 0;

                const content = (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 8 }}
                    transition={{ delay: itemDelay, duration: 0.15, ease: easeOutQuint }}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`relative flex cursor-pointer items-center gap-3 rounded-lg py-2 pr-3 pl-3 text-sm transition-colors duration-200 ${
                      item.danger && showIndicator
                        ? "text-red-600"
                        : item.danger
                          ? "text-muted-foreground hover:text-red-600"
                          : isActive
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {showIndicator && (
                      <motion.div
                        layoutId="mobileMenuIndicator"
                        className={`absolute inset-0 rounded-lg ${
                          item.danger ? "bg-red-500/10" : "bg-muted"
                        }`}
                        transition={{ type: "spring", damping: 30, stiffness: 520, mass: 0.8 }}
                      />
                    )}
                    {showIndicator && (
                      <motion.div
                        layoutId="mobileMenuLeftBar"
                        className={`absolute top-0 bottom-0 left-0 my-auto h-5 w-[3px] rounded-full ${
                          item.danger ? "bg-red-500" : "bg-foreground"
                        }`}
                        transition={{ type: "spring", damping: 30, stiffness: 520, mass: 0.8 }}
                      />
                    )}
                    <Icon className="relative z-10 h-[18px] w-[18px]" />
                    <span className="relative z-10 font-medium">{item.label}</span>
                  </motion.li>
                );

                if (item.href) {
                  return (
                    <Link key={item.id} href={item.href} onClick={() => setIsOpen(false)}>
                      {content}
                    </Link>
                  );
                }

                return content;
              })}
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
