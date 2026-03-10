"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useUserComments } from "@/hooks/useUserDashboard";
import { format } from "date-fns";
import { MessageSquare, Trash2, ExternalLink } from "lucide-react";

import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusColors: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  REJECTED: "bg-red-100 text-red-700",
  SPAM: "bg-gray-100 text-gray-700",
};

export function CommentsView() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useUserComments(page, status);

  const handleDelete = async (commentId: string) => {
    await axios.delete(`/api/comments/${commentId}`);
    queryClient.invalidateQueries({ queryKey: ["user-comments"] });
  };

  if (isLoading) {
    return (
      <div className="bg-card/50 ring-border/40 space-y-4 rounded-2xl p-5 ring-1 backdrop-blur-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const comments = (data?.comments ?? []) as {
    id: string;
    content: string;
    status: string;
    createdAt: string;
    post?: { slug: string; title: string };
  }[];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="bg-card/50 ring-border/40 space-y-4 rounded-2xl p-5 ring-1 backdrop-blur-sm">
      <Tabs
        value={status}
        onValueChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {comments.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
          <MessageSquare className="mb-3 h-10 w-10" />
          <p>No comments yet</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Comment</TableHead>
                  <TableHead>Post</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate">
                        {comment.content?.length > 80
                          ? `${comment.content.slice(0, 80)}...`
                          : comment.content}
                      </p>
                    </TableCell>
                    <TableCell>
                      {comment.post ? (
                        <Link
                          href={`/${comment.post.slug}`}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <span className="max-w-[150px] truncate">{comment.post.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[comment.status] ?? ""}>
                        {comment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {format(new Date(comment.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(comment.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
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
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
