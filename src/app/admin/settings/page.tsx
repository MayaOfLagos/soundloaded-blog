"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import toast from "react-hot-toast";
import {
  Settings,
  Save,
  Loader2,
  Globe,
  Search,
  Share2,
  Smartphone,
  Bell,
  FileText,
  Palette,
  Server,
  MessageSquare,
  Construction,
  Code,
  ImageIcon,
  Shield,
  Mail,
  Link2,
  ToggleRight,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GeneralSettings } from "./_components/GeneralSettings";
import { SeoSettings } from "./_components/SeoSettings";
import { SocialSettings } from "./_components/SocialSettings";
import { PwaSettings } from "./_components/PwaSettings";
import { NotificationSettings } from "./_components/NotificationSettings";
import { ContentSettings } from "./_components/ContentSettings";
import { DiscussionSettings } from "./_components/DiscussionSettings";
import { AppearanceSettings } from "./_components/AppearanceSettings";
import { MaintenanceSettings } from "./_components/MaintenanceSettings";
import { CodeInjectionSettings } from "./_components/CodeInjectionSettings";
import { MediaSettings } from "./_components/MediaSettings";
import { SecuritySettings } from "./_components/SecuritySettings";
import { EmailSettings } from "./_components/EmailSettings";
import { PermalinkSettings } from "./_components/PermalinkSettings";
import { FeaturesSettings } from "./_components/FeaturesSettings";
import { EnvironmentStatus } from "./_components/EnvironmentStatus";
import { BillingSettings } from "./_components/BillingSettings";

// ── Schema ───────────────────────────────────────────────────────────
const settingsSchema = z.object({
  // General
  siteName: z.string().min(1, "Required").max(100).default("Soundloaded Blog"),
  tagline: z.string().max(300).default(""),
  siteUrl: z.string().url("Must be a valid URL").or(z.literal("")).default(""),
  contactEmail: z.string().email("Must be a valid email").or(z.literal("")).default(""),
  copyrightText: z.string().max(200).default(""),
  logoLight: z.string().nullable().default(null),
  logoDark: z.string().nullable().default(null),
  favicon: z.string().nullable().default(null),
  defaultOgImage: z.string().nullable().default(null),
  // SEO
  metaTitleTemplate: z.string().max(100).default("%s | Soundloaded Blog"),
  metaDescription: z.string().max(500).default(""),
  googleSiteVerification: z.string().max(100).default(""),
  bingSiteVerification: z.string().max(100).default(""),
  googleAnalyticsId: z.string().max(50).default(""),
  seoKeywords: z.string().max(500).default(""),
  // Social
  instagram: z.string().max(50).default(""),
  twitter: z.string().max(50).default(""),
  facebook: z.string().max(50).default(""),
  youtube: z.string().max(100).default(""),
  spotify: z.string().max(100).default(""),
  tiktok: z.string().max(50).default(""),
  appleMusic: z.string().max(100).default(""),
  telegram: z.string().max(50).default(""),
  whatsapp: z.string().max(20).default(""),
  // PWA
  pwaAppName: z.string().max(100).default("Soundloaded Blog"),
  pwaShortName: z.string().max(30).default("Soundloaded"),
  pwaThemeColor: z.string().default("#e11d48"),
  pwaBackgroundColor: z.string().default("#0a0a0a"),
  pwaDisplayMode: z.string().default("standalone"),
  pwaOrientation: z.string().default("any"),
  pwaIcons: z.array(z.record(z.string())).default([]),
  pwaSplashScreens: z.array(z.record(z.string())).default([]),
  pwaScreenshots: z.array(z.record(z.string())).default([]),
  // Notifications
  discordWebhookUrl: z.string().url().or(z.literal("")).default(""),
  notifyOnNewComment: z.boolean().default(true),
  notifyOnNewSubscriber: z.boolean().default(true),
  notifyOnNewMusicUpload: z.boolean().default(false),
  notifyOnPublish: z.boolean().default(false),
  emailNotificationsAdmin: z.boolean().default(true),
  // Social Auto-Sharing
  autoShareTwitter: z.boolean().default(false),
  autoShareTelegram: z.boolean().default(false),
  telegramBotToken: z.string().max(200).default(""),
  telegramChatId: z.string().max(100).default(""),
  // Content / Reading
  postsPerPage: z.number().int().min(1).max(100).default(20),
  feedItemCount: z.number().int().min(1).max(100).default(20),
  feedContentMode: z.string().default("excerpt"),
  searchEngineVisibility: z.boolean().default(true),
  defaultPostStatus: z.string().default("DRAFT"),
  enableDownloads: z.boolean().default(true),
  maxDownloadsPerHour: z.number().int().min(1).max(1000).default(10),
  // Permalinks
  permalinkStructure: z.string().min(1).max(200).default("/%postname%"),
  categoryBase: z.string().max(100).default("category"),
  // Discussion / Comments
  enableComments: z.boolean().default(true),
  autoApproveComments: z.boolean().default(false),
  requireLoginToComment: z.boolean().default(false),
  commentNestingDepth: z.number().int().min(1).max(5).default(2),
  commentsPerPage: z.number().int().min(5).max(100).default(20),
  commentOrder: z.string().default("oldest"),
  closeCommentsAfterDays: z.number().int().min(0).max(365).default(0),
  commentPreviouslyApproved: z.boolean().default(false),
  commentMaxLinks: z.number().int().min(0).max(100).default(2),
  emailOnNewComment: z.boolean().default(true),
  emailOnModeration: z.boolean().default(true),
  commentModerationKeywords: z.string().max(5000).default(""),
  commentBlocklist: z.string().max(5000).default(""),
  // Locale
  timezone: z.string().max(50).default("Africa/Lagos"),
  dateFormat: z.string().max(30).default("MMM d, yyyy"),
  timeFormat: z.string().max(20).default("h:mm a"),
  language: z.string().max(10).default("en"),
  // Maintenance
  maintenanceMode: z.boolean().default(false),
  maintenanceMessage: z.string().max(2000).default("We're upgrading. Be right back!"),
  maintenanceAllowedIPs: z.string().max(1000).default(""),
  // Code Injection
  headerScripts: z.string().max(20000).default(""),
  footerScripts: z.string().max(20000).default(""),
  // Media
  thumbnailSize: z.number().int().min(50).max(500).default(150),
  mediumImageSize: z.number().int().min(200).max(1200).default(600),
  largeImageSize: z.number().int().min(600).max(3000).default(1200),
  imageQuality: z.number().int().min(1).max(100).default(80),
  enableWatermark: z.boolean().default(false),
  watermarkImage: z.string().nullable().default(null),
  watermarkPosition: z.string().default("bottom-right"),
  // Security
  maxLoginAttempts: z.number().int().min(1).max(20).default(5),
  loginLockoutDuration: z.number().int().min(1).max(1440).default(15),
  requireStrongPasswords: z.boolean().default(true),
  allowRegistration: z.boolean().default(true),
  defaultUserRole: z.string().default("READER"),
  enableTurnstile: z.boolean().default(true),
  // Email
  emailFromName: z.string().max(100).default("Soundloaded Blog"),
  emailFromAddress: z.string().email().or(z.literal("")).default(""),
  emailWelcomeEnabled: z.boolean().default(true),
  emailDigestEnabled: z.boolean().default(false),
  emailDigestDay: z.string().default("monday"),
  // Appearance
  brandColor: z.string().default("#e11d48"),
  enableDarkMode: z.boolean().default(true),
  defaultTheme: z.string().default("dark"),
  customCss: z.string().max(10000).default(""),
  // Feature Toggles
  enableStories: z.boolean().default(true),
  storyExpiryHours: z.number().int().min(1).max(8760).default(24),
  enableFeed: z.boolean().default(true),
  enableExplore: z.boolean().default(true),
  enableMusic: z.boolean().default(true),
  enableNews: z.boolean().default(true),
  enableGist: z.boolean().default(true),
  enableLyrics: z.boolean().default(true),
  enableVideos: z.boolean().default(true),
  enableAlbums: z.boolean().default(true),
  enableArtists: z.boolean().default(true),
  enableSearch: z.boolean().default(true),
  // Feature Toggles — Landing Gate
  enableLandingGate: z.boolean().default(true),
  // Player Experience
  enableNowPlayingDrawer: z.boolean().default(true),
  // Billing & Monetization
  creatorRevenuePercent: z.number().int().min(0).max(100).default(70),
  enableCreatorMonetization: z.boolean().default(false),
  freeDownloadQuota: z.number().int().min(0).max(1000).default(5),
  paystackPublicKey: z.string().max(100).default(""),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

const SETTINGS_TABS = [
  { value: "general", label: "General", icon: Globe },
  { value: "seo", label: "SEO & Meta", icon: Search },
  { value: "social", label: "Social Links", icon: Share2 },
  { value: "content", label: "Content", icon: FileText },
  { value: "permalinks", label: "Permalinks", icon: Link2 },
  { value: "discussion", label: "Discussion", icon: MessageSquare },
  { value: "appearance", label: "Appearance", icon: Palette },
  { value: "media", label: "Media", icon: ImageIcon },
  { value: "pwa", label: "PWA", icon: Smartphone },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "security", label: "Security", icon: Shield },
  { value: "email", label: "Email", icon: Mail },
  { value: "maintenance", label: "Maintenance", icon: Construction },
  { value: "code-injection", label: "Code Injection", icon: Code },
  { value: "features", label: "Features", icon: ToggleRight },
  { value: "billing", label: "Billing", icon: CreditCard },
  { value: "environment", label: "Environment", icon: Server },
] as const;

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => adminApi.get("/api/admin/settings").then((r) => r.data),
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as Resolver<SettingsFormValues>,
    defaultValues: settingsSchema.parse({}) as SettingsFormValues,
  });

  // Populate form when server data arrives
  useEffect(() => {
    if (serverSettings) {
      form.reset(settingsSchema.parse(serverSettings));
    }
  }, [serverSettings, form]);

  const mutation = useMutation({
    mutationFn: (values: SettingsFormValues) =>
      adminApi.put("/api/admin/settings", values).then((r) => r.data),
    onSuccess: () => {
      toast.success("Settings saved!");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  function onSubmit(values: SettingsFormValues) {
    mutation.mutate(values);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
            <Settings className="text-brand h-5 w-5" />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-black">Settings</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">Site configuration & preferences</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="general" className="space-y-6">
            {/* Tab navigation — horizontal, scrollable on mobile */}
            <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto bg-transparent p-0">
              {SETTINGS_TABS.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="data-[state=active]:bg-brand/10 data-[state=active]:text-brand flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab content */}
            <div className="bg-card rounded-xl border p-6">
              <TabsContent value="general" className="mt-0">
                <GeneralSettings form={form} />
              </TabsContent>
              <TabsContent value="seo" className="mt-0">
                <SeoSettings form={form} />
              </TabsContent>
              <TabsContent value="social" className="mt-0">
                <SocialSettings form={form} />
              </TabsContent>
              <TabsContent value="content" className="mt-0">
                <ContentSettings form={form} />
              </TabsContent>
              <TabsContent value="permalinks" className="mt-0">
                <PermalinkSettings form={form} />
              </TabsContent>
              <TabsContent value="discussion" className="mt-0">
                <DiscussionSettings form={form} />
              </TabsContent>
              <TabsContent value="appearance" className="mt-0">
                <AppearanceSettings form={form} />
              </TabsContent>
              <TabsContent value="media" className="mt-0">
                <MediaSettings form={form} />
              </TabsContent>
              <TabsContent value="pwa" className="mt-0">
                <PwaSettings form={form} />
              </TabsContent>
              <TabsContent value="notifications" className="mt-0">
                <NotificationSettings form={form} />
              </TabsContent>
              <TabsContent value="security" className="mt-0">
                <SecuritySettings form={form} />
              </TabsContent>
              <TabsContent value="email" className="mt-0">
                <EmailSettings form={form} />
              </TabsContent>
              <TabsContent value="maintenance" className="mt-0">
                <MaintenanceSettings form={form} />
              </TabsContent>
              <TabsContent value="code-injection" className="mt-0">
                <CodeInjectionSettings form={form} />
              </TabsContent>
              <TabsContent value="features" className="mt-0">
                <FeaturesSettings form={form} />
              </TabsContent>
              <TabsContent value="billing" className="mt-0">
                <BillingSettings form={form} />
              </TabsContent>
              <TabsContent value="environment" className="mt-0">
                <EnvironmentStatus />
              </TabsContent>
            </div>
          </Tabs>

          {/* Sticky save button */}
          <div className="bg-background/80 sticky bottom-0 z-10 flex items-center gap-4 border-t py-4 backdrop-blur-sm">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-brand hover:bg-brand/90 text-brand-foreground gap-2"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {mutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
            {form.formState.isDirty && (
              <p className="text-muted-foreground text-xs">Unsaved changes</p>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
