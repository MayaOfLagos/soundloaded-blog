import type { Metadata } from "next";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";
import { BillingView } from "@/components/dashboard/BillingView";

export const metadata: Metadata = { title: "Billing — Soundloaded" };

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />
        <main className="min-w-0">
          <div className="mb-5">
            <h1 className="text-foreground text-2xl font-black">Billing</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage your subscription and payments
            </p>
          </div>
          <BillingView />
        </main>
      </div>
    </div>
  );
}
