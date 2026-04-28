"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecommendationRefreshPanel() {
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function refreshAffinity() {
    setPending(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 25, windowDays: 30, eventLookbackDays: 30 }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Refresh failed");
        return;
      }

      setStatus(
        `Refreshed ${data.userCount ?? 0} users, ${data.snapshotCount ?? 0} affinity rows.`
      );
    } catch {
      setStatus("Refresh failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-foreground text-sm font-bold">Affinity Refresh</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Runs the same bounded job used by cron for the most recently active users.
        </p>
        {status && <p className="text-muted-foreground mt-2 text-xs">{status}</p>}
      </div>
      <Button onClick={refreshAffinity} disabled={pending} className="gap-2">
        <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        Refresh batch
      </Button>
    </div>
  );
}
