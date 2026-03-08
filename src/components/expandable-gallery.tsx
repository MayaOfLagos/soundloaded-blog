// @ts-nocheck
"use client";

import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import React, { useState, useId, useRef } from "react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

// Change Here
const PHOTOS = [
  {
    id: "photo-1",

    src: "https://images.unsplash.com/photo-1755398104393-746e52af4a9f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxleHBsb3JlLWZlZWR8Mzd8fHxlbnwwfHx8fHw%3D?q=80&w=800",
    alt: "Technology setup",
    rotation: -15,
    x: -90,
    y: 10,
    zIndex: 10,
  },
  {
    id: "photo-2",
    src: "https://images.unsplash.com/photo-1756764099214-b09a5666914b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxleHBsb3JlLWZlZWR8MTB8fHxlbnwwfHx8fHw%3D?q=80&w=800",
    alt: "Design research",
    rotation: -3,
    x: -10,
    y: -15,
    zIndex: 20,
  },
  {
    id: "photo-3",
    src: "https://images.unsplash.com/photo-1757372429884-92e02350c5d9?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxleHBsb3JlLWZlZWR8MjJ8fHxlbnwwfHx8fHw%3D?q=80&w=800",
    alt: "Code and development",
    rotation: 12,
    x: 75,
    y: 5,
    zIndex: 30,
  },
  {
    id: "photo-4",
    src: "https://images.unsplash.com/photo-1756993399574-2fa126269ce7?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxleHBsb3JlLWZlZWR8NzR8fHxlbnwwfHx8fHw%3D?q=80&w=800",
    alt: "Dashboard interface",
  },
  {
    id: "photo-5",
    src: "https://images.unsplash.com/photo-1756990637536-714b76296a30?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxleHBsb3JlLWZlZWR8ODJ8fHxlbnwwfHx8fHw%3D?q=80&w=800",
    alt: "Product design",
  },
  {
    id: "photo-6",
    src: "https://images.unsplash.com/photo-1756838197413-07f174def66c?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxleHBsb3JlLWZlZWR8MTA0fHx8ZW58MHx8fHx8?q=80&w=800",
    alt: "Laptop on desk",
  },
  {
    id: "photo-7",
    src: "https://images.unsplash.com/photo-1756310406492-3ce3bef447aa?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxleHBsb3JlLWZlZWR8MTQwfHx8ZW58MHx8fHx8?q=80&w=800",
    alt: "Team collaboration",
  },
  {
    id: "photo-8",
    src: "https://images.unsplash.com/photo-1755311905796-d539c7d24acd?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxleHBsb3JlLWZlZWR8MTgzfHx8ZW58MHx8fHx8?q=80&w=800",
    alt: "UX wireframes",
  },
  {
    id: "photo-9",
    src: "https://images.unsplash.com/photo-1755542366797-b3f036b11310?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxleHBsb3JlLWZlZWR8MTg2fHx8ZW58MHx8fHx8?q=80&w=800",
    alt: "Developer workspace",
  },
];

const transition = {
  type: "spring",
  stiffness: 160,
  damping: 18,
  mass: 1,
} as const;

export default function ExpandableGallery() {
  const [isExpanded, setIsExpanded] = useState(false);
  const layoutGroupId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useOutsideClick(containerRef, () => {
    if (isExpanded) {
      setIsExpanded(false);
    }
  });

  return (
    <section className="bg-background relative flex min-h-[850px] w-full flex-col items-center justify-start overflow-hidden px-4 md:px-8">
      <LayoutGroup id={layoutGroupId}>
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
          <div className="mb-2 flex h-12 w-full items-center justify-between px-4">
            <AnimatePresence>
              {isExpanded && (
                <motion.button
                  key="back-button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => setIsExpanded(false)}
                  className="text-muted-foreground hover:text-foreground group z-50 flex items-center gap-2 transition-all"
                >
                  <div className="bg-muted group-hover:bg-accent text-foreground rounded-full p-2 transition-colors">
                    <HugeiconsIcon icon={ArrowLeft01Icon} width={20} height={20} />
                  </div>
                  <span className="font-medium">Go back</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            ref={containerRef}
            layout
            className={cn(
              "relative w-full",
              isExpanded
                ? "grid grid-cols-2 gap-6 px-4 md:gap-8 lg:grid-cols-3"
                : "flex flex-col items-center justify-start pt-4"
            )}
            transition={transition}
          >
            <div
              className={cn(
                "relative",
                isExpanded ? "contents" : "mb-8 flex h-[450px] w-full items-center justify-center"
              )}
            >
              {PHOTOS.map((photo, index) => {
                const isPrimary = index < 3;
                if (!isPrimary && !isExpanded) return null;

                return (
                  <motion.div
                    key={`card-${photo.id}`}
                    layoutId={`card-container-${photo.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotate: !isExpanded ? photo.rotation || 0 : 0,
                      x: !isExpanded ? photo.x || 0 : 0,
                      y: !isExpanded ? photo.y || 0 : 0,
                      zIndex: !isExpanded ? photo.zIndex || index : 10,
                    }}
                    transition={transition}
                    whileHover={
                      !isExpanded
                        ? {
                            scale: 1.05,
                            y: (photo.y || 0) - 15,
                            rotate: (photo.rotation || 0) * 0.8,
                            zIndex: 50,
                            transition: {
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                            },
                          }
                        : { scale: 1.02 }
                    }
                    className={cn(
                      "bg-muted cursor-pointer overflow-hidden",
                      isExpanded
                        ? "border-background relative aspect-square rounded-[2rem] border-4 shadow-lg md:rounded-[3rem] md:border-[6px]"
                        : "border-background absolute h-44 w-44 rounded-[2.5rem] border-[6px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] md:h-60 md:w-60 md:rounded-[3rem]"
                    )}
                    onClick={() => !isExpanded && setIsExpanded(true)}
                  >
                    <motion.div
                      layoutId={`image-inner-${photo.id}`}
                      layout="position"
                      className="relative h-full w-full"
                      transition={transition}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        className="pointer-events-none object-cover select-none"
                        sizes={isExpanded ? "(max-width: 1024px) 50vw, 33vw" : "240px"}
                        priority={isPrimary}
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence>
              {!isExpanded && (
                <motion.div
                  key="stack-content"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-2xl space-y-8 text-center"
                >
                  <h2 className="text-foreground/90 text-2xl leading-tight font-normal tracking-tight md:text-4xl">
                    People don’t fall in love with components. <br className="hidden md:block" />
                    They fall in love with how something feels.
                  </h2>

                  <div className="flex justify-center">
                    <Button
                      variant="default"
                      onClick={() => setIsExpanded(true)}
                      className="border-border/40 group cursor-pointer rounded-full px-8 py-6 font-normal"
                    >
                      Explore more components
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        className="transition-transform group-hover:translate-x-1"
                        width={20}
                        height={20}
                      />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </LayoutGroup>
    </section>
  );
}
