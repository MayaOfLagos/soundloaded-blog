import Image from "next/image";
import { cn } from "@/lib/utils";

interface FallbackCoverProps {
  /** Outer wrapper className — pass the same sizing/layout classes the container needs */
  className?: string;
  /** Size of the favicon image inside. Defaults to "md" */
  size?: "xs" | "sm" | "md" | "lg";
}

const sizeMap = {
  xs: 16,
  sm: 24,
  md: 36,
  lg: 48,
};

export function FallbackCover({ className, size = "md" }: FallbackCoverProps) {
  const px = sizeMap[size];
  return (
    <div
      className={cn(
        "from-brand/10 to-muted flex h-full w-full items-center justify-center bg-linear-to-br",
        className
      )}
    >
      <Image
        src="/icons/icon-192x192.png"
        alt=""
        width={px}
        height={px}
        className="opacity-30"
        aria-hidden
      />
    </div>
  );
}
