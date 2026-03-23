"use client";

import { useState } from "react";
import Image from "next/image";

interface PostImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  category?: string;
  author?: string;
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
}: PostImageProps) {
  const [errored, setErrored] = useState(false);

  const showFallback = !src || errored;

  if (showFallback) {
    return (
      <Image
        src={buildFallbackUrl(alt, category, author)}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={className}
        unoptimized
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}
