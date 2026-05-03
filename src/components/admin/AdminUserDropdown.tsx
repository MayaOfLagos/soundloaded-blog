"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import useMeasure from "react-use-measure";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { User, Settings, Moon, Sun, HelpCircle, LogOut, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type MenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }> | null;
  onClick?: () => void;
};

const easeOutQuint: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function AdminUserDropdown() {
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("profile");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentRef, contentBounds] = useMeasure();

  const user = session?.user;

  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        id: "profile",
        label: "Profile",
        icon: User,
        onClick: () => {
          router.push("/admin/settings");
          setIsOpen(false);
        },
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: BarChart3,
        onClick: () => {
          router.push("/admin/analytics");
          setIsOpen(false);
        },
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        onClick: () => {
          router.push("/admin/settings");
          setIsOpen(false);
        },
      },
      { id: "divider1", label: "", icon: null },
      {
        id: "theme",
        label: resolvedTheme === "dark" ? "Light Mode" : "Dark Mode",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        onClick: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
      {
        id: "help",
        label: "Get Help",
        icon: HelpCircle,
        onClick: () => {
          window.open("/", "_blank");
          setIsOpen(false);
        },
      },
      { id: "divider2", label: "", icon: null },
      {
        id: "logout",
        label: "Sign Out",
        icon: LogOut,
        onClick: () => {
          signOut({ callbackUrl: "/login" });
        },
      },
    ],
    [resolvedTheme, router, setTheme]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const openHeight = Math.max(40, Math.ceil(contentBounds.height));

  return (
    <div ref={containerRef} className="relative h-9 w-9">
      <motion.div
        layout
        initial={false}
        animate={{
          width: isOpen ? 220 : 36,
          height: isOpen ? openHeight : 36,
          borderRadius: isOpen ? 14 : 18,
        }}
        transition={{
          type: "spring" as const,
          damping: 34,
          stiffness: 380,
          mass: 0.8,
        }}
        className="bg-popover border-border absolute top-0 right-0 origin-top-right cursor-pointer overflow-hidden border shadow-lg"
        onClick={() => !isOpen && setIsOpen(true)}
      >
        {/* Closed state: avatar */}
        <motion.div
          initial={false}
          animate={{
            opacity: isOpen ? 0 : 1,
            scale: isOpen ? 0.8 : 1,
          }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: isOpen ? "none" : "auto", willChange: "transform" }}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.image || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Open state: user info + menu */}
        <div ref={contentRef}>
          <motion.div
            layout
            initial={false}
            animate={{ opacity: isOpen ? 1 : 0 }}
            transition={{ duration: 0.2, delay: isOpen ? 0.08 : 0 }}
            className="p-2"
            style={{ pointerEvents: isOpen ? "auto" : "none", willChange: "transform" }}
          >
            {/* User info header */}
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 8 }}
              transition={{ delay: isOpen ? 0.04 : 0, duration: 0.15, ease: easeOutQuint }}
              className="flex items-center gap-2.5 px-3 py-2"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user?.image || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-semibold">
                  {user?.name || "Admin"}
                </p>
                <p className="text-muted-foreground truncate text-xs">{user?.email || ""}</p>
              </div>
            </motion.div>

            <motion.hr
              initial={{ opacity: 0 }}
              animate={{ opacity: isOpen ? 1 : 0 }}
              transition={{ delay: isOpen ? 0.06 : 0 }}
              className="border-border my-1"
            />

            {/* Menu items */}
            <ul className="flex flex-col gap-0.5">
              {menuItems.map((item, index) => {
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

                const IconComponent = item.icon!;
                const isActive = activeItem === item.id;
                const isLogout = item.id === "logout";
                const showIndicator = hoveredItem ? hoveredItem === item.id : isActive;

                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 8 }}
                    transition={{
                      delay: isOpen ? 0.08 + index * 0.02 : 0,
                      duration: isLogout ? 0.12 : 0.15,
                      ease: easeOutQuint,
                    }}
                    onClick={() => {
                      setActiveItem(item.id);
                      item.onClick?.();
                    }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`relative flex cursor-pointer items-center gap-3 rounded-lg py-2 pl-3 text-sm transition-colors duration-200 ease-out ${
                      isLogout && showIndicator
                        ? "text-red-600"
                        : isActive
                          ? "text-foreground"
                          : isLogout
                            ? "text-muted-foreground hover:text-red-600"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {showIndicator && (
                      <motion.div
                        layoutId="adminDropdownIndicator"
                        className={`absolute inset-0 rounded-lg ${isLogout ? "bg-red-500/10 dark:bg-red-500/15" : "bg-muted"}`}
                        transition={{ type: "spring", damping: 30, stiffness: 520, mass: 0.8 }}
                      />
                    )}
                    {showIndicator && (
                      <motion.div
                        layoutId="adminDropdownLeftBar"
                        className={`absolute top-0 bottom-0 left-0 my-auto h-5 w-[3px] rounded-full ${isLogout ? "bg-red-500" : "bg-foreground"}`}
                        transition={{ type: "spring", damping: 30, stiffness: 520, mass: 0.8 }}
                      />
                    )}
                    <IconComponent className="relative z-10 h-[18px] w-[18px]" />
                    <span className="relative z-10 font-medium">{item.label}</span>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
