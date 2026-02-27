"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  Settings,
  Save,
  Loader2,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Globe,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

const SETTINGS_KEY = "soundloaded_site_settings";

const settingsSchema = z.object({
  siteName: z.string().min(2, "Site name required"),
  tagline: z.string().max(160).optional(),
  ogImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  siteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  youtube: z.string().optional(),
  spotify: z.string().optional(),
  discordWebhook: z.string().url("Must be a valid webhook URL").optional().or(z.literal("")),
  notifyOnNewComment: z.boolean(),
  notifyOnNewSubscriber: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const DEFAULT_SETTINGS: SettingsFormValues = {
  siteName: "Soundloaded Blog",
  tagline: "Nigeria's #1 music download & entertainment blog",
  ogImageUrl: "",
  siteUrl: "https://soundloadedblog.ng",
  instagram: "soundloadedng",
  twitter: "soundloadedng",
  facebook: "soundloadedng",
  youtube: "",
  spotify: "",
  discordWebhook: "",
  notifyOnNewComment: true,
  notifyOnNewSubscriber: true,
};

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as Resolver<SettingsFormValues>,
    defaultValues: DEFAULT_SETTINGS,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SettingsFormValues>;
        form.reset({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // ignore
    }
  }, [form]);

  async function onSubmit(values: SettingsFormValues) {
    setIsSaving(true);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(values));
      await new Promise((r) => setTimeout(r, 400));
      setLastSaved(new Date());
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
            <Settings className="text-brand h-5 w-5" />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-black">Settings</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : "Site configuration"}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Site Identity */}
          <section className="space-y-4">
            <div>
              <h2 className="text-foreground text-base font-bold">Site Identity</h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Basic information about your site
              </p>
            </div>
            <Separator />

            <FormField
              control={form.control}
              name="siteName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline</FormLabel>
                  <FormControl>
                    <Input placeholder="Nigeria's #1 music blog..." {...field} />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    Used in meta descriptions and the site header
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="siteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Globe className="mr-1.5 inline h-3.5 w-3.5" />
                    Site URL
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://soundloadedblog.ng" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ogImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default OG Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://cdn.soundloadedblog.ng/og-default.jpg" {...field} />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    1200x630px recommended for social sharing previews
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Social Links */}
          <section className="space-y-4">
            <div>
              <h2 className="text-foreground text-base font-bold">Social Links</h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Used in the site footer and JSON-LD schema
              </p>
            </div>
            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Instagram className="mr-1.5 inline h-3.5 w-3.5" />
                      Instagram handle
                    </FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="bg-muted border-input text-muted-foreground flex items-center rounded-l-md border border-r-0 px-3 text-sm">
                          @
                        </span>
                        <Input placeholder="soundloadedng" className="rounded-l-none" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Twitter className="mr-1.5 inline h-3.5 w-3.5" />X / Twitter handle
                    </FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="bg-muted border-input text-muted-foreground flex items-center rounded-l-md border border-r-0 px-3 text-sm">
                          @
                        </span>
                        <Input placeholder="soundloadedng" className="rounded-l-none" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Facebook className="mr-1.5 inline h-3.5 w-3.5" />
                      Facebook page
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="soundloadedng" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="youtube"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Youtube className="mr-1.5 inline h-3.5 w-3.5" />
                      YouTube channel
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="@soundloadedng" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Notifications */}
          <section className="space-y-4">
            <div>
              <h2 className="text-foreground text-base font-bold">Notifications</h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Discord webhook for admin alerts
              </p>
            </div>
            <Separator />

            <FormField
              control={form.control}
              name="discordWebhook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Bell className="mr-1.5 inline h-3.5 w-3.5" />
                    Discord Webhook URL
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://discord.com/api/webhooks/..."
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    Get notified in Discord for new comments, subscribers, and download spikes.
                    Create a webhook in your Discord server settings.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3">
              {[
                {
                  name: "notifyOnNewComment" as const,
                  label: "Notify on new comment (pending review)",
                },
                {
                  name: "notifyOnNewSubscriber" as const,
                  label: "Notify on new newsletter subscriber",
                },
              ].map(({ name, label }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value as boolean}
                          onChange={field.onChange}
                          className="border-input accent-brand h-4 w-4 rounded"
                        />
                      </FormControl>
                      <FormLabel className="text-foreground cursor-pointer text-sm font-normal">
                        {label}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </section>

          {/* Save */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-brand hover:bg-brand/90 text-brand-foreground gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
            <p className="text-muted-foreground mt-3 text-xs">
              Settings are saved to localStorage. A settings table will be added to the DB in a
              future update.
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
}
