export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";
import { FanlinkForm } from "@/components/fanlink/FanlinkForm";

export const metadata: Metadata = {
  title: "New Fanlink — Soundloaded",
};

export default async function NewFanlinkPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const artist = await db.artist.findUnique({
    where: { ownerId: userId },
    select: { id: true, name: true },
  });
  if (!artist) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />
        <main className="min-w-0 space-y-6">
          <div>
            <h1 className="text-foreground text-2xl font-black">Create Fanlink</h1>
            <p className="text-muted-foreground text-sm">
              One smart URL — all your streaming platforms
            </p>
          </div>
          <FanlinkForm artistName={artist.name} mode="create" />
        </main>
      </div>
    </div>
  );
}
