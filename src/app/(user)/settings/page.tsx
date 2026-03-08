import type { Metadata } from "next";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";
import { UnifiedSettingsForm } from "@/components/dashboard/UnifiedSettingsForm";

export const metadata: Metadata = {
  title: "Settings — Soundloaded",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />
        <main className="min-w-0">
          <div className="mb-5">
            <h1 className="text-foreground text-2xl font-black">Settings</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage your account and preferences
            </p>
          </div>
          <UnifiedSettingsForm />
        </main>
      </div>
    </div>
  );
}
