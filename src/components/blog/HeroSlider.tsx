"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { PostCardData } from "./PostCard";

interface HeroSliderProps {
  posts: PostCardData[];
  /** Auto-slide interval in ms (default 6000) */
  interval?: number;
}

const SLIDE_DURATION = 6000;

export function HeroSlider({ posts, interval = SLIDE_DURATION }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const total = posts.length;

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-play
  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = setInterval(next, interval);
    return () => clearInterval(timerRef.current);
  }, [next, interval, total]);

  // Pause on hover
  const pause = () => clearInterval(timerRef.current);
  const resume = () => {
    if (total <= 1) return;
    timerRef.current = setInterval(next, interval);
  };

  if (!posts.length) return null;

  const post = posts[current];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div
      className="group/slider relative overflow-hidden rounded-3xl"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {/* Slides */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0"
          >
            <Link href={post.href || `/${post.slug}`} className="block h-full w-full">
              {/* Image */}
              {post.coverImage ? (
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 70vw"
                  priority={current === 0}
                />
              ) : (
                <div className="from-brand/30 via-background to-muted flex h-full items-center justify-center bg-gradient-to-br">
                  <span className="text-6xl opacity-50">🎵</span>
                </div>
              )}

              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

              {/* Category pill — desktop only */}
              {post.category && (
                <div className="absolute top-4 left-4 hidden sm:block">
                  <span className="bg-brand shadow-brand/30 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase shadow-lg">
                    {post.category.name}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="absolute right-0 bottom-0 left-0 p-5 sm:p-7">
                <h2 className="line-clamp-3 text-xl leading-tight font-extrabold text-white drop-shadow-lg sm:text-2xl lg:text-3xl">
                  {post.title}
                </h2>
                <div className="mt-4 flex items-center gap-3">
                  {/* Author */}
                  {post.author && (
                    <div className="hidden items-center gap-2 sm:flex">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white backdrop-blur-sm">
                        {post.author.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-white/80">{post.author.name}</span>
                    </div>
                  )}

                  {/* Mobile: date left, views right */}
                  <div className="flex w-full items-center justify-between text-[11px] text-white/60 sm:ml-auto sm:w-auto sm:justify-end sm:gap-3">
                    <time>{formatRelativeDate(post.publishedAt)}</time>
                    <div className="flex items-center gap-3">
                      {post.readingTime && (
                        <span className="hidden items-center gap-1 sm:flex">
                          <Clock className="h-3 w-3" />
                          {post.readingTime}m
                        </span>
                      )}
                      {post.viewCount !== undefined && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.viewCount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows — visible on hover */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              prev();
            }}
            className="absolute top-1/2 left-3 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white/80 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover/slider:opacity-100 hover:bg-black/50 hover:text-white"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              next();
            }}
            className="absolute top-1/2 right-3 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white/80 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover/slider:opacity-100 hover:bg-black/50 hover:text-white"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
          {posts.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                goTo(i);
              }}
              className={cn(
                "relative h-2 rounded-full transition-all duration-500 ease-out",
                i === current ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Go to slide ${i + 1}`}
            >
              {/* Progress bar on active dot */}
              {i === current && (
                <motion.div
                  className="bg-brand absolute inset-y-0 left-0 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: interval / 1000, ease: "linear" }}
                  key={`progress-${current}`}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
