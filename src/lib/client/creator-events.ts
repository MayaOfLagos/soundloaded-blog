export type ClientCreatorEventContext = {
  surface?: string;
  placement?: string;
  position?: number;
  recommendationRequestId?: string;
  candidateSource?: string;
  reasonKey?: string;
  referrerEntityType?: string;
  referrerEntityId?: string;
  queryText?: string;
};

export type ShareTrackingInput = ClientCreatorEventContext & {
  entityType: "MUSIC" | "ARTIST" | "POST" | "PLAYLIST";
  entityId: string;
  shareChannel?: "native" | "copy" | "whatsapp" | "x" | string;
  href?: string;
};

export function trackShareClick(input?: ShareTrackingInput | null) {
  if (typeof window === "undefined" || !input?.entityId) return;

  const payload = JSON.stringify({
    ...input,
    href: input.href ?? window.location.href,
  });

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      "/api/creator/events/share",
      new Blob([payload], { type: "application/json" })
    );
    if (sent) return;
  }

  fetch("/api/creator/events/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
