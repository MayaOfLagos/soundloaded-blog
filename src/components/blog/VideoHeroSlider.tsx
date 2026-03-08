"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import type { PostCardData } from "./PostCard";

interface VideoHeroSliderProps {
  posts: PostCardData[];
  interval?: number;
}

const SLIDE_DURATION = 6000;

export function VideoHeroSlider({ posts, interval = SLIDE_DURATION }: VideoHeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
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

  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = setInterval(next, interval);
    return () => clearInterval(timerRef.current);
  }, [next, interval, total]);

  const pause = () => clearInterval(timerRef.current);
  const resume = () => {
    if (total <= 1) return;
    timerRef.current = setInterval(next, interval);
  };

  if (!posts.length) return null;

  const post = posts[current];

  /* Cinematic zoom-fade animation — feels like video transitions */
  const variants = {
    enter: (d: number) => ({
      scale: 1.1,
      opacity: 0,
      x: d > 0 ? "8%" : "-8%",
    }),
    center: {
      scale: 1,
      opacity: 1,
      x: 0,
    },
    exit: (d: number) => ({
      scale: 0.95,
      opacity: 0,
      x: d > 0 ? "-8%" : "8%",
    }),
  };

  return (
    <div
      className="group/slider relative overflow-hidden rounded-3xl bg-black"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {/* Slides — 16:9 video aspect ratio */}
      <div className="relative aspect-video">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0"
          >
            <Link href={post.href || `/${post.slug}`} className="block h-full w-full">
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
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
                  <Play className="h-16 w-16 text-white/20" />
                </div>
              )}

              {/* Cinematic gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

              {/* Top bar: Video badge + views */}
              <div className="absolute top-4 right-4 left-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase shadow-lg">
                  <Play className="h-3 w-3 fill-current" />
                  Video
                </span>
                {post.viewCount !== undefined && post.viewCount > 0 && (
                  <span className="flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm">
                    <Eye className="h-3 w-3" />
                    {post.viewCount.toLocaleString()} views
                  </span>
                )}
              </div>

              {/* Center play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-md transition-all duration-300 group-hover/slider:scale-110 group-hover/slider:border-white/50 group-hover/slider:bg-white/20 sm:h-20 sm:w-20">
                  <Play className="h-7 w-7 fill-current text-white sm:h-8 sm:w-8" />
                </div>
              </div>

              {/* Bottom content */}
              <div className="absolute right-0 bottom-0 left-0 p-5 sm:p-7">
                {post.category && (
                  <span className="bg-brand/80 mb-3 inline-block rounded-full px-3 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
                    {post.category.name}
                  </span>
                )}
                <h2 className="line-clamp-2 text-xl leading-tight font-extrabold text-white drop-shadow-lg sm:text-2xl lg:text-3xl">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-2 hidden text-sm text-white/60 sm:block">
                    {post.excerpt}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-3">
                  {post.author && (
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white backdrop-blur-sm">
                        {post.author.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-white/70">{post.author.name}</span>
                    </div>
                  )}
                  <time className="ml-auto text-[11px] text-white/50">
                    {formatRelativeDate(post.publishedAt)}
                  </time>
                </div>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              prev();
            }}
            className="absolute top-1/2 left-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/70 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover/slider:opacity-100 hover:bg-black/60 hover:text-white"
            aria-label="Previous video"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              next();
            }}
            className="absolute top-1/2 right-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/70 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover/slider:opacity-100 hover:bg-black/60 hover:text-white"
            aria-label="Next video"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Progress bar indicators (YouTube-style) */}
      {total > 1 && (
        <div className="absolute right-0 bottom-0 left-0 z-10 flex gap-1 px-4 pb-1.5">
          {posts.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                goTo(i);
              }}
              className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/20 transition-colors hover:bg-white/30"
              aria-label={`Go to video ${i + 1}`}
            >
              {i === current && (
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-red-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: interval / 1000, ease: "linear" }}
                  key={`progress-${current}`}
                />
              )}
              {i < current && <div className="absolute inset-0 rounded-full bg-white/50" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
