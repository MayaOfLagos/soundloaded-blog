"use client";

import { useEffect, useRef } from "react";
import axios from "axios";

/**
 * Facebook-style post view tracking.
 *
 * Fires a view event when:
 * - Regular posts/images: 50%+ visible for 1 second
 * - Video/Reels: 50%+ visible for 3 seconds
 *
 * Each post is tracked at most once per component lifecycle
 * (server-side deduplication handles cross-session uniqueness).
 */
export function usePostView(
  postId: string,
  containerRef: React.RefObject<HTMLElement | null>,
  options?: { isVideo?: boolean }
) {
  const hasFired = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || hasFired.current) return;

    // 1 second for regular posts, 3 seconds for video (Facebook's rule)
    const requiredDuration = options?.isVideo ? 3000 : 1000;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasFired.current) {
          // Start timer when post enters viewport (50%+)
          timerRef.current = setTimeout(() => {
            if (hasFired.current) return;
            hasFired.current = true;

            // Fire-and-forget view tracking
            axios.post("/api/posts/view", { postId }).catch(() => {});
          }, requiredDuration);
        } else {
          // Scrolled away before timer completed — cancel
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [postId, containerRef, options?.isVideo]);
}
