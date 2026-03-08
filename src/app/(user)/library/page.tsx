import type { Metadata } from "next";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";
import { LibraryView } from "@/components/dashboard/LibraryView";

export const metadata: Metadata = { title: "Library — Soundloaded" };

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />
        <main className="min-w-0">
          <div className="mb-5">
            <h1 className="text-foreground text-2xl font-black">Library</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              All your saved content in one place
            </p>
          </div>
          <LibraryView />
        </main>
      </div>
    </div>
  );
}
