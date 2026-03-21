"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Search, Music, Building2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ApplicationReviewDialog } from "./ApplicationReviewDialog";

type Application = {
  id: string;
  type: "ARTIST" | "LABEL";
  status: "PENDING" | "APPROVED" | "REJECTED";
  displayName: string;
  slug: string;
  bio: string | null;
  genre: string | null;
  country: string | null;
  photo: string | null;
  socialLinks: Record<string, string> | null;
  proofUrls: string[] | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
  };
  reviewedBy: { id: string; name: string | null } | null;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  APPROVED: "bg-green-500/10 text-green-600 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
};

export function CreatorsTable({
  applications,
  total,
  page,
  totalPages,
  currentStatus,
  currentQuery,
  counts,
}: {
  applications: Application[];
  total: number;
  page: number;
  totalPages: number;
  currentStatus?: string;
  currentQuery?: string;
  counts: { pending: number; approved: number; rejected: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentQuery ?? "");
  const [reviewApp, setReviewApp] = useState<Application | null>(null);

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // Reset to page 1
    router.push(`/admin/creators?${params.toString()}`);
  }

  const tabs = [
    { label: "All", value: undefined, count: counts.pending + counts.approved + counts.rejected },
    { label: "Pending", value: "PENDING", count: counts.pending },
    { label: "Approved", value: "APPROVED", count: counts.approved },
    { label: "Rejected", value: "REJECTED", count: counts.rejected },
  ];

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => updateParams({ status: tab.value })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              currentStatus === tab.value || (!currentStatus && !tab.value)
                ? "bg-brand text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateParams({ q: search || undefined });
          }}
          placeholder="Search by name or email..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card/50 ring-border/40 overflow-hidden rounded-xl ring-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border/40 border-b">
              <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                Applicant
              </th>
              <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                Type
              </th>
              <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                Display Name
              </th>
              <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                Status
              </th>
              <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                Submitted
              </th>
              <th className="text-muted-foreground px-4 py-3 text-right text-xs font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-border/40 divide-y">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {app.user.image ? (
                      <Image
                        src={app.user.image}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
                        {app.user.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </div>
                    )}
                    <div>
                      <p className="text-foreground text-sm font-medium">{app.user.name ?? "—"}</p>
                      <p className="text-muted-foreground text-xs">{app.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    {app.type === "ARTIST" ? (
                      <Music className="h-3 w-3" />
                    ) : (
                      <Building2 className="h-3 w-3" />
                    )}
                    {app.type}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="text-foreground font-medium">{app.displayName}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={STATUS_STYLES[app.status]}>
                    {app.status}
                  </Badge>
                </td>
                <td className="text-muted-foreground px-4 py-3 text-xs">
                  {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setReviewApp(app)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Review
                  </Button>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted-foreground py-12 text-center text-sm">
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground text-xs">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(page - 1));
                router.push(`/admin/creators?${params.toString()}`);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(page + 1));
                router.push(`/admin/creators?${params.toString()}`);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Review Dialog */}
      {reviewApp && (
        <ApplicationReviewDialog
          application={reviewApp}
          open={!!reviewApp}
          onClose={() => setReviewApp(null)}
        />
      )}
    </div>
  );
}
