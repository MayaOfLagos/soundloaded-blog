import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface SubscriptionStatus {
  hasSubscription: boolean;
  expiresAt: string | null;
  plan: string | null;
}

export function useSubscription() {
  return useQuery<SubscriptionStatus>({
    queryKey: ["subscription-status"],
    queryFn: () => axios.get("/api/payments/status").then((r) => r.data),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
