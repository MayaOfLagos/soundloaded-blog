export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { MonetizationDashboardClient } from "./_components/MonetizationDashboardClient";

export const metadata: Metadata = { title: "Monetization — Soundloaded Admin" };

export default async function MonetizationPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalRevenue,
    monthlyRevenue,
    subscriptionCount,
    downloadRevenue,
    plans,
    recentTransactions,
    settings,
  ] = await Promise.all([
    // Total revenue all time
    db.transaction.aggregate({
      where: { status: "success" },
      _sum: { amount: true },
    }),
    // Revenue this month
    db.transaction.aggregate({
      where: { status: "success", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    // Active subscribers
    db.subscription.count({
      where: {
        status: "ACTIVE",
        currentPeriodEnd: { gt: now },
      },
    }),
    // Download transaction revenue
    db.transaction.aggregate({
      where: { status: "success", type: "download" },
      _sum: { amount: true },
    }),
    // Plans with subscriber counts
    db.plan.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            subscriptions: { where: { status: "ACTIVE", currentPeriodEnd: { gt: now } } },
          },
        },
      },
    }),
    // Recent transactions
    db.transaction.findMany({
      where: { status: "success" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        music: { select: { id: true, title: true } },
      },
    }),
    // Creator revenue split
    db.siteSettings.findUnique({
      where: { id: "default" },
      select: { creatorRevenuePercent: true, enableCreatorMonetization: true },
    }),
  ]);

  const totalKobo = totalRevenue._sum.amount ?? 0;
  const monthlyKobo = monthlyRevenue._sum.amount ?? 0;
  const downloadKobo = downloadRevenue._sum.amount ?? 0;
  const subscriptionKobo = totalKobo - downloadKobo;

  const creatorPercent = settings?.creatorRevenuePercent ?? 70;
  const platformPercent = 100 - creatorPercent;

  return (
    <MonetizationDashboardClient
      stats={{
        totalRevenue: totalKobo,
        monthlyRevenue: monthlyKobo,
        subscriptionRevenue: subscriptionKobo,
        downloadRevenue: downloadKobo,
        activeSubscribers: subscriptionCount,
        creatorPercent,
        platformPercent,
        creatorPayout: Math.round((totalKobo * creatorPercent) / 100),
        platformRevenue: Math.round((totalKobo * platformPercent) / 100),
      }}
      plans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        priceMonthly: p.priceMonthly,
        activeSubscribers: p._count.subscriptions,
      }))}
      recentTransactions={recentTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        createdAt: t.createdAt.toISOString(),
        user: t.user,
        music: t.music,
      }))}
      enableCreatorMonetization={settings?.enableCreatorMonetization ?? false}
    />
  );
}
