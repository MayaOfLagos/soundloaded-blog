export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Activity, Database, Gauge, ListChecks, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecommendationOpsSnapshot } from "@/lib/recommendation";
import { RecommendationRefreshPanel } from "./_components/RecommendationRefreshPanel";

export const metadata: Metadata = { title: "Recommendations - Soundloaded Admin" };

export default async function AdminRecommendationsPage() {
  const snapshot = await getRecommendationOpsSnapshot();

  const statCards = [
    {
      title: "Events 24h",
      value: snapshot.totals.events24h,
      subtitle: `${snapshot.totals.events7d.toLocaleString()} in 7 days`,
      icon: Activity,
    },
    {
      title: "Impressions 24h",
      value: snapshot.totals.impressions24h,
      subtitle: `${snapshot.totals.impressions7d.toLocaleString()} in 7 days`,
      icon: Gauge,
    },
    {
      title: "Affinity Users",
      value: snapshot.totals.affinityUsers,
      subtitle: `${snapshot.totals.affinitySnapshots.toLocaleString()} rows`,
      icon: Database,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-black">
            <Sparkles className="text-brand h-6 w-6" />
            Recommendations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ranking health, rollout controls, and affinity snapshot operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={snapshot.config.engineVersion === "v1" ? "default" : "secondary"}>
            {snapshot.config.engineVersion}
          </Badge>
          <Badge variant={snapshot.config.cacheEnabled ? "outline" : "secondary"}>
            cache {snapshot.config.cacheEnabled ? "on" : "off"}
          </Badge>
          <Badge variant={snapshot.config.impressionsEnabled ? "outline" : "secondary"}>
            impressions {snapshot.config.impressionsEnabled ? "on" : "off"}
          </Badge>
        </div>
      </div>

      <RecommendationRefreshPanel />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="flex items-start justify-between gap-3 p-5">
              <div>
                <p className="text-muted-foreground text-sm">{card.title}</p>
                <p className="text-foreground mt-1 text-2xl font-black">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">{card.subtitle}</p>
              </div>
              <div className="bg-brand/10 text-brand flex h-10 w-10 items-center justify-center rounded-lg">
                <card.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <MetricList title="Surfaces" items={snapshot.surfaces} />
        <MetricList title="Reason Keys" items={snapshot.reasonKeys} />
        <MetricList title="Candidate Sources" items={snapshot.candidateSources} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="text-muted-foreground h-4 w-4" />
            Latest Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.latestEvents.length === 0 ? (
            <p className="text-muted-foreground py-4 text-sm">No events recorded yet.</p>
          ) : (
            <div className="divide-border divide-y">
              {snapshot.latestEvents.map((event) => (
                <div key={event.id} className="grid gap-2 py-3 text-sm md:grid-cols-[1fr,1fr,auto]">
                  <div>
                    <p className="text-foreground font-medium">{event.eventName}</p>
                    <p className="text-muted-foreground text-xs">
                      {event.entityType}
                      {event.entityId ? `:${event.entityId}` : ""}
                    </p>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    <p>{event.surface}</p>
                    <p>{event.candidateSource || event.reasonKey || "no recommendation context"}</p>
                  </div>
                  <time className="text-muted-foreground text-xs">
                    {event.occurredAt.toLocaleString("en-NG")}
                  </time>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricList({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string | null; count: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.key ?? "unknown"} className="flex items-center justify-between gap-3">
                <span className="text-foreground truncate text-sm font-medium">
                  {item.key ?? "unknown"}
                </span>
                <Badge variant="secondary">{item.count.toLocaleString()}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
