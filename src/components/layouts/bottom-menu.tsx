"use client";

import {
  Notification03Icon,
  Search01Icon,
  Sun03Icon,
  Moon02Icon,
  ComputerIcon,
  UserEdit01Icon,
  PlusSignIcon,
  Mic01Icon,
  Camera01Icon,
  PencilEdit02Icon,
  FilterHorizontalIcon,
  AutoConversationsIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React, { useMemo, useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import useMeasure from "react-use-measure";
import { cn } from "@/lib/utils";

// Change Here
const MAIN_NAV = [
  { icon: PlusSignIcon, name: "home" },
  { icon: Search01Icon, name: "search" },
  { icon: Notification03Icon, name: "notifications" },
  { icon: UserEdit01Icon, name: "profile" },
  { icon: Sun03Icon, name: "theme" },
];

const HOME_ITEMS = [
  { icon: PencilEdit02Icon, text: "Note" },
  { icon: Mic01Icon, text: "Voice" },
  { icon: Camera01Icon, text: "Screenshot" },
];

const SEARCH_OPTIONS = [
  { icon: FilterHorizontalIcon, text: "Filter" },
  { icon: AutoConversationsIcon, text: "Trending" },
];

const NOTIFICATION_TYPES = ["Messages", "System Alerts"];

const PROFILE_LINKS = ["My Account", "Settings", "Subscription / Billing"];

const THEME_OPTIONS = [
  { key: "light", icon: Sun03Icon, text: "Light" },
  { key: "dark", icon: Moon02Icon, text: "Dark" },
  { key: "system", icon: ComputerIcon, text: "System" },
];

const BottomMenu = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [elementRef] = useMeasure();
  const [hiddenRef, hiddenBounds] = useMeasure();
  const [view, setView] = useState<
    "default" | "home" | "search" | "notifications" | "profile" | "theme"
  >("default");

  // Track selected theme
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setView("default");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sharedHover =
    "group transition-all duration-75 px-3 py-2 text-[15px] text-muted-foreground w-full text-left rounded-[12px] hover:bg-muted/80 hover:text-foreground";

  const content = useMemo(() => {
    switch (view) {
      case "default":
        return null;

      case "home":
        return (
          <div className="min-w-[210px] space-y-0.5 p-[6px] py-0.5">
            {HOME_ITEMS.map(({ icon: Icon, text }) => (
              <button key={text} className={`${sharedHover} flex items-center gap-3`}>
                <HugeiconsIcon
                  icon={Icon}
                  size={20}
                  className="text-muted-foreground group-hover:text-foreground transition-all duration-75"
                />
                <span className="transition-all duration-75">{text}</span>
              </button>
            ))}
          </div>
        );

      case "search":
        return (
          <div className="min-w-[270px] space-y-2 p-[8px] py-1">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={17}
                className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
              />
              <input
                type="text"
                placeholder="Search..."
                className="text-foreground bg-muted/80 border-border focus:ring-ring placeholder:text-muted-foreground/50 w-full rounded-[12px] border py-[6px] pr-3 pl-9 text-[14.5px] focus:border-transparent focus:ring-2 focus:outline-none"
              />
            </div>
            <div className="flex gap-1.5">
              {SEARCH_OPTIONS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  className={`${sharedHover} bg-muted hover:bg-accent flex flex-1 items-center justify-center gap-1.5`}
                >
                  <HugeiconsIcon
                    icon={Icon}
                    size={14}
                    strokeWidth={2}
                    className="text-muted-foreground group-hover:text-foreground transition-all duration-75"
                  />
                  <span className="transition-all duration-75">{text}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="min-w-[210px] space-y-0.5 p-[6px] py-0.5">
            {NOTIFICATION_TYPES.map((t) => (
              <button key={t} className={sharedHover}>
                <span className="transition-all duration-75">{t}</span>
              </button>
            ))}
          </div>
        );

      case "profile":
        return (
          <div className="min-w-[230px] space-y-0.5 p-[6px] py-0.5">
            {PROFILE_LINKS.map((t) => (
              <button key={t} className={sharedHover}>
                <span className="transition-all duration-75">{t}</span>
              </button>
            ))}
            <div className="border-border my-[2px] border-t" />
            <button className="text-destructive hover:bg-destructive/10 w-full rounded-[12px] px-3 py-2 text-left text-[15px] transition-all duration-75">
              Logout
            </button>
          </div>
        );

      case "theme":
        return (
          <div className="flex min-w-[270px] items-center justify-between gap-1.5 p-[6px] py-0.5">
            {THEME_OPTIONS.map(({ key, icon: Icon, text }) => (
              <button
                key={key}
                onClick={() => setTheme(key as "light" | "dark" | "system")}
                className={`flex items-center justify-center gap-2 rounded-[12px] px-3 py-2 transition-all duration-100 ${
                  theme === key
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <HugeiconsIcon
                  icon={Icon}
                  size={18}
                  className={`transition-all duration-75 ${
                    theme === key ? "text-foreground" : "text-muted-foreground"
                  }`}
                />
                <span>{text}</span>
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  }, [view, theme]);

  return (
    <div ref={containerRef} className={cn("relative flex flex-col items-center")}>
      {/* Hidden for measurement */}
      <div
        ref={hiddenRef}
        className="pointer-events-none invisible absolute top-[-9999px] left-[-9999px]"
      >
        <div className="bg-background/95 border-border rounded-[18px] border py-1">{content}</div>
      </div>

      {/* Animated submenu */}
      <AnimatePresence mode="wait">
        {view !== "default" && (
          <motion.div
            key="submenu"
            initial={{
              opacity: 0,
              scaleY: 0.9,
              scaleX: 0.95,
              height: 0,
              width: 0,
              originY: 1,
              originX: 0.5,
            }}
            animate={{
              opacity: 1,
              scaleY: 1,
              scaleX: 1,
              height: hiddenBounds.height || "auto",
              width: hiddenBounds.width || "auto",
              originY: 1,
              originX: 0.5,
            }}
            exit={{
              opacity: 0,
              scaleY: 0.9,
              scaleX: 0.95,
              height: 0,
              width: 0,
              originY: 1,
              originX: 0.5,
            }}
            transition={{
              duration: 0.3,
              ease: [0.45, 0, 0.25, 1],
            }}
            style={{
              transformOrigin: "bottom center",
            }}
            className="absolute bottom-[70px] overflow-hidden"
          >
            <div
              ref={elementRef}
              className="bg-background/95 border-border rounded-[18px] border backdrop-blur-xl"
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={view}
                  initial={{
                    opacity: 0,
                    scale: 0.96,
                    filter: "blur(10px)",
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    filter: "blur(12px)",
                  }}
                  transition={{
                    duration: 0.25,
                    ease: [0.42, 0, 0.58, 1],
                  }}
                  className="py-1"
                >
                  {content}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="bg-background/95 border-border z-10 mt-3 flex items-center gap-1 rounded-[18px] border p-1 backdrop-blur-xl">
        {MAIN_NAV.map(({ icon: Icon, name }) => (
          <button
            key={name}
            className={`rounded-[16px] p-3 transition-all ${
              view === name ? "bg-accent" : "hover:bg-muted"
            }`}
            onClick={() => setView(view === name ? "default" : (name as any))}
          >
            <HugeiconsIcon
              icon={Icon}
              size={22}
              className={`transition-all ${
                view === name ? "text-foreground" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomMenu;
