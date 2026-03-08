// @ts-nocheck
"use client";

import { motion, LayoutGroup, AnimatePresence, type Transition } from "motion/react";
import {
  Playlist01Icon,
  GridViewIcon,
  Layers01Icon,
  StarIcon,
  Ticket01Icon,
  Camera01Icon,
  BrushIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

interface CollectionItem {
  id: string;
  title: string;
  subtitle: string;
  idNumber: string;
  image: string;
  icon: any;
}

// Change Here
const ITEMS: CollectionItem[] = [
  {
    id: "1",
    title: "Cinematic Horizons",
    subtitle: "Photography",
    idNumber: "209",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&h=400&auto=format&fit=crop",
    icon: Camera01Icon,
  },
  {
    id: "2",
    title: "Abstract Dreams",
    subtitle: "Digital Art",
    idNumber: "808",
    image:
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=400&h=400&auto=format&fit=crop",
    icon: BrushIcon,
  },
];
type ViewMode = "list" | "card" | "pack";

const snappySpring: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 30,
  mass: 1,
};

const fastFade: Transition = {
  duration: 0.1,
  ease: "linear",
};

export default function LayoutSwitcher() {
  const [view, setView] = useState<ViewMode>("list");
  return (
    <div className="selection:bg-primary/10 mx-auto w-full max-w-xl p-4 font-sans md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-5">
          <h2 className="text-foreground text-xl font-medium">My Collection</h2>

          <div className="bg-muted border-border flex w-fit rounded-full border p-1">
            <Tab
              active={view === "list"}
              onClick={() => setView("list")}
              icon={Playlist01Icon}
              label="List view"
            />
            <Tab
              active={view === "card"}
              onClick={() => setView("card")}
              icon={GridViewIcon}
              label="Card view"
            />
            <Tab
              active={view === "pack"}
              onClick={() => setView("pack")}
              icon={Layers01Icon}
              label="Pack view"
            />
          </div>
        </div>
        <div className="bg-border h-px w-full" />
        {/* Content Section */}
        <div className="relative flex min-h-[350px] flex-col items-center">
          <LayoutGroup>
            <motion.div
              layout
              transition={snappySpring}
              className={cn(
                "relative w-full",
                view === "list" && "flex flex-col gap-4",
                view === "card" && "grid grid-cols-2 gap-4",
                view === "pack" && "mt-8 flex h-64 items-center justify-center"
              )}
            >
              {ITEMS.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  transition={snappySpring}
                  className={cn(
                    "relative z-10 flex items-center",
                    view === "list" && "w-full flex-row gap-4",
                    view === "card" && "w-full flex-col items-start gap-3",
                    view === "pack" && "absolute h-56 w-56 items-center justify-center"
                  )}
                  style={{
                    zIndex: view === "pack" ? ITEMS.length - index : 1,
                  }}
                  animate={
                    view === "pack"
                      ? {
                          rotate: index === 0 ? -12 : 6,
                          x: index === 0 ? -25 : 25,
                          y: index === 0 ? -5 : 5,
                        }
                      : {
                          rotate: 0,
                          x: 0,
                          y: 0,
                        }
                  }
                >
                  <motion.div
                    layout
                    transition={snappySpring}
                    className={cn(
                      "bg-background relative shrink-0 overflow-hidden",
                      view === "list" && "border-border/50 h-16 w-16 rounded-2xl border",
                      view === "card" &&
                        "border-border/50 aspect-square w-full rounded-[1.8rem] border shadow-sm",
                      view === "pack" &&
                        "border-border/50 h-full w-full rounded-[2rem] border shadow-xl"
                    )}
                  >
                    <motion.img
                      layout
                      transition={snappySpring}
                      src={item.image}
                      alt={item.title}
                      className={cn(
                        "m-0! block h-full w-full object-cover p-0!",
                        view === "list" && "rounded-2xl",
                        view === "card" && "rounded-[1.8rem]",
                        view === "pack" && "rounded-[2rem]"
                      )}
                    />
                  </motion.div>

                  <AnimatePresence mode="popLayout" initial={false}>
                    {view !== "pack" && (
                      <motion.div
                        key={`${item.id}-info`}
                        layout
                        initial={{
                          opacity: 0,
                          scale: 0.9,
                          filter: "blur(4px)",
                        }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                        transition={fastFade}
                        className={cn(
                          "flex min-w-0 flex-1 items-center justify-between",
                          view === "card" ? "w-full px-1" : "px-0"
                        )}
                      >
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <motion.h3
                            layout
                            className="text-foreground truncate text-[15px] leading-tight font-medium"
                          >
                            {item.title}
                          </motion.h3>
                          <motion.div
                            layout
                            className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium"
                          >
                            <HugeiconsIcon icon={item.icon} size={12} className="text-primary/70" />
                            <span className="truncate">{item.subtitle}</span>
                          </motion.div>
                        </div>

                        <motion.div
                          layout
                          className="bg-primary/5 text-primary ml-2 flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                        >
                          <HugeiconsIcon
                            icon={StarIcon}
                            size={10}
                            className="fill-yellow-500 text-yellow-500"
                          />
                          <span>#{item.idNumber}</span>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {view === "list" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-border/40 absolute right-0 -bottom-2 left-18 h-px"
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>

            <AnimatePresence>
              {view === "pack" && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 5, filter: "blur(5px)" }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="relative z-0 mt-16 space-y-3 px-4 text-center"
                >
                  <div className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
                    <HugeiconsIcon icon={Ticket01Icon} size={12} />
                    <span>Bundle unlocked</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-normal uppercase transition-all outline-none",
        active
          ? "text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      {active && (
        <motion.div
          layoutId="active-tab"
          className="bg-primary absolute inset-0 rounded-full shadow-md"
          transition={snappySpring}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        <HugeiconsIcon
          icon={icon}
          size={16}
          className={cn("transition-transform duration-300", active && "scale-110")}
        />
        {label}
      </span>
    </button>
  );
}
