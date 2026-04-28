"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

interface PlanRow {
  id: string;
  slug: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  downloadQuota: number;
  isActive: boolean;
  paystackPlanCodeMonthly: string | null;
  paystackPlanCodeYearly: string | null;
}

function koboToNaira(kobo: number) {
  return (kobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN" });
}

export function BillingSettings({ form }: Props) {
  const creatorPercent = form.watch("creatorRevenuePercent" as keyof SettingsFormValues) as number;

  const {
    data: plans,
    isLoading: plansLoading,
    refetch,
    isFetching,
  } = useQuery<PlanRow[]>({
    queryKey: ["admin-plans"],
    queryFn: () => adminApi.get("/api/admin/plans").then((r) => r.data),
  });

  return (
    <div className="space-y-8">
      {/* ── Monetization Toggles ── */}
      <div>
        <h2 className="text-foreground text-base font-bold">Monetization</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Control the subscription &amp; creator monetization system
        </p>
      </div>
      <Separator />

      <FormField
        control={form.control}
        name={"enableCreatorMonetization" as keyof SettingsFormValues}
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <FormLabel className="text-sm font-medium">Enable Creator Monetization</FormLabel>
              <FormDescription className="text-xs">
                Allow creators (artists/labels) to set per-track access models and earn revenue
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value as boolean} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* ── Revenue Split ── */}
      <div>
        <h2 className="text-foreground text-base font-bold">Revenue Split</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Define what percentage of revenue creators receive from download purchases and
          subscription distributions
        </p>
      </div>
      <Separator />

      <FormField
        control={form.control}
        name={"creatorRevenuePercent" as keyof SettingsFormValues}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Creator Revenue Percentage</FormLabel>
            <div className="flex items-center gap-4">
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={field.value as number}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="w-28"
                />
              </FormControl>
              <span className="text-muted-foreground text-sm">%</span>
              {/* Live preview split */}
              <div className="bg-muted flex items-center gap-3 rounded-lg px-4 py-2 text-sm">
                <span>
                  Creator:{" "}
                  <span className="text-foreground font-bold">{creatorPercent ?? 70}%</span>
                </span>
                <span className="text-muted-foreground">·</span>
                <span>
                  Platform:{" "}
                  <span className="text-foreground font-bold">
                    {100 - ((creatorPercent as number) ?? 70)}%
                  </span>
                </span>
              </div>
            </div>
            <FormDescription>
              Recommended: 70% creator / 30% platform. Applied to per-purchase downloads and
              subscription revenue distributions.
            </FormDescription>
          </FormItem>
        )}
      />

      {/* ── Free Tier Quota ── */}
      <div>
        <h2 className="text-foreground text-base font-bold">Free Tier</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Configure limits for users on the Free plan
        </p>
      </div>
      <Separator />

      <FormField
        control={form.control}
        name={"freeDownloadQuota" as keyof SettingsFormValues}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Monthly Free Download Quota</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                max={100}
                value={field.value as number}
                onChange={(e) => field.onChange(Number(e.target.value))}
                className="w-28"
              />
            </FormControl>
            <FormDescription>
              Number of free downloads per month for unsubscribed users. Set to 0 to disable free
              downloads entirely.
            </FormDescription>
          </FormItem>
        )}
      />

      {/* ── Paystack Public Key ── */}
      <div>
        <h2 className="text-foreground text-base font-bold">Paystack Configuration</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Frontend-safe Paystack publishable key (pk_test_… or pk_live_…)
        </p>
      </div>
      <Separator />

      <FormField
        control={form.control}
        name={"paystackPublicKey" as keyof SettingsFormValues}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Paystack Public Key</FormLabel>
            <FormControl>
              <Input
                placeholder="pk_test_…"
                value={(field.value as string) ?? ""}
                onChange={field.onChange}
                className="font-mono text-sm"
              />
            </FormControl>
            <FormDescription>
              This key is embedded in the frontend for Paystack Inline. The secret key stays
              server-side only in{" "}
              <code className="bg-muted rounded px-1 text-xs">PAYSTACK_SECRET_KEY</code>.
            </FormDescription>
          </FormItem>
        )}
      />

      {/* ── Subscription Plans (read-only table, seeded via script) ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-base font-bold">Subscription Plans</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Plans are seeded via{" "}
            <code className="bg-muted rounded px-1 text-xs">node scripts/seed-plans.mjs</code>.
            Paystack plan codes are set automatically.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span className="ml-1.5">Refresh</span>
        </Button>
      </div>
      <Separator />

      {plansLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          <span className="text-muted-foreground text-sm">Loading plans…</span>
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-2.5 text-left font-medium">Plan</th>
                <th className="px-4 py-2.5 text-left font-medium">Monthly</th>
                <th className="px-4 py-2.5 text-left font-medium">Yearly</th>
                <th className="px-4 py-2.5 text-left font-medium">Downloads</th>
                <th className="px-4 py-2.5 text-left font-medium">Paystack Codes</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{plan.name}</td>
                  <td className="text-muted-foreground px-4 py-3">
                    {plan.priceMonthly === 0 ? "Free" : koboToNaira(plan.priceMonthly)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {plan.priceYearly === 0 ? "—" : koboToNaira(plan.priceYearly)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {plan.downloadQuota === 0 ? "Unlimited" : `${plan.downloadQuota}/mo`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {plan.paystackPlanCodeMonthly ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <code className="text-muted-foreground text-xs">
                            {plan.paystackPlanCodeMonthly} (mo)
                          </code>
                        </div>
                      ) : plan.priceMonthly > 0 ? (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                          <span className="text-muted-foreground text-xs">Not seeded</span>
                        </div>
                      ) : null}
                      {plan.paystackPlanCodeYearly ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <code className="text-muted-foreground text-xs">
                            {plan.paystackPlanCodeYearly} (yr)
                          </code>
                        </div>
                      ) : plan.priceYearly > 0 ? (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                          <span className="text-muted-foreground text-xs">Not seeded</span>
                        </div>
                      ) : null}
                      {plan.priceMonthly === 0 && plan.priceYearly === 0 && (
                        <span className="text-muted-foreground text-xs">N/A (free tier)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={plan.isActive ? "default" : "secondary"} className="text-xs">
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-muted/30 rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
          <p className="text-muted-foreground text-sm font-medium">No plans found</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Run <code className="bg-muted rounded px-1">node scripts/seed-plans.mjs</code> after
            adding your Paystack keys to <code className="bg-muted rounded px-1">.env.local</code>
          </p>
        </div>
      )}
    </div>
  );
}
