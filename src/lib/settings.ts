import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

export interface PublicSettings {
  // General
  siteName: string;
  tagline: string;
  siteUrl: string;
  contactEmail: string;
  copyrightText: string;
  logoLight: string | null;
  logoDark: string | null;
  favicon: string | null;
  defaultOgImage: string | null;
  // SEO
  metaTitleTemplate: string;
  metaDescription: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
  googleAnalyticsId: string;
  seoKeywords: string;
  // Social
  instagram: string;
  twitter: string;
  facebook: string;
  youtube: string;
  spotify: string;
  tiktok: string;
  appleMusic: string;
  telegram: string;
  whatsapp: string;
  // PWA
  pwaAppName: string;
  pwaShortName: string;
  pwaThemeColor: string;
  pwaBackgroundColor: string;
  pwaDisplayMode: string;
  pwaOrientation: string;
  pwaIcons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
  pwaSplashScreens: Array<{ src: string; sizes: string }>;
  // Content / Reading
  postsPerPage: number;
  feedItemCount: number;
  feedContentMode: string;
  searchEngineVisibility: boolean;
  enableDownloads: boolean;
  maxDownloadsPerHour: number;
  // Permalinks
  permalinkStructure: string;
  categoryBase: string;
  // Discussion / Comments
  enableComments: boolean;
  autoApproveComments: boolean;
  requireLoginToComment: boolean;
  commentNestingDepth: number;
  commentsPerPage: number;
  commentOrder: string;
  closeCommentsAfterDays: number;
  // Locale
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  // Maintenance
  maintenanceMode: boolean;
  maintenanceMessage: string;
  // Security (public subset)
  allowRegistration: boolean;
  // Code Injection
  headerScripts: string;
  footerScripts: string;
  customCss: string;
  // Appearance
  brandColor: string;
  enableDarkMode: boolean;
  defaultTheme: string;
  // Feature Toggles — Stories
  enableStories: boolean;
  storyExpiryHours: number;
  // Feature Toggles — Site Sections
  enableFeed: boolean;
  enableExplore: boolean;
  enableMusic: boolean;
  enableNews: boolean;
  enableGist: boolean;
  enableLyrics: boolean;
  enableVideos: boolean;
  enableAlbums: boolean;
  enableArtists: boolean;
  enableSearch: boolean;
  // Player Experience
  enableNowPlayingDrawer: boolean;
  // Landing gate
  enableLandingGate: boolean;
}

const DEFAULTS: PublicSettings = {
  siteName: "Soundloaded Blog",
  tagline: "Nigeria's #1 music download & entertainment blog",
  siteUrl: "https://soundloaded.ng",
  contactEmail: "",
  copyrightText: "Soundloaded Nigeria. All rights reserved.",
  logoLight: null,
  logoDark: null,
  favicon: null,
  defaultOgImage: null,
  metaTitleTemplate: "%s | Soundloaded Blog",
  metaDescription:
    "Nigeria's premier music blog — latest music news, free music downloads, gist, artist profiles, and more.",
  googleSiteVerification: "",
  bingSiteVerification: "",
  googleAnalyticsId: "",
  seoKeywords: "Nigeria music, Afrobeats, free music download, music news, African music",
  instagram: "soundloadedng",
  twitter: "soundloadedng",
  facebook: "soundloadedng",
  youtube: "",
  spotify: "",
  tiktok: "",
  appleMusic: "",
  telegram: "",
  whatsapp: "",
  pwaAppName: "Soundloaded Blog",
  pwaShortName: "Soundloaded",
  pwaThemeColor: "#e11d48",
  pwaBackgroundColor: "#0a0a0a",
  pwaDisplayMode: "standalone",
  pwaOrientation: "any",
  pwaIcons: [],
  pwaSplashScreens: [],
  postsPerPage: 20,
  feedItemCount: 20,
  feedContentMode: "excerpt",
  searchEngineVisibility: true,
  enableDownloads: true,
  maxDownloadsPerHour: 10,
  permalinkStructure: "/%postname%",
  categoryBase: "category",
  enableComments: true,
  autoApproveComments: false,
  requireLoginToComment: false,
  commentNestingDepth: 2,
  commentsPerPage: 20,
  commentOrder: "oldest",
  closeCommentsAfterDays: 0,
  timezone: "Africa/Lagos",
  dateFormat: "MMM d, yyyy",
  timeFormat: "h:mm a",
  language: "en",
  maintenanceMode: false,
  maintenanceMessage: "We're upgrading. Be right back!",
  allowRegistration: true,
  headerScripts: "",
  footerScripts: "",
  customCss: "",
  brandColor: "#e11d48",
  enableDarkMode: true,
  defaultTheme: "dark",
  enableStories: true,
  storyExpiryHours: 24,
  enableFeed: true,
  enableExplore: true,
  enableMusic: true,
  enableNews: true,
  enableGist: true,
  enableLyrics: true,
  enableVideos: true,
  enableAlbums: true,
  enableArtists: true,
  enableSearch: true,
  enableNowPlayingDrawer: true,
  enableLandingGate: true,
};

function resolveImageUrl(r2Key: string | null | undefined): string | null {
  if (!r2Key) return null;
  if (r2Key.startsWith("/") || r2Key.startsWith("http")) return r2Key;
  const cdn = process.env.NEXT_PUBLIC_CDN_URL ?? "";
  return cdn ? `${cdn}/${r2Key}` : `/${r2Key}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJsonArray(val: unknown): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return [];
}

function str(raw: Record<string, unknown>, key: string, fallback: string): string {
  return (raw[key] as string) || fallback;
}

function bool(raw: Record<string, unknown>, key: string, fallback: boolean): boolean {
  return raw[key] !== undefined ? (raw[key] as boolean) : fallback;
}

function num(raw: Record<string, unknown>, key: string, fallback: number): number {
  return (raw[key] as number) ?? fallback;
}

export function buildPublicSettings(
  raw: Record<string, unknown> | null | undefined
): PublicSettings {
  if (!raw) return DEFAULTS;

  return {
    siteName: str(raw, "siteName", DEFAULTS.siteName),
    tagline: str(raw, "tagline", DEFAULTS.tagline),
    siteUrl: str(raw, "siteUrl", DEFAULTS.siteUrl),
    contactEmail: str(raw, "contactEmail", DEFAULTS.contactEmail),
    copyrightText: str(raw, "copyrightText", DEFAULTS.copyrightText),
    logoLight: resolveImageUrl(raw.logoLight as string | null),
    logoDark: resolveImageUrl(raw.logoDark as string | null),
    favicon: resolveImageUrl(raw.favicon as string | null),
    defaultOgImage: resolveImageUrl(raw.defaultOgImage as string | null),
    metaTitleTemplate: str(raw, "metaTitleTemplate", DEFAULTS.metaTitleTemplate),
    metaDescription: str(raw, "metaDescription", DEFAULTS.metaDescription),
    googleSiteVerification: str(raw, "googleSiteVerification", ""),
    bingSiteVerification: str(raw, "bingSiteVerification", ""),
    googleAnalyticsId: str(raw, "googleAnalyticsId", ""),
    seoKeywords: str(raw, "seoKeywords", DEFAULTS.seoKeywords),
    instagram: str(raw, "instagram", DEFAULTS.instagram),
    twitter: str(raw, "twitter", DEFAULTS.twitter),
    facebook: str(raw, "facebook", DEFAULTS.facebook),
    youtube: str(raw, "youtube", ""),
    spotify: str(raw, "spotify", ""),
    tiktok: str(raw, "tiktok", ""),
    appleMusic: str(raw, "appleMusic", ""),
    telegram: str(raw, "telegram", ""),
    whatsapp: str(raw, "whatsapp", ""),
    pwaAppName: str(raw, "pwaAppName", DEFAULTS.pwaAppName),
    pwaShortName: str(raw, "pwaShortName", DEFAULTS.pwaShortName),
    pwaThemeColor: str(raw, "pwaThemeColor", DEFAULTS.pwaThemeColor),
    pwaBackgroundColor: str(raw, "pwaBackgroundColor", DEFAULTS.pwaBackgroundColor),
    pwaDisplayMode: str(raw, "pwaDisplayMode", DEFAULTS.pwaDisplayMode),
    pwaOrientation: str(raw, "pwaOrientation", DEFAULTS.pwaOrientation),
    pwaIcons: parseJsonArray(raw.pwaIcons),
    pwaSplashScreens: parseJsonArray(raw.pwaSplashScreens),
    postsPerPage: num(raw, "postsPerPage", DEFAULTS.postsPerPage),
    feedItemCount: num(raw, "feedItemCount", DEFAULTS.feedItemCount),
    feedContentMode: str(raw, "feedContentMode", DEFAULTS.feedContentMode),
    searchEngineVisibility: bool(raw, "searchEngineVisibility", DEFAULTS.searchEngineVisibility),
    enableDownloads: bool(raw, "enableDownloads", DEFAULTS.enableDownloads),
    maxDownloadsPerHour: num(raw, "maxDownloadsPerHour", DEFAULTS.maxDownloadsPerHour),
    permalinkStructure: str(raw, "permalinkStructure", DEFAULTS.permalinkStructure),
    categoryBase: str(raw, "categoryBase", DEFAULTS.categoryBase),
    enableComments: bool(raw, "enableComments", DEFAULTS.enableComments),
    autoApproveComments: bool(raw, "autoApproveComments", DEFAULTS.autoApproveComments),
    requireLoginToComment: bool(raw, "requireLoginToComment", DEFAULTS.requireLoginToComment),
    commentNestingDepth: num(raw, "commentNestingDepth", DEFAULTS.commentNestingDepth),
    commentsPerPage: num(raw, "commentsPerPage", DEFAULTS.commentsPerPage),
    commentOrder: str(raw, "commentOrder", DEFAULTS.commentOrder),
    closeCommentsAfterDays: num(raw, "closeCommentsAfterDays", DEFAULTS.closeCommentsAfterDays),
    timezone: str(raw, "timezone", DEFAULTS.timezone),
    dateFormat: str(raw, "dateFormat", DEFAULTS.dateFormat),
    timeFormat: str(raw, "timeFormat", DEFAULTS.timeFormat),
    language: str(raw, "language", DEFAULTS.language),
    maintenanceMode: bool(raw, "maintenanceMode", DEFAULTS.maintenanceMode),
    maintenanceMessage: str(raw, "maintenanceMessage", DEFAULTS.maintenanceMessage),
    allowRegistration: bool(raw, "allowRegistration", DEFAULTS.allowRegistration),
    headerScripts: str(raw, "headerScripts", DEFAULTS.headerScripts),
    footerScripts: str(raw, "footerScripts", DEFAULTS.footerScripts),
    customCss: str(raw, "customCss", DEFAULTS.customCss),
    brandColor: str(raw, "brandColor", DEFAULTS.brandColor),
    enableDarkMode: bool(raw, "enableDarkMode", DEFAULTS.enableDarkMode),
    defaultTheme: str(raw, "defaultTheme", DEFAULTS.defaultTheme),
    enableStories: bool(raw, "enableStories", DEFAULTS.enableStories),
    storyExpiryHours: num(raw, "storyExpiryHours", DEFAULTS.storyExpiryHours),
    enableFeed: bool(raw, "enableFeed", DEFAULTS.enableFeed),
    enableExplore: bool(raw, "enableExplore", DEFAULTS.enableExplore),
    enableMusic: bool(raw, "enableMusic", DEFAULTS.enableMusic),
    enableNews: bool(raw, "enableNews", DEFAULTS.enableNews),
    enableGist: bool(raw, "enableGist", DEFAULTS.enableGist),
    enableLyrics: bool(raw, "enableLyrics", DEFAULTS.enableLyrics),
    enableVideos: bool(raw, "enableVideos", DEFAULTS.enableVideos),
    enableAlbums: bool(raw, "enableAlbums", DEFAULTS.enableAlbums),
    enableArtists: bool(raw, "enableArtists", DEFAULTS.enableArtists),
    enableSearch: bool(raw, "enableSearch", DEFAULTS.enableSearch),
    enableNowPlayingDrawer: bool(raw, "enableNowPlayingDrawer", DEFAULTS.enableNowPlayingDrawer),
    enableLandingGate: bool(raw, "enableLandingGate", DEFAULTS.enableLandingGate),
  };
}

/**
 * Server-side cached settings fetch.
 * unstable_cache caches across requests for 60 s, drastically reducing
 * cold-start DB queries on Neon.
 */
export const getSettings = unstable_cache(
  async (): Promise<PublicSettings> => {
    try {
      const raw = await db.siteSettings.findUnique({ where: { id: "default" } });
      return buildPublicSettings(raw as unknown as Record<string, unknown>);
    } catch {
      return DEFAULTS;
    }
  },
  ["site-settings"],
  { revalidate: 60 }
);
