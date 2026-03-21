"use client";

import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface StoryRow {
  id: string;
  author: { id: string; name: string | null; image: string | null };
  type: string;
  itemCount: number;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
  status: "active" | "expired";
}

function formatStoryDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StoriesTable({ stories }: { stories: StoryRow[] }) {
  if (stories.length === 0) {
    return (
      <div className="border-border bg-card rounded-xl border p-10 text-center">
        <p className="text-muted-foreground text-sm">No stories found</p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Author</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-center">Items</TableHead>
            <TableHead className="text-center">Views</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stories.map((story) => (
            <TableRow key={story.id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  {story.author.image ? (
                    <Image
                      src={story.author.image}
                      alt={story.author.name ?? ""}
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="bg-muted flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold">
                      {story.author.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <span className="text-foreground text-sm font-medium">
                    {story.author.name ?? "User"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs capitalize">
                  {story.type.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-center text-sm">{story.itemCount}</TableCell>
              <TableCell className="text-center text-sm">{story.viewCount}</TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {formatStoryDate(story.createdAt)}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {formatStoryDate(story.expiresAt)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={story.status === "active" ? "default" : "secondary"}
                  className={
                    story.status === "active"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {story.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
