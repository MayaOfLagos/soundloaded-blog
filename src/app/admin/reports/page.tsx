"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { format } from "date-fns";
import {
  Flag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

type ReportStatus = "PENDING" | "REVIEWED" | "DISMISSED" | "ACTION_TAKEN";

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; name: string | null; email: string | null };
  post: { id: string; title: string; slug: string };
}

const STATUS_TABS: { value: ReportStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "DISMISSED", label: "Dismissed" },
  { value: "ACTION_TAKEN", label: "Action Taken" },
];

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; icon: typeof Flag }> = {
  PENDING: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
    icon: AlertTriangle,
  },
  REVIEWED: {
    label: "Reviewed",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    icon: CheckCircle2,
  },
  DISMISSED: {
    label: "Dismissed",
    color: "bg-zinc-500/10 text-zinc-500 border-zinc-200",
    icon: XCircle,
  },
  ACTION_TAKEN: {
    label: "Action Taken",
    color: "bg-green-500/10 text-green-600 border-green-200",
    icon: Shield,
  },
};

const REASON_LABELS: Record<string, string> = {
  spam: "Spam or misleading",
  harassment: "Harassment or bullying",
  misinformation: "False information",
  hate_speech: "Hate speech",
  violence: "Violence or threats",
  other: "Other",
};

function useAdminReports(page: number, status?: ReportStatus) {
  return useQuery({
    queryKey: ["admin-reports", page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set("status", status);
      const { data } = await adminApi.get(`/api/admin/reports?${params}`);
      return data as { reports: Report[]; total: number; page: number; totalPages: number };
    },
  });
}

function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reportId,
      status,
      adminNote,
    }: {
      reportId: string;
      status: ReportStatus;
      adminNote?: string;
    }) => {
      const { data } = await adminApi.patch("/api/admin/reports", { reportId, status, adminNote });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });
}

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const reportsQuery = useAdminReports(page, statusFilter === "ALL" ? undefined : statusFilter);
  const updateReport = useUpdateReport();

  const reports = reportsQuery.data?.reports ?? [];
  const totalPages = reportsQuery.data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-black">Reports</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Review and manage user-submitted reports.
        </p>
      </div>

      <div className="scrollbar-hide flex gap-1 overflow-x-auto">
        {STATUS_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              setStatusFilter(value);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              statusFilter === value
                ? "bg-brand text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {reportsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Flag className="text-muted-foreground mb-3 h-10 w-10" />
          <p className="text-lg font-semibold">No reports found</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {statusFilter === "ALL"
              ? "No reports have been filed yet."
              : `No ${statusFilter.toLowerCase().replace("_", " ")} reports.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {reports.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                isExpanded={expandedReport === report.id}
                onToggle={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                onUpdateStatus={(status, adminNote) =>
                  updateReport.mutate({ reportId: report.id, status, adminNote })
                }
                isUpdating={updateReport.isPending}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function ReportRow({
  report,
  isExpanded,
  onToggle,
  onUpdateStatus,
  isUpdating,
}: {
  report: Report;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (status: ReportStatus, adminNote?: string) => void;
  isUpdating: boolean;
}) {
  const [adminNote, setAdminNote] = useState(report.adminNote ?? "");
  const statusConfig = STATUS_CONFIG[report.status];
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card/50 ring-border/40 overflow-hidden rounded-xl ring-1 backdrop-blur-sm"
    >
      <button
        onClick={onToggle}
        className="hover:bg-muted/30 flex w-full items-center gap-3 p-4 text-left transition-colors"
      >
        <StatusIcon className={cn("h-5 w-5 flex-shrink-0", statusConfig.color.split(" ")[1])} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-foreground truncate text-sm font-semibold">
              {report.post.title}
            </span>
            <Badge className={cn("shrink-0 text-xs", statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
          <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
            <span>By {report.user.name ?? report.user.email ?? "Unknown"}</span>
            <span>&middot;</span>
            <span>{REASON_LABELS[report.reason] ?? report.reason}</span>
            <span>&middot;</span>
            <span>{format(new Date(report.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-muted-foreground h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronDown className="text-muted-foreground h-4 w-4 flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-border/40 space-y-4 border-t px-4 pt-4 pb-4">
              {report.details && (
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                    Details from reporter
                  </p>
                  <p className="text-foreground text-sm">{report.details}</p>
                </div>
              )}
              <a
                href={`/${report.post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-brand/80 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View reported post
              </a>
              <div>
                <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
                  Admin note
                </p>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add an internal note about this report..."
                  className="min-h-[80px] resize-none text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {report.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => onUpdateStatus("REVIEWED", adminNote || undefined)}
                    >
                      {isUpdating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark Reviewed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => onUpdateStatus("DISMISSED", adminNote || undefined)}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" /> Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isUpdating}
                      onClick={() => onUpdateStatus("ACTION_TAKEN", adminNote || undefined)}
                    >
                      <Shield className="mr-1.5 h-3.5 w-3.5" /> Take Action
                    </Button>
                  </>
                )}
                {report.status !== "PENDING" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUpdating}
                    onClick={() => onUpdateStatus(report.status, adminNote || undefined)}
                  >
                    {isUpdating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Update
                    Note
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
