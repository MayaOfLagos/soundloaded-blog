import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const SETTINGS_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function requireSettingsAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !SETTINGS_ROLES.includes(role)) return null;
  return session;
}

const settingsSchema = z
  .object({
    // General
    siteName: z.string().min(1).max(100),
    tagline: z.string().max(300),
    siteUrl: z.string().url().or(z.literal("")),
    contactEmail: z.string().email().or(z.literal("")),
    copyrightText: z.string().max(200),
    logoLight: z.string().nullable(),
    logoDark: z.string().nullable(),
    favicon: z.string().nullable(),
    defaultOgImage: z.string().nullable(),
    // SEO
    metaTitleTemplate: z.string().max(100),
    metaDescription: z.string().max(500),
    googleSiteVerification: z.string().max(100),
    bingSiteVerification: z.string().max(100),
    googleAnalyticsId: z.string().max(50),
    seoKeywords: z.string().max(500),
    // Social
    instagram: z.string().max(50),
    twitter: z.string().max(50),
    facebook: z.string().max(50),
    youtube: z.string().max(100),
    spotify: z.string().max(100),
    tiktok: z.string().max(50),
    appleMusic: z.string().max(100),
    telegram: z.string().max(50),
    whatsapp: z.string().max(20),
    // PWA
    pwaAppName: z.string().max(100),
    pwaShortName: z.string().max(30),
    pwaThemeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    pwaBackgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    pwaDisplayMode: z.enum(["standalone", "fullscreen", "minimal-ui", "browser"]),
    pwaOrientation: z.enum([
      "any",
      "portrait",
      "landscape",
      "portrait-primary",
      "landscape-primary",
    ]),
    pwaIcons: z.array(z.record(z.string())).default([]),
    pwaSplashScreens: z.array(z.record(z.string())).default([]),
    // Notifications
    discordWebhookUrl: z.string().url().or(z.literal("")),
    notifyOnNewComment: z.boolean(),
    notifyOnNewSubscriber: z.boolean(),
    notifyOnNewMusicUpload: z.boolean(),
    emailNotificationsAdmin: z.boolean(),
    // Content / Reading
    postsPerPage: z.number().int().min(1).max(100),
    feedItemCount: z.number().int().min(1).max(100),
    feedContentMode: z.enum(["full", "excerpt"]),
    searchEngineVisibility: z.boolean(),
    defaultPostStatus: z.enum(["DRAFT", "PUBLISHED"]),
    enableDownloads: z.boolean(),
    maxDownloadsPerHour: z.number().int().min(1).max(1000),
    // Permalinks
    permalinkStructure: z.string().min(1).max(200),
    categoryBase: z.string().max(100),
    // Discussion / Comments
    enableComments: z.boolean(),
    autoApproveComments: z.boolean(),
    requireLoginToComment: z.boolean(),
    commentNestingDepth: z.number().int().min(1).max(5),
    commentsPerPage: z.number().int().min(5).max(100),
    commentOrder: z.enum(["oldest", "newest"]),
    closeCommentsAfterDays: z.number().int().min(0).max(365),
    commentPreviouslyApproved: z.boolean(),
    commentMaxLinks: z.number().int().min(0).max(100),
    emailOnNewComment: z.boolean(),
    emailOnModeration: z.boolean(),
    commentModerationKeywords: z.string().max(5000),
    commentBlocklist: z.string().max(5000),
    // Locale
    timezone: z.string().max(50),
    dateFormat: z.string().max(30),
    timeFormat: z.string().max(20),
    language: z.string().max(10),
    // Maintenance
    maintenanceMode: z.boolean(),
    maintenanceMessage: z.string().max(2000),
    maintenanceAllowedIPs: z.string().max(1000),
    // Code Injection
    headerScripts: z.string().max(20000),
    footerScripts: z.string().max(20000),
    // Media
    thumbnailSize: z.number().int().min(50).max(500),
    mediumImageSize: z.number().int().min(200).max(1200),
    largeImageSize: z.number().int().min(600).max(3000),
    imageQuality: z.number().int().min(1).max(100),
    enableWatermark: z.boolean(),
    watermarkImage: z.string().nullable(),
    watermarkPosition: z.enum(["center", "top-left", "top-right", "bottom-left", "bottom-right"]),
    // Security
    maxLoginAttempts: z.number().int().min(1).max(20),
    loginLockoutDuration: z.number().int().min(1).max(1440),
    requireStrongPasswords: z.boolean(),
    allowRegistration: z.boolean(),
    defaultUserRole: z.enum(["READER", "CONTRIBUTOR"]),
    // Email
    emailFromName: z.string().max(100),
    emailFromAddress: z.string().email().or(z.literal("")),
    emailWelcomeEnabled: z.boolean(),
    emailDigestEnabled: z.boolean(),
    emailDigestDay: z.enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]),
    // Appearance
    brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    enableDarkMode: z.boolean(),
    defaultTheme: z.enum(["light", "dark", "system"]),
    customCss: z.string().max(10000),
  })
  .partial();

export async function GET() {
  const session = await requireSettingsAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let settings = await db.siteSettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await db.siteSettings.create({ data: { id: "default" } });
    }
    return NextResponse.json(settings);
  } catch (err) {
    console.error("[GET /api/admin/settings]", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireSettingsAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = settingsSchema.parse(body);

    const settings = await db.siteSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...data },
      update: data,
    });

    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[PUT /api/admin/settings]", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
