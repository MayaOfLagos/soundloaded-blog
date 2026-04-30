import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export type MusicAccessIntent = "stream" | "download" | "waveform" | "metadata";

export interface MusicAccessStatus {
  allowed: boolean;
  intent: MusicAccessIntent;
  reason: string;
  error: string | null;
  requiresAuth: boolean;
  requiresSubscription: boolean;
  requiresPurchase: boolean;
  quotaExceeded: boolean;
  downloadsDisabled: boolean;
  price: number | null;
  accessModel: string;
  streamAccess: string;
  isExclusive: boolean;
  hasActiveSubscription: boolean;
  hasPurchase: boolean;
  quota: number | null;
  used: number | null;
}

export function useMusicAccess(musicId: string, intent: MusicAccessIntent = "stream") {
  return useQuery<MusicAccessStatus>({
    queryKey: ["music-access", musicId, intent],
    queryFn: () =>
      axios
        .get(`/api/music/${musicId}/access`, {
          params: { intent },
        })
        .then((res) => res.data),
    enabled: Boolean(musicId),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}
