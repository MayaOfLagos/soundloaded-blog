export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";
import { LabelProfileEditor } from "./LabelProfileEditor";

export const metadata: Metadata = {
  title: "Label Profile — Soundloaded",
};

export default async function LabelProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const label = await db.label.findUnique({
    where: { ownerId: userId },
  });

  if (!label) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />

        <main className="min-w-0 space-y-6">
          <div>
            <h1 className="text-foreground text-2xl font-black">Label Profile</h1>
            <p className="text-muted-foreground text-sm">Manage your public label profile</p>
          </div>

          <LabelProfileEditor label={JSON.parse(JSON.stringify(label))} />
        </main>
      </div>
    </div>
  );
}
