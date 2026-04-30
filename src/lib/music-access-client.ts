export interface ClientMusicAccessTrack {
  isExclusive?: boolean | null;
  accessModel?: string | null;
  streamAccess?: string | null;
}

export function isOptimisticallyStreamLocked(
  track: ClientMusicAccessTrack,
  hasSubscription: boolean
) {
  const accessModel = track.accessModel ?? "free";
  const streamAccess = track.streamAccess ?? "free";

  if (accessModel === "purchase") return true;
  if (accessModel === "both") return !hasSubscription;

  return Boolean(track.isExclusive) || streamAccess === "subscription" || accessModel === "subscription"
    ? !hasSubscription
    : false;
}

export function getOptimisticPlaybackLockMessage(track: ClientMusicAccessTrack) {
  const accessModel = track.accessModel ?? "free";

  if (accessModel === "purchase") return "Buy this track to play it.";
  if (accessModel === "both") return "Buy this track or subscribe to play it.";

  return "Subscribe to play this track.";
}
