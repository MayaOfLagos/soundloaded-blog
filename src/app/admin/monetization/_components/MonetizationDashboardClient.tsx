"use client";

import {
  TrendingUp,
  Users,
  Download,
  Music2,
  CreditCard,
  ArrowUpRight,
  Wallet,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface Stats {
  totalRevenue: number;
  monthlyRevenue: number;
  subscriptionRevenue: number;
  downloadRevenue: number;
  activeSubscribers: number;
  creatorPercent: number;
  platformPercent: number;
  creatorPayout: number;
  platformRevenue: number;
}

interface PlanStat {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  activeSubscribers: number;
}

interface RecentTx {
  id: string;
  type: string;
  amount: number;
  createdAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
  music: { id: string; title: string } | null;
}

interface Props {
  stats: Stats;
  plans: PlanStat[];
  recentTransactions: RecentTx[];
  enableCreatorMonetization: boolean;
}

function koboToNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export function MonetizationDashboardClient({
  stats,
  plans,
  recentTransactions,
  enableCreatorMonetization,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
            <CreditCard className="text-brand h-5 w-5" />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-black">Monetization</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Revenue overview &amp; subscription analytics
            </p>
          </div>
        </div>
        <Link
          href="/admin/settings?tab=billing"
          className="text-brand hover:text-brand/80 flex items-center gap-1 text-sm font-medium transition-colors"
        >
          Billing Settings
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Total Revenue
                </p>
                <p className="text-foreground mt-1 text-2xl font-black">
                  {koboToNaira(stats.totalRevenue)}
                </p>
              </div>
              <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <TrendingUp className="text-brand h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  This Month
                </p>
                <p className="text-foreground mt-1 text-2xl font-black">
                  {koboToNaira(stats.monthlyRevenue)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Active Subscribers
                </p>
                <p className="text-foreground mt-1 text-2xl font-black">
                  {stats.activeSubscribers.toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Download Revenue
                </p>
                <p className="text-foreground mt-1 text-2xl font-black">
                  {koboToNaira(stats.downloadRevenue)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Download className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Revenue Split ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Revenue Split</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                <Wallet className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Creator payouts ({stats.creatorPercent}%)
                  </span>
                  <span className="text-foreground font-bold">
                    {koboToNaira(stats.creatorPayout)}
                  </span>
                </div>
                <div className="bg-muted mt-1.5 h-2 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-purple-500"
                    style={{ width: `${stats.creatorPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-brand/10 flex h-9 w-9 items-center justify-center rounded-lg">
                <Building2 className="text-brand h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Platform revenue ({stats.platformPercent}%)
                  </span>
                  <span className="text-foreground font-bold">
                    {koboToNaira(stats.platformRevenue)}
                  </span>
                </div>
                <div className="bg-muted mt-1.5 h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-brand h-full rounded-full"
                    style={{ width: `${stats.platformPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {!enableCreatorMonetization && (
              <p className="text-muted-foreground rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
                Creator monetization is currently disabled. Enable it in Billing Settings.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Plan breakdown ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Plan Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No plans seeded yet. Run{" "}
                <code className="bg-muted rounded px-1 text-xs">node scripts/seed-plans.mjs</code>
              </p>
            ) : (
              <div className="divide-y">
                {plans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-foreground text-sm font-medium">{plan.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {plan.priceMonthly === 0 ? "Free" : `${koboToNaira(plan.priceMonthly)}/mo`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-foreground text-sm font-bold">{plan.activeSubscribers}</p>
                      <p className="text-muted-foreground text-xs">subscribers</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Transactions ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentTransactions.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">No transactions yet</p>
          ) : (
            <div className="divide-y">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-6 py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={tx.user.image ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {(tx.user.name ?? tx.user.email)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">
                      {tx.user.name ?? tx.user.email}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {tx.music ? `Download: ${tx.music.title}` : "Subscription"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-foreground text-sm font-bold">{koboToNaira(tx.amount)}</p>
                    <Badge
                      variant={tx.type === "subscription" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {tx.type === "subscription" ? (
                        <>
                          <CreditCard className="mr-1 h-2.5 w-2.5" />
                          Sub
                        </>
                      ) : (
                        <>
                          <Music2 className="mr-1 h-2.5 w-2.5" />
                          Download
                        </>
                      )}
                    </Badge>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {new Date(tx.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
