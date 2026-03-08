// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import useMeasure from "react-use-measure";
import {
  UserIcon,
  CreditCardIcon,
  FolderIcon,
  File01Icon,
  SettingsIcon,
  HelpCircleIcon,
  LogoutIcon,
  MoreHorizontalCircle01Icon,
} from "@hugeicons/core-free-icons";

// Change Here
const menuItems = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "upgrade", label: "Upgrade", icon: CreditCardIcon },
  { id: "projects", label: "Projects", icon: FolderIcon },
  { id: "documentation", label: "Documentation", icon: File01Icon },
  { id: "divider", label: "", icon: null },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "help", label: "Get Help", icon: HelpCircleIcon },
  { id: "logout", label: "Logout", icon: LogoutIcon },
];

const easeOutQuint: [number, number, number, number] = [0.23, 1, 0.32, 1];

export default function TwentyTwelveOne() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("profile");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [contentRef, contentBounds] = useMeasure();

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

  const openHeight = Math.max(40, Math.ceil(contentBounds.height));
  return (
    <div ref={containerRef} className="not-prose relative h-10 w-10">
      <motion.div
        layout
        initial={false}
        animate={{
          width: isOpen ? 220 : 40,
          height: isOpen ? openHeight : 40,
          borderRadius: isOpen ? 14 : 12,
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
        <motion.div
          initial={false}
          animate={{
            opacity: isOpen ? 0 : 1,
            scale: isOpen ? 0.8 : 1,
          }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            pointerEvents: isOpen ? "none" : "auto",
            willChange: "transform",
          }}
        >
          <HugeiconsIcon
            icon={MoreHorizontalCircle01Icon}
            className="text-muted-foreground h-6 w-6"
          />
        </motion.div>

        {/* Menu Content - visible when open */}
        <div ref={contentRef}>
          <motion.div
            layout
            initial={false}
            animate={{
              opacity: isOpen ? 1 : 0,
            }}
            transition={{
              duration: 0.2,
              delay: isOpen ? 0.08 : 0,
            }}
            className="p-2"
            style={{
              pointerEvents: isOpen ? "auto" : "none",
              willChange: "transform",
            }}
          >
            <ul className="m-0! flex list-none! flex-col gap-0.5 p-0!">
              {menuItems.map((item, index) => {
                if (item.id === "divider") {
                  return (
                    <motion.hr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isOpen ? 1 : 0 }}
                      transition={{ delay: isOpen ? 0.12 + index * 0.015 : 0 }}
                      className="border-border my-1.5!"
                    />
                  );
                }

                const iconRef = item.icon!;
                const isActive = activeItem === item.id;
                const isLogout = item.id === "logout";
                const showIndicator = hoveredItem ? hoveredItem === item.id : isActive;

                const itemDuration = item.id === "logout" ? 0.12 : 0.15;
                const itemDelay = isOpen ? 0.06 + index * 0.02 : 0;

                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{
                      opacity: isOpen ? 1 : 0,
                      x: isOpen ? 0 : 8,
                    }}
                    transition={{
                      delay: itemDelay,
                      duration: itemDuration,
                      ease: easeOutQuint,
                    }}
                    onClick={() => {
                      setActiveItem(item.id);
                      if (item.id === "logout") {
                        setIsOpen(false);
                      }
                    }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`relative m-0! flex cursor-pointer items-center gap-3 rounded-lg py-2! pl-3! text-sm transition-colors duration-200 ease-out ${
                      isLogout && showIndicator
                        ? "text-red-600"
                        : isActive
                          ? "text-foreground"
                          : isLogout
                            ? "text-muted-foreground hover:text-red-600"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {/* Hover/Active background indicator */}
                    {showIndicator && (
                      <motion.div
                        layoutId="activeIndicator"
                        className={`absolute inset-0 rounded-lg ${
                          isLogout ? "bg-red-50" : "bg-muted"
                        }`}
                        transition={{
                          type: "spring",
                          damping: 30,
                          stiffness: 520,
                          mass: 0.8,
                        }}
                      />
                    )}
                    {/* Left bar indicator */}
                    {showIndicator && (
                      <motion.div
                        layoutId="leftBar"
                        className={`absolute top-0 bottom-0 left-0 my-auto h-5 w-[3px] rounded-full ${
                          isLogout ? "bg-red-500" : "bg-foreground"
                        }`}
                        transition={{
                          type: "spring",
                          damping: 30,
                          stiffness: 520,
                          mass: 0.8,
                        }}
                      />
                    )}
                    <HugeiconsIcon icon={iconRef} className="relative z-10 h-[18px] w-[18px]" />
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
