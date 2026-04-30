"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchReindexButton({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleReindex() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Search reindex failed");
      }

      setMessage("Search reindex queued successfully.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search reindex failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button type="button" onClick={handleReindex} disabled={disabled || loading}>
        <RefreshCw className={loading ? "animate-spin" : ""} />
        {loading ? "Reindexing" : "Reindex all"}
      </Button>
      {message && <p className="text-muted-foreground text-xs">{message}</p>}
    </div>
  );
}
