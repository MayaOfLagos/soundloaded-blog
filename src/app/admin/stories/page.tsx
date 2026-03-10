"use client";

import { useState } from "react";
import { Clapperboard, Clock, Eye, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { StoriesChart } from "@/components/admin/StoriesChart";
import { StoriesTable } from "@/components/admin/StoriesTable";
import { useAdminStories } from "@/hooks/useAdminStories";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function AdminStoriesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminStories(page);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, chartData, stories, pagination } = data;

  return (
    <div className="space-y-6 p-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Stories (24h)"
          value={stats.totalStories24h}
          icon={<Clapperboard className="text-brand h-5 w-5" />}
        />
        <StatsCard
          title="Active Stories"
          value={stats.activeStories}
          subtitle="Currently live"
          icon={<Clock className="text-brand h-5 w-5" />}
        />
        <StatsCard
          title="Total Views"
          value={stats.totalViews}
          icon={<Eye className="text-brand h-5 w-5" />}
        />
        <StatsCard
          title="Avg Views / Story"
          value={stats.avgViewsPerStory}
          icon={<TrendingUp className="text-brand h-5 w-5" />}
        />
      </div>

      {/* Chart */}
      <StoriesChart data={chartData} />

      {/* Table */}
      <div className="space-y-4">
        <h3 className="text-foreground text-sm font-bold">All Stories</h3>
        <StoriesTable stories={stories} />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
