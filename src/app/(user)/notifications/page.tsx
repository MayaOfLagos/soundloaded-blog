import type { Metadata } from "next";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";
import { NotificationsView } from "@/components/dashboard/NotificationsView";

export const metadata: Metadata = {
  title: "Notifications — Soundloaded",
};

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />
        <main className="min-w-0">
          <div className="mb-5">
            <h1 className="text-foreground text-2xl font-black">Notifications</h1>
            <p className="text-muted-foreground mt-1 text-sm">Stay up to date</p>
          </div>
          <NotificationsView />
        </main>
      </div>
    </div>
  );
}
