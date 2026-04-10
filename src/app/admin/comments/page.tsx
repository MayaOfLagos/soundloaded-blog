"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/admin-api";
import { MessageSquare, Loader2, Check, X, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

type CommentStatus = "PENDING" | "APPROVED" | "REJECTED" | "SPAM";

interface Comment {
  id: string;
  body: string;
  status: CommentStatus;
  createdAt: string;
  post: { title: string; slug: string };
  author: { name: string | null; email: string } | null;
  guestName: string | null;
  guestEmail: string | null;
}

const STATUS_CONFIG: Record<CommentStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  APPROVED: { label: "Approved", className: "bg-green-500/15 text-green-600 border-green-500/20" },
  REJECTED: { label: "Rejected", className: "bg-red-500/15 text-red-600 border-red-500/20" },
  SPAM: { label: "Spam", className: "bg-muted text-muted-foreground border-border" },
};

const TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SPAM", label: "Spam" },
  { value: "ALL", label: "All" },
];

export default function CommentsPage() {
  const [activeTab, setActiveTab] = useState("PENDING");
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadComments = useCallback(async (status: string) => {
    setIsLoading(true);
    try {
      const params = status !== "ALL" ? `?status=${status}` : "";
      const res = await adminApi.get<{ comments: Comment[]; total: number }>(
        `/api/admin/comments${params}`
      );
      setComments(res.data.comments ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComments(activeTab);
  }, [activeTab, loadComments]);

  async function updateStatus(commentId: string, newStatus: CommentStatus) {
    setActionLoading(commentId);
    try {
      await adminApi.patch("/api/admin/comments", { id: commentId, status: newStatus });
      toast.success(`Comment ${newStatus.toLowerCase()}`);
      await loadComments(activeTab);
    } catch {
      toast.error("Failed to update comment");
    } finally {
      setActionLoading(null);
    }
  }

  async function bulkAction(action: CommentStatus) {
    const pendingIds = comments.filter((c) => c.status === "PENDING").map((c) => c.id);
    if (pendingIds.length === 0) return;
    if (
      !confirm(
        `${action === "APPROVED" ? "Approve" : "Mark as spam"} all ${pendingIds.length} pending comments?`
      )
    )
      return;
    setIsLoading(true);
    try {
      await Promise.all(
        pendingIds.map((id) => adminApi.patch("/api/admin/comments", { id, status: action }))
      );
      toast.success(`${pendingIds.length} comments updated`);
      await loadComments(activeTab);
    } catch {
      toast.error("Bulk action failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black">Comments</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {total.toLocaleString()} comment{total !== 1 ? "s" : ""}
            {activeTab !== "ALL" ? ` ${activeTab.toLowerCase()}` : " total"}
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "PENDING" && comments.length > 0 && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-green-500/30 text-green-600 hover:bg-green-500/10"
                onClick={() => bulkAction("APPROVED")}
              >
                <Check className="h-3.5 w-3.5" /> Approve All
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-muted-foreground gap-1.5"
                onClick={() => bulkAction("SPAM")}
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Spam All
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => loadComments(activeTab)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="border-border bg-card overflow-hidden rounded-xl border">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">
              No {activeTab !== "ALL" ? activeTab.toLowerCase() : ""} comments
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[35%]">Comment</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-36 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((comment) => (
                <TableRow key={comment.id} className="border-border">
                  <TableCell>
                    <p className="text-foreground line-clamp-3 text-sm">{comment.body}</p>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`/${comment.post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-brand line-clamp-2 text-sm transition-colors"
                    >
                      {comment.post.title}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-foreground text-sm font-medium">
                        {comment.author?.name ?? comment.guestName ?? "Anonymous"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {comment.author?.email ?? comment.guestEmail ?? "—"}
                      </p>
                      {!comment.author && comment.guestName && (
                        <span className="text-muted-foreground text-[10px]">Guest</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase ${STATUS_CONFIG[comment.status].className}`}
                    >
                      {STATUS_CONFIG[comment.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {formatDate(comment.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {comment.status !== "APPROVED" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600 hover:bg-green-500/10 hover:text-green-600"
                          onClick={() => updateStatus(comment.id, "APPROVED")}
                          disabled={actionLoading === comment.id}
                          title="Approve"
                        >
                          {actionLoading === comment.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                      {comment.status !== "REJECTED" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                          onClick={() => updateStatus(comment.id, "REJECTED")}
                          disabled={actionLoading === comment.id}
                          title="Reject"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {comment.status !== "SPAM" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-muted-foreground h-8 w-8"
                          onClick={() => updateStatus(comment.id, "SPAM")}
                          disabled={actionLoading === comment.id}
                          title="Mark as spam"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
