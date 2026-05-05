export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Tags } from "lucide-react";
import { db } from "@/lib/db";
import { GenreManager } from "./_components/GenreManager";

export const metadata: Metadata = { title: "Genre Management — Soundloaded Admin" };

async function getGenresWithCounts() {
  const rows = await db.music.groupBy({
    by: ["genre"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  return rows.map((r) => ({ name: r.genre ?? null, count: r._count.id }));
}

export default async function GenresPage() {
  const genres = await getGenresWithCounts();
  const named = genres.filter((g) => g.name !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Genre Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Rename, merge, or remove genres across all tracks.{" "}
            <span className="text-foreground font-medium">{named.length}</span> distinct genre
            {named.length !== 1 ? "s" : ""} found.
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
          <Tags className="h-5 w-5 text-purple-600" />
        </div>
      </div>

      <GenreManager initialGenres={genres} />
    </div>
  );
}
