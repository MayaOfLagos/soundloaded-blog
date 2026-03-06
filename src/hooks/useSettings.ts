import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { PublicSettings } from "@/lib/settings";

export function useSettings() {
  return useQuery<PublicSettings>({
    queryKey: ["site-settings"],
    queryFn: () => axios.get("/api/settings").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
