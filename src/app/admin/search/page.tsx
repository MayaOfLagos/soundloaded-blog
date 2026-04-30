export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, Clock, Search } from "lucide-react";
import { getSearchDemandSnapshot } from "@/lib/admin-search";
import { getSessionRole, isAdmin } from "@/lib/admin-auth";
import { getSearchHealth } from "@/lib/meilisearch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchReindexButton } from "./_components/SearchReindexButton";

export const metadata: Metadata = { title: "Search Ops - Soundloaded Admin" };

export default async function AdminSearchOpsPage() {
  const [sessionRole, health, demand] = await Promise.all([
    getSessionRole(),
    getSearchHealth(),
    getSearchDemandSnapshot(),
  ]);
  const canReindex = isAdmin(sessionRole?.role ?? "");
  const statusLabel = !health.configured
    ? "Not configured"
    : health.reachable
      ? "Online"
      : "Unreachable";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black">Search Ops</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Index health, search demand, and reindex controls.
          </p>
        </div>
        <SearchReindexButton disabled={!canReindex || !health.configured} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              Engine
            </CardTitle>
            <CardDescription>Current Meilisearch connection state.</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge
              variant="outline"
              className={
                health.reachable
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-destructive/30 bg-destructive/5 text-destructive"
              }
            >
              {statusLabel}
            </Badge>
            {health.error && <p className="text-muted-foreground mt-3 text-sm">{health.error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Last Reindex
            </CardTitle>
            <CardDescription>Runtime marker for this server process.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground text-2xl font-black">
              {health.lastReindexAt
                ? new Date(health.lastReindexAt).toLocaleString("en-NG")
                : "No recent run"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4" />
              Searches
            </CardTitle>
            <CardDescription>Tracked searches in the last {demand.windowDays} days.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground text-2xl font-black">
              {demand.totalSearches.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Indexes</CardTitle>
          <CardDescription>Document counts by searchable surface.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {health.indexes.map((index) => (
              <div key={index.uid} className="border-border rounded-lg border px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-foreground text-sm font-bold">{index.uid}</p>
                  {index.exists ? (
                    <CheckCircle2 className="text-success h-4 w-4" />
                  ) : (
                    <AlertTriangle className="text-destructive h-4 w-4" />
                  )}
                </div>
                <p className="text-muted-foreground mt-2 text-xs">Documents</p>
                <p className="text-foreground text-xl font-black">
                  {index.documentCount?.toLocaleString() ?? "Missing"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DemandList title="Top Searches" items={demand.topQueries} empty="No searches tracked yet." />
        <DemandList
          title="Zero-result Searches"
          items={demand.zeroResultQueries}
          empty="No zero-result searches in this window."
        />
        <DemandList
          title="Fastest Rising"
          items={demand.fastestRisingQueries}
          empty="No rising search patterns yet."
          showGrowth
        />
      </div>
    </div>
  );
}

function DemandList({
  title,
  items,
  empty,
  showGrowth = false,
}: {
  title: string;
  items: Array<{ query: string; count: number; growth?: number }>;
  empty: string;
  showGrowth?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">{empty}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.query}
                className="border-border flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <p className="text-foreground min-w-0 truncate text-sm font-medium">{item.query}</p>
                <Badge variant="outline">
                  {showGrowth ? `+${item.growth ?? 0}` : item.count.toLocaleString()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
