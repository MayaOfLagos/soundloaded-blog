"use client";

import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface PaystackButtonProps {
  type: "subscription" | "download";
  musicId?: string;
  price?: number | null;
  plan?: "monthly" | "yearly";
  label?: string;
  className?: string;
}

const formatNaira = (kobo: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);

export function PaystackButton({
  type,
  musicId,
  price,
  plan = "monthly",
  label,
  className,
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false);

  const defaultLabel =
    type === "download"
      ? `Buy for ${price ? formatNaira(price) : "₦100"}`
      : plan === "yearly"
        ? "Subscribe Yearly"
        : "Subscribe Monthly";

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, musicId, plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to continue");
          return;
        }
        throw new Error(data.error || "Payment failed");
      }

      window.location.href = data.authorization_url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50",
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
      {loading ? "Processing..." : label || defaultLabel}
    </button>
  );
}
