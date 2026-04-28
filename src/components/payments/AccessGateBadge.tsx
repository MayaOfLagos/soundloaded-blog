import { Crown, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const formatNaira = (kobo: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);

interface AccessGateBadgeProps {
  accessModel: string; // "free" | "subscription" | "purchase" | "both"
  streamAccess?: string; // "free" | "subscription"
  creatorPrice?: number | null;
  /** Size variant */
  size?: "xs" | "sm";
  className?: string;
}

/**
 * Shows a premium badge on any surface where a track has restricted access.
 * - subscription / streamAccess=subscription → gold crown "Subscribers Only"
 * - purchase / both → shopping cart "Buy ₦X"
 * - free → nothing rendered
 */
export function AccessGateBadge({
  accessModel,
  streamAccess = "free",
  creatorPrice,
  size = "sm",
  className,
}: AccessGateBadgeProps) {
  const isStreamGated = streamAccess === "subscription";
  const isSubOnly = accessModel === "subscription" || (accessModel === "free" && isStreamGated);
  const isPurchase = accessModel === "purchase" || accessModel === "both";

  if (!isSubOnly && !isPurchase) return null;

  const base = cn(
    "inline-flex items-center gap-1 rounded-full font-semibold leading-none",
    size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]",
    className
  );

  if (isSubOnly) {
    return (
      <Link
        href="/billing"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          base,
          "bg-amber-500/15 text-amber-500 transition-colors hover:bg-amber-500/25"
        )}
      >
        <Crown className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
        Subscribers Only
      </Link>
    );
  }

  // purchase or both
  const label = creatorPrice ? `Buy ${formatNaira(creatorPrice)}` : "Buy Track";
  return (
    <Link
      href="/billing"
      onClick={(e) => e.stopPropagation()}
      className={cn(base, "bg-brand/15 text-brand hover:bg-brand/25 transition-colors")}
    >
      <ShoppingCart className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {label}
    </Link>
  );
}
