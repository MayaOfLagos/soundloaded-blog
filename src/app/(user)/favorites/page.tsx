import type { Metadata } from "next";
import { FavoritesView } from "@/components/dashboard/FavoritesView";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";

export const metadata: Metadata = { title: "Favorites — Soundloaded" };

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />
        <main className="min-w-0">
          <div className="mb-5">
            <h1 className="text-foreground text-2xl font-black">Favorites</h1>
            <p className="text-muted-foreground mt-1 text-sm">Content you love</p>
          </div>
          <FavoritesView />
        </main>
      </div>
    </div>
  );
}
