"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const DEFAULT_TITLES = [
  "Latest Stories",
  "Latest Music",
  "Trending News",
  "Trending Highlife",
  "Hot Gist",
  "Fresh Amapiano",
  "Latest Afrobeats",
  "Trending Naija",
];

const INTERVAL = 3500;

interface MorphingTitleProps {
  titles?: string[];
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4";
}

export function MorphingTitle({
  titles = DEFAULT_TITLES,
  className,
  as: Tag = "h2",
}: MorphingTitleProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (titles.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % titles.length);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [titles]);

  const text = titles[index];

  return (
    <Tag className={cn("text-foreground text-lg font-extrabold tracking-tight", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={text} className="inline-flex overflow-hidden">
          {text.split("").map((letter, i) => (
            <motion.span
              key={`${text}-${i}`}
              initial={{
                opacity: 0,
                rotateX: "80deg",
                y: 8,
                filter: "blur(3px)",
              }}
              animate={{
                opacity: 1,
                rotateX: "0deg",
                y: 0,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                rotateX: "-80deg",
                y: -8,
                filter: "blur(3px)",
              }}
              transition={{
                delay: 0.015 * i,
                type: "spring",
                damping: 16,
                stiffness: 240,
                mass: 1.2,
              }}
              style={{ willChange: "transform" }}
              className="inline-block"
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </Tag>
  );
}
