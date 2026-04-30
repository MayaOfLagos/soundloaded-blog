import { db } from "@/lib/db";
import { getPwaHealth } from "@/lib/pwa-health";
import { getSearchHealth } from "@/lib/meilisearch";

export type OpsSeverity = "critical" | "warning" | "info" | "ok";

export interface AdminOpsCard {
  key: string;
  title: string;
  value: number | string;
  subtitle: string;
  href: string;
  actionLabel: string;
  severity: OpsSeverity;
  adminOnly?: boolean;
}

export async function getAdminOpsSnapshot(role = "") {
  const now = new Date();
  const staleProcessingThreshold = new Date(now.getTime() - 30 * 60 * 1000);

  const [
    failedAudioJobs,
    staleAudioJobs,
    pendingCreatorApplications,
    openReports,
    pendingComments,
    scheduledPosts,
    scheduledPages,
    premiumTracksMissingConfig,
    tracksMissingArtwork,
    artistsMissingBioOrPhoto,
    recentFailedAudioJobs,
    recentPendingApplications,
    searchHealth,
    pwaHealth,
  ] = await Promise.all([
    db.audioProcessingJob.count({ where: { status: "failed" } }),
    db.audioProcessingJob.count({
      where: { status: "processing", updatedAt: { lt: staleProcessingThreshold } },
    }),
    db.creatorApplication.count({ where: { status: "PENDING" } }),
    db.report.count({ where: { status: "PENDING" } }),
    db.comment.count({ where: { status: "PENDING" } }),
    db.post.count({ where: { status: "SCHEDULED" } }),
    db.page.count({ where: { status: "SCHEDULED" } }),
    db.music.count({
      where: {
        accessModel: { in: ["purchase", "both"] },
        price: null,
        creatorPrice: null,
      },
    }),
    db.music.count({ where: { OR: [{ coverArt: null }, { coverArt: "" }] } }),
    db.artist.count({
      where: {
        OR: [{ bio: null }, { bio: "" }, { photo: null }, { photo: "" }],
      },
    }),
    db.audioProcessingJob.findMany({
      where: { status: "failed" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        error: true,
        updatedAt: true,
        music: { select: { id: true, title: true, artist: { select: { name: true } } } },
      },
    }),
    db.creatorApplication.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { id: true, displayName: true, type: true, createdAt: true },
    }),
    getSearchHealth(),
    getPwaHealth(),
  ]);

  const searchIssues =
    !searchHealth.configured || !searchHealth.reachable
      ? 1
      : searchHealth.indexes.filter((index) => !index.exists).length;

  const pwaIssues = pwaHealth.checks.filter((check) => check.status !== "ok").length;

  const cards: AdminOpsCard[] = [
    {
      key: "failed-audio-jobs",
      title: "Failed Audio Jobs",
      value: failedAudioJobs + staleAudioJobs,
      subtitle:
        staleAudioJobs > 0
          ? `${failedAudioJobs} failed, ${staleAudioJobs} stale processing`
          : `${failedAudioJobs} failed job${failedAudioJobs === 1 ? "" : "s"}`,
      href: "/admin/audio-processing",
      actionLabel: "Review jobs",
      severity: failedAudioJobs + staleAudioJobs > 0 ? "critical" : "ok",
      adminOnly: true,
    },
    {
      key: "creator-applications",
      title: "Creator Applications",
      value: pendingCreatorApplications,
      subtitle: "Pending artist or label access requests",
      href: "/admin/creators",
      actionLabel: "Review creators",
      severity: pendingCreatorApplications > 0 ? "warning" : "ok",
      adminOnly: true,
    },
    {
      key: "reports",
      title: "Open Reports",
      value: openReports,
      subtitle: "Community reports waiting for moderation",
      href: "/admin/reports",
      actionLabel: "Moderate",
      severity: openReports > 0 ? "critical" : "ok",
    },
    {
      key: "comments",
      title: "Pending Comments",
      value: pendingComments,
      subtitle: "Comments waiting for approval",
      href: "/admin/comments",
      actionLabel: "Review comments",
      severity: pendingComments > 0 ? "warning" : "ok",
    },
    {
      key: "scheduled-content",
      title: "Scheduled Content",
      value: scheduledPosts + scheduledPages,
      subtitle: `${scheduledPosts} posts, ${scheduledPages} pages`,
      href: "/admin/posts?status=SCHEDULED",
      actionLabel: "Check schedule",
      severity: scheduledPosts + scheduledPages > 0 ? "info" : "ok",
    },
    {
      key: "premium-config",
      title: "Premium Config Gaps",
      value: premiumTracksMissingConfig,
      subtitle: "Purchase tracks without explicit price",
      href: "/admin/music",
      actionLabel: "Fix pricing",
      severity: premiumTracksMissingConfig > 0 ? "warning" : "ok",
      adminOnly: true,
    },
    {
      key: "missing-artwork",
      title: "Tracks Missing Artwork",
      value: tracksMissingArtwork,
      subtitle: "Tracks with no cover art",
      href: "/admin/music",
      actionLabel: "Open music",
      severity: tracksMissingArtwork > 0 ? "warning" : "ok",
    },
    {
      key: "artist-profiles",
      title: "Artist Profile Gaps",
      value: artistsMissingBioOrPhoto,
      subtitle: "Artists missing bio or photo",
      href: "/admin/artists",
      actionLabel: "Open artists",
      severity: artistsMissingBioOrPhoto > 0 ? "warning" : "ok",
    },
    {
      key: "search-health",
      title: "Search Health",
      value: searchHealth.reachable ? "Online" : "Offline",
      subtitle:
        searchIssues === 0
          ? "Search service and indexes look healthy"
          : `${searchIssues} search issue${searchIssues === 1 ? "" : "s"} found`,
      href: "/admin/search",
      actionLabel: "Open search ops",
      severity: searchIssues > 0 ? "critical" : "ok",
      adminOnly: true,
    },
    {
      key: "pwa-health",
      title: "PWA Health",
      value: pwaHealth.status === "ok" ? "Ready" : pwaHealth.status,
      subtitle:
        pwaIssues === 0
          ? "Manifest, icons, and cache rules look ready"
          : `${pwaIssues} install issue${pwaIssues === 1 ? "" : "s"} found`,
      href: "/admin/settings",
      actionLabel: "Open settings",
      severity: pwaHealth.status,
      adminOnly: true,
    },
  ];

  const canSeeAdminOnly = role === "ADMIN" || role === "SUPER_ADMIN";

  return {
    generatedAt: now.toISOString(),
    cards: cards.filter((card) => !card.adminOnly || canSeeAdminOnly),
    totals: {
      failedAudioJobs,
      staleAudioJobs,
      pendingCreatorApplications,
      openReports,
      pendingComments,
      scheduledPosts,
      scheduledPages,
      premiumTracksMissingConfig,
      tracksMissingArtwork,
      artistsMissingBioOrPhoto,
      searchIssues,
      pwaIssues,
    },
    recentFailedAudioJobs,
    recentPendingApplications,
    searchHealth,
    pwaHealth,
  };
}
