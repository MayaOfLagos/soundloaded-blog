"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CoverImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

/**
 * next/image wrapper that shows an animated skeleton while the image loads.
 * Use inside any container that is `position: relative` with a defined size.
 */
export function CoverImage({ src, alt, fill, sizes, className, priority }: CoverImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        className={cn(
          className,
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        priority={priority}
        onLoad={() => setLoaded(true)}
      />
      {!loaded && <span className="absolute inset-0 animate-pulse bg-zinc-800" aria-hidden />}
    </>
  );
}
