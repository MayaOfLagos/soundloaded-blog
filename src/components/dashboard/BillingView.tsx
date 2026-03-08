"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserTransactions } from "@/hooks/useUserDashboard";
import { format } from "date-fns";
import { CreditCard, Check, Crown, Zap } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";

const subscriptionStatusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-yellow-100 text-yellow-700",
};

const transactionStatusColors: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED: "bg-red-100 text-red-700",
};

const FREE_FEATURES = [
  "Read all articles",
  "Comment on posts",
  "Basic music streaming",
  "5 free downloads per month",
];

const PREMIUM_FEATURES = [
  "Everything in Free",
  "Unlimited downloads",
  "Ad-free experience",
  "Early access to new releases",
  "Exclusive content",
];

export function BillingView() {
  const [page, setPage] = useState(1);
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: txData, isLoading: txLoading } = useUserTransactions(page);

  const transactions = txData?.transactions ?? [];
  const totalPages = txData?.totalPages ?? 1;

  const handleUpgrade = async () => {
    try {
      const { data } = await axios.post("/api/payments/initialize");
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch {
      // error handled by interceptor
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
        <div className="px-5 pt-5">
          <h2 className="text-foreground flex items-center gap-2 text-base font-bold">
            <Crown className="h-5 w-5" />
            Current Plan
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">Manage your subscription and billing</p>
        </div>
        <div className="p-5">
          {subLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-60" />
              <Skeleton className="h-10 w-32" />
            </div>
          ) : !subscription?.hasSubscription ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="text-muted-foreground h-5 w-5" />
                <h3 className="text-lg font-semibold">Free Plan</h3>
              </div>
              <ul className="space-y-2">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Separator />

              <div>
                <h4 className="mb-2 text-sm font-medium">Upgrade to Premium for:</h4>
                <ul className="space-y-2">
                  {PREMIUM_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-purple-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Button onClick={handleUpgrade} className="mt-2">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold">Premium — {subscription.plan}</h3>
                  <Badge
                    variant="secondary"
                    className={
                      subscriptionStatusColors[
                        subscription.expiresAt && new Date(subscription.expiresAt) > new Date()
                          ? "ACTIVE"
                          : "EXPIRED"
                      ] ?? ""
                    }
                  >
                    {subscription.expiresAt && new Date(subscription.expiresAt) > new Date()
                      ? "Active"
                      : "Expired"}
                  </Badge>
                </div>
              </div>
              {subscription.expiresAt && (
                <p className="text-muted-foreground text-sm">
                  {new Date(subscription.expiresAt) > new Date()
                    ? `Renews on ${format(new Date(subscription.expiresAt), "MMMM d, yyyy")}`
                    : `Expired on ${format(new Date(subscription.expiresAt), "MMMM d, yyyy")}`}
                </p>
              )}
              <Button variant="outline" asChild>
                <Link href="/billing">Manage Subscription</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
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
                    {transactions.map(
                      (tx: {
                        id: string;
                        createdAt: string;
                        type: string;
                        description?: string;
                        amount: number;
                        status: string;
                      }) => (
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
                      )
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-muted-foreground text-sm">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
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
