"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserTransactions } from "@/hooks/useUserDashboard";
import { format } from "date-fns";
import {
  CreditCard,
  Crown,
  Zap,
  Music2,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// ── Types ─────────────────────────────────────────────────────────────
interface Plan {
  id: string;
  slug: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  downloadQuota: number;
  features: string[];
  paystackPlanCodeMonthly: string | null;
  paystackPlanCodeYearly: string | null;
}

interface Props {
  plans: Plan[];
  paystackPublicKey: string;
}

// ── Helpers ───────────────────────────────────────────────────────────
const transactionStatusColors: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED: "bg-red-100 text-red-700",
};

function koboToNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function planIcon(slug: string) {
  if (slug === "free") return <Music2 className="h-5 w-5" />;
  if (slug === "standard") return <Zap className="h-5 w-5" />;
  return <Crown className="h-5 w-5" />;
}

function planGradient(slug: string) {
  if (slug === "free") return "from-slate-500/10 to-slate-600/5";
  if (slug === "standard") return "from-brand/10 to-brand/5";
  return "from-amber-500/10 to-amber-600/5";
}

function planAccent(slug: string) {
  if (slug === "free") return "text-slate-400";
  if (slug === "standard") return "text-brand";
  return "text-amber-400";
}

function planBorder(slug: string, isActive: boolean) {
  if (isActive) return "border-brand ring-2 ring-brand/30";
  if (slug === "pro") return "border-amber-500/40";
  return "border-border";
}

// ── Component ─────────────────────────────────────────────────────────
export function BillingView({ plans, paystackPublicKey: _paystackPublicKey }: Props) {
  const [yearly, setYearly] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(1);

  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: txData, isLoading: txLoading } = useUserTransactions(txPage);

  const transactions = (txData?.transactions ?? []) as {
    id: string;
    createdAt: string;
    type: string;
    description?: string;
    amount: number;
    status: string;
  }[];
  const totalPages = txData?.totalPages ?? 1;

  const activeSubscription =
    subscription?.hasSubscription &&
    subscription.expiresAt &&
    new Date(subscription.expiresAt) > new Date()
      ? subscription
      : null;

  const activePlanSlug = activeSubscription
    ? (subscription?.plan?.toLowerCase() ?? "standard")
    : "free";

  async function handleSubscribe(plan: Plan) {
    if (plan.slug === "free") return;

    const price = yearly ? plan.priceYearly : plan.priceMonthly;
    if (!price) {
      toast.error("This plan is not available for the selected billing period");
      return;
    }

    setLoadingPlanId(plan.id);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscription",
          planId: plan.id,
          interval: yearly ? "yearly" : "monthly",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment initialization failed");

      window.location.href = data.authorization_url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoadingPlanId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Active Subscription Banner ── */}
      {!subLoading && activeSubscription && (
        <div className="bg-brand/5 border-brand/20 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-brand h-5 w-5" />
              <div>
                <p className="text-foreground text-sm font-semibold">
                  You&apos;re on the{" "}
                  <span className="text-brand">{subscription?.plan ?? "Premium"}</span> plan
                </p>
                {subscription?.expiresAt && (
                  <p className="text-muted-foreground text-xs">
                    Renews{" "}
                    {new Date(subscription.expiresAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
            <Badge className="bg-green-500/15 text-green-400">Active</Badge>
          </div>
        </div>
      )}

      {/* ── Plans Section ── */}
      <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
        <div className="px-5 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-foreground flex items-center gap-2 text-base font-bold">
                <Crown className="h-5 w-5" />
                Subscription Plans
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Choose the plan that works for you
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label
                htmlFor="billing-toggle"
                className={cn(
                  "cursor-pointer text-sm font-medium transition-colors",
                  !yearly ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Monthly
              </Label>
              <Switch id="billing-toggle" checked={yearly} onCheckedChange={setYearly} />
              <Label
                htmlFor="billing-toggle"
                className={cn(
                  "cursor-pointer text-sm font-medium transition-colors",
                  yearly ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Yearly
                <Badge variant="secondary" className="ml-2 bg-green-500/10 text-xs text-green-400">
                  Save 20%
                </Badge>
              </Label>
            </div>
          </div>
        </div>

        <div className="p-5">
          {plans.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center text-sm">
              No plans available yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const price = yearly ? plan.priceYearly : plan.priceMonthly;
                const monthlyEquivalent = yearly && plan.priceYearly ? plan.priceYearly / 12 : null;
                const isCurrentPlan = activePlanSlug === plan.slug;
                const isPro = plan.slug === "pro";

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col rounded-2xl border bg-gradient-to-b p-5 transition-all",
                      planGradient(plan.slug),
                      planBorder(plan.slug, isCurrentPlan),
                      isPro && "shadow-lg shadow-amber-500/10"
                    )}
                  >
                    {isPro && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-amber-500 text-black shadow-lg">
                          <Star className="mr-1 h-3 w-3 fill-current" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="mb-5">
                      <div
                        className={cn(
                          "mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5",
                          planAccent(plan.slug)
                        )}
                      >
                        {planIcon(plan.slug)}
                      </div>
                      <h3 className="text-foreground text-lg font-bold">{plan.name}</h3>
                      <div className="mt-2">
                        {price === 0 ? (
                          <div className="text-foreground text-3xl font-black">Free</div>
                        ) : (
                          <>
                            <div className="text-foreground text-3xl font-black">
                              {monthlyEquivalent
                                ? koboToNaira(monthlyEquivalent)
                                : koboToNaira(price)}
                              <span className="text-muted-foreground ml-1 text-sm font-normal">
                                /mo
                              </span>
                            </div>
                            {yearly && plan.priceYearly > 0 && (
                              <p className="text-muted-foreground mt-0.5 text-xs">
                                Billed as {koboToNaira(plan.priceYearly)}/year
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {plan.downloadQuota === 0
                          ? "Unlimited downloads"
                          : `${plan.downloadQuota} free downloads/month`}
                      </p>
                    </div>

                    <ul className="mb-6 flex-1 space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <CheckCircle2
                            className={cn("mt-0.5 h-4 w-4 shrink-0", planAccent(plan.slug))}
                          />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.slug === "free" ? (
                      <Button variant="outline" className="w-full" disabled={isCurrentPlan}>
                        {isCurrentPlan ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Current Plan
                          </>
                        ) : (
                          "Get Started Free"
                        )}
                      </Button>
                    ) : (
                      <Button
                        className={cn(
                          "w-full gap-2",
                          isPro
                            ? "bg-amber-500 text-black hover:bg-amber-400"
                            : "bg-brand hover:bg-brand/90 text-white",
                          isCurrentPlan && "opacity-60"
                        )}
                        disabled={isCurrentPlan || !!loadingPlanId}
                        onClick={() => handleSubscribe(plan)}
                      >
                        {loadingPlanId === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isCurrentPlan ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Current Plan
                          </>
                        ) : (
                          <>
                            {activeSubscription ? "Switch Plan" : "Get Started"}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 grid gap-4 text-center sm:grid-cols-3">
            {[
              {
                title: "Cancel anytime",
                desc: "No lock-in. Cancel your subscription from your account settings.",
              },
              {
                title: "Secure payments",
                desc: "Payments processed securely by Paystack — Nigeria's most trusted gateway.",
              },
              { title: "Instant access", desc: "Your plan upgrades immediately after payment." },
            ].map((item) => (
              <div key={item.title} className="bg-card rounded-xl border p-4">
                <h4 className="text-foreground mb-1 text-sm font-semibold">{item.title}</h4>
                <p className="text-muted-foreground text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Transaction History ── */}
      <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
        <div className="px-5 pt-5">
          <h2 className="text-foreground flex items-center gap-2 text-base font-bold">
            <CreditCard className="h-5 w-5" />
            Transaction History
          </h2>
        </div>
        <div className="p-5">
          {txLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
              <CreditCard className="mb-3 h-10 w-10" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {format(new Date(tx.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-sm capitalize">{tx.type}</TableCell>
                        <TableCell className="text-sm">{tx.description ?? "—"}</TableCell>
                        <TableCell className="text-sm font-medium whitespace-nowrap">
                          {(tx.amount / 100).toLocaleString("en-NG", {
                            style: "currency",
                            currency: "NGN",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={transactionStatusColors[tx.status] ?? ""}
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-muted-foreground text-sm">
                    Page {txPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txPage <= 1}
                      onClick={() => setTxPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txPage >= totalPages}
                      onClick={() => setTxPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
