"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollShelfProps {
  title: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
}

export function ScrollShelf({ title, href, children, className }: ScrollShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateScrollState]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  return (
    <section className={cn("group/shelf relative", className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-foreground text-xl font-bold tracking-tight">{title}</h2>
        {href && (
          <Link
            href={href}
            className="text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
          >
            Show all
          </Link>
        )}
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Edge fade gradients */}
        {canScrollLeft && (
          <div className="from-background pointer-events-none absolute top-0 left-0 z-10 h-full w-12 bg-gradient-to-r to-transparent" />
        )}
        {canScrollRight && (
          <div className="from-background pointer-events-none absolute top-0 right-0 z-10 h-full w-12 bg-gradient-to-l to-transparent" />
        )}

        {/* Left arrow — hidden on touch devices via CSS */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="bg-card/90 border-border text-foreground absolute top-1/2 -left-2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 group-hover/shelf:opacity-100 hover:scale-110 hover:shadow-xl pointer-coarse:hidden"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right arrow — hidden on touch devices via CSS */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="bg-card/90 border-border text-foreground absolute top-1/2 -right-2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 group-hover/shelf:opacity-100 hover:scale-110 hover:shadow-xl pointer-coarse:hidden"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="scrollbar-hide flex snap-x snap-proximity gap-4 overflow-x-auto scroll-smooth pb-2"
        >
          {children}
        </div>
      </div>
    </section>
  );
}

/** Wrapper for individual shelf items to enforce consistent sizing + snap */
export function ShelfItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-[150px] min-w-[150px] flex-shrink-0 snap-start sm:w-[180px] sm:min-w-[180px] lg:w-[200px] lg:min-w-[200px]",
        className
      )}
    >
      {children}
    </div>
  );
}
