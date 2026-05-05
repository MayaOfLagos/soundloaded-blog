"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PostImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  category?: string;
  author?: string;
  /** Admin-configured fallback used instead of /api/og when src is missing */
  fallbackSrc?: string | null;
}

function buildFallbackUrl(title: string, category?: string, author?: string) {
  const params = new URLSearchParams({ title });
  if (category) params.set("category", category);
  if (author) params.set("author", author);
  return `/api/og?${params}`;
}

export function PostImage({
  src,
  alt,
  fill,
  sizes,
  priority,
  className,
  category,
  author,
  fallbackSrc,
}: PostImageProps) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const resolvedFallback = fallbackSrc ?? buildFallbackUrl(alt, category, author);
  const imgSrc = !src || errored ? resolvedFallback : src;
  const unopt = !src || errored;

  return (
    <>
      <Image
        src={imgSrc}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        unoptimized={unopt}
        className={cn(
          className,
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setErrored(true);
          setLoaded(false);
        }}
      />
      {!loaded && <span className="absolute inset-0 animate-pulse bg-zinc-800" aria-hidden />}
    </>
  );
}
