import { createHmac, timingSafeEqual } from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";
const BASE_URL = "https://api.paystack.co";

async function paystackFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paystack ${path} failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function initializeTransaction(params: {
  email: string;
  amount: number;
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}) {
  return paystackFetch<{
    status: boolean;
    data: { authorization_url: string; access_code: string; reference: string };
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function verifyTransaction(reference: string) {
  return paystackFetch<{
    status: boolean;
    data: {
      status: string;
      amount: number;
      currency: string;
      reference: string;
      customer: { email: string; customer_code: string };
      metadata: Record<string, unknown> | null;
    };
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const hash = createHmac("sha512", PAYSTACK_SECRET).update(body).digest("hex");
  // Use timing-safe comparison to prevent timing attacks
  if (hash.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

/** Default prices in kobo (fallback when no Plan row found) */
export const PRICES = {
  DOWNLOAD_DEFAULT: 10000, // ₦100
  MONTHLY_SUB: 100000, // ₦1,000
  YEARLY_SUB: 1000000, // ₦10,000
} as const;

// ── Paystack Plan (subscription plan) API ────────────────────────────

export interface PaystackPlan {
  id: number;
  plan_code: string;
  name: string;
  description?: string;
  amount: number; // kobo
  interval: "monthly" | "annually" | "weekly" | "daily" | "quarterly" | "biannually";
  currency: string;
  is_deleted: boolean;
  is_archived: boolean;
}

/** Create a recurring plan on Paystack */
export async function createPaystackPlan(params: {
  name: string;
  amount: number; // kobo
  interval: "monthly" | "annually";
  description?: string;
  currency?: string;
}): Promise<{ status: boolean; data: PaystackPlan }> {
  return paystackFetch("/plan", {
    method: "POST",
    body: JSON.stringify({ currency: "NGN", ...params }),
  });
}

/** Fetch a single plan by plan_code */
export async function getPaystackPlan(
  planCode: string
): Promise<{ status: boolean; data: PaystackPlan }> {
  return paystackFetch(`/plan/${encodeURIComponent(planCode)}`);
}

/** List all plans from Paystack */
export async function listPaystackPlans(): Promise<{
  status: boolean;
  data: PaystackPlan[];
}> {
  return paystackFetch("/plan?perPage=50");
}

/** Initialize a subscription checkout (Paystack's inline plan subscription flow) */
export async function initializeSubscription(params: {
  email: string;
  plan: string; // plan_code
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
}) {
  return paystackFetch<{
    status: boolean;
    data: { authorization_url: string; access_code: string; reference: string };
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ amount: 0, ...params }), // amount ignored when plan is set
  });
}

/** Disable (cancel) a Paystack subscription */
export async function cancelPaystackSubscription(params: {
  code: string; // subscription code
  token: string; // email token
}): Promise<{ status: boolean; message: string }> {
  return paystackFetch("/subscription/disable", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
