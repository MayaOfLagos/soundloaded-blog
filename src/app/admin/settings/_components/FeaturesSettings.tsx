"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

const EXPIRY_PRESETS = [
  { label: "24 hours", value: "24" },
  { label: "48 hours", value: "48" },
  { label: "72 hours", value: "72" },
  { label: "1 week", value: "168" },
  { label: "30 days", value: "720" },
  { label: "1 year", value: "8760" },
  { label: "Custom", value: "custom" },
] as const;

const SECTION_TOGGLES = [
  {
    key: "enableFeed" as const,
    label: "Feed",
    description: "Community feed with posts and interactions",
  },
  {
    key: "enableExplore" as const,
    label: "Explore",
    description: "Discover trending content and new creators",
  },
  { key: "enableMusic" as const, label: "Music", description: "Music downloads and streaming" },
  { key: "enableNews" as const, label: "News", description: "Music news and articles" },
  { key: "enableGist" as const, label: "Gist", description: "Entertainment gist and gossip" },
  { key: "enableLyrics" as const, label: "Lyrics", description: "Song lyrics database" },
  { key: "enableVideos" as const, label: "Videos", description: "Music videos and visual content" },
  { key: "enableAlbums" as const, label: "Albums", description: "Album pages with tracklists" },
  {
    key: "enableArtists" as const,
    label: "Artists",
    description: "Artist profiles and discography",
  },
  { key: "enableSearch" as const, label: "Search", description: "Site-wide search functionality" },
] as const;

export function FeaturesSettings({ form }: Props) {
  const storiesEnabled = form.watch("enableStories");
  const currentHours = form.watch("storyExpiryHours");

  const matchedPreset = EXPIRY_PRESETS.find(
    (p) => p.value !== "custom" && Number(p.value) === currentHours
  );
  const [selectValue, setSelectValue] = useState<string>(
    matchedPreset ? matchedPreset.value : "custom"
  );
  const showCustomInput = selectValue === "custom";

  return (
    <div className="space-y-6">
      {/* Stories Section */}
      <div>
        <h2 className="text-foreground text-base font-bold">Stories</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Control the story feature and expiry duration
        </p>
      </div>
      <Separator />

      <FormField
        control={form.control}
        name="enableStories"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-foreground text-sm font-medium">Enable Stories</FormLabel>
              <p className="text-muted-foreground text-xs">
                Allow users to create and view stories
              </p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {storiesEnabled && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-foreground text-sm font-medium">Story Expiry Duration</label>
            <Select
              value={selectValue}
              onValueChange={(val) => {
                setSelectValue(val);
                if (val !== "custom") {
                  form.setValue("storyExpiryHours", Number(val), { shouldDirty: true });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              How long stories remain visible before they expire
            </p>
          </div>

          {showCustomInput && (
            <FormField
              control={form.control}
              name="storyExpiryHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Duration (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={8760}
                      placeholder="e.g. 6"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value) || 1)}
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    Enter a custom number of hours (1-8760)
                  </p>
                </FormItem>
              )}
            />
          )}
        </div>
      )}

      {/* Landing Gate */}
      <div className="pt-4">
        <h2 className="text-foreground text-base font-bold">Landing Gate</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Control whether visitors see the premium landing page before entering the site
        </p>
      </div>
      <Separator />

      <FormField
        control={form.control}
        name="enableLandingGate"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-foreground text-sm font-medium">
                Enable Landing Gate
              </FormLabel>
              <p className="text-muted-foreground text-xs">
                Show the premium landing page to first-time visitors before they enter the site.
                Disable to let everyone go straight to the blog.
              </p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Player Experience */}
      <div className="pt-4">
        <h2 className="text-foreground text-base font-bold">Player Experience</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Control the music player behavior on mobile devices
        </p>
      </div>
      <Separator />

      <FormField
        control={form.control}
        name="enableNowPlayingDrawer"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-foreground text-sm font-medium">
                Now Playing Drawer
              </FormLabel>
              <p className="text-muted-foreground text-xs">
                Full-screen Spotify-style slide-up panel when tapping the mini player on mobile.
                When disabled, the compact expanded player is shown instead.
              </p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Site Sections */}
      <div className="pt-4">
        <h2 className="text-foreground text-base font-bold">Site Sections</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Enable or disable individual sections of your site
        </p>
      </div>
      <Separator />

      <div className="space-y-3">
        {SECTION_TOGGLES.map(({ key, label, description }) => (
          <FormField
            key={key}
            control={form.control}
            name={key}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-foreground text-sm font-medium">{label}</FormLabel>
                  <p className="text-muted-foreground text-xs">{description}</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}
