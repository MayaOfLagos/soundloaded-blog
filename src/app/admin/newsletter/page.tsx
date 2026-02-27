"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Download, Mail, Users, UserCheck, UserX, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

type SubscriberStatus = "PENDING" | "CONFIRMED" | "UNSUBSCRIBED";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: SubscriberStatus;
  confirmedAt: string | null;
  createdAt: string;
}

interface NewsletterStats {
  confirmed: number;
  pending: number;
  unsubscribed: number;
  total: number;
}

const STATUS_CONFIG: Record<SubscriberStatus, { label: string; className: string }> = {
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-green-500/15 text-green-600 border-green-500/20",
  },
  PENDING: { label: "Pending", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  UNSUBSCRIBED: {
    label: "Unsubscribed",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<NewsletterStats>({
    confirmed: 0,
    pending: 0,
    unsubscribed: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  async function loadSubscribers() {
    setIsLoading(true);
    try {
      const res = await axios.get<{ subscribers: Subscriber[]; stats: NewsletterStats }>(
        "/api/admin/newsletter"
      );
      setSubscribers(res.data.subscribers ?? []);
      setStats(res.data.stats ?? { confirmed: 0, pending: 0, unsubscribed: 0, total: 0 });
    } catch {
      toast.error("Failed to load subscribers");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSubscribers();
  }, []);

  function exportCSV() {
    const filtered =
      statusFilter === "ALL" ? subscribers : subscribers.filter((s) => s.status === statusFilter);

    const headers = ["Email", "Name", "Status", "Confirmed At", "Subscribed"];
    const rows = filtered.map((s) => [
      s.email,
      s.name ?? "",
      s.status,
      s.confirmedAt ? formatDate(s.confirmedAt) : "",
      formatDate(s.createdAt),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soundloaded-subscribers-${statusFilter.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  }

  const filteredSubscribers =
    statusFilter === "ALL" ? subscribers : subscribers.filter((s) => s.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black">Newsletter</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {stats.total.toLocaleString()} total subscriber{stats.total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadSubscribers} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="gap-1.5"
            disabled={filteredSubscribers.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <div className="mb-1 flex items-center gap-2">
            <Users className="text-muted-foreground h-4 w-4" />
            <p className="text-muted-foreground text-sm">Total</p>
          </div>
          <p className="text-foreground text-2xl font-black">{stats.total.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="mb-1 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-600">Confirmed</p>
          </div>
          <p className="text-foreground text-2xl font-black">{stats.confirmed.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Mail className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-600">Pending</p>
          </div>
          <p className="text-foreground text-2xl font-black">{stats.pending.toLocaleString()}</p>
        </div>
        <div className="border-border bg-muted/30 rounded-xl border p-4">
          <div className="mb-1 flex items-center gap-2">
            <UserX className="text-muted-foreground h-4 w-4" />
            <p className="text-muted-foreground text-sm">Unsubscribed</p>
          </div>
          <p className="text-foreground text-2xl font-black">
            {stats.unsubscribed.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1">
        {["ALL", "CONFIRMED", "PENDING", "UNSUBSCRIBED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-brand text-brand-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            {s === "ALL" && <span className="ml-1.5 text-xs opacity-70">({stats.total})</span>}
            {s === "CONFIRMED" && (
              <span className="ml-1.5 text-xs opacity-70">({stats.confirmed})</span>
            )}
            {s === "PENDING" && (
              <span className="ml-1.5 text-xs opacity-70">({stats.pending})</span>
            )}
            {s === "UNSUBSCRIBED" && (
              <span className="ml-1.5 text-xs opacity-70">({stats.unsubscribed})</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mail className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No subscribers found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confirmed</TableHead>
                <TableHead>Subscribed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscribers.map((sub) => (
                <TableRow key={sub.id} className="border-border">
                  <TableCell>
                    <span className="text-foreground text-sm font-medium">{sub.email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">{sub.name ?? "—"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase ${STATUS_CONFIG[sub.status].className}`}
                    >
                      {STATUS_CONFIG[sub.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {sub.confirmedAt ? formatDate(sub.confirmedAt) : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {formatDate(sub.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Export note */}
      <p className="text-muted-foreground text-xs">
        CSV export includes {filteredSubscribers.length.toLocaleString()} subscriber
        {filteredSubscribers.length !== 1 ? "s" : ""}. Use Resend audience sync for campaign
        targeting.
      </p>
    </div>
  );
}
