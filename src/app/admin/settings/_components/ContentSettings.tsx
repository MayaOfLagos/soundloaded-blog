"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

export function ContentSettings({ form }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">Content & Reading</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Control how content is displayed, feeds, and search engine visibility
        </p>
      </div>
      <Separator />

      <h3 className="text-foreground text-sm font-semibold">Display</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="postsPerPage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Posts Per Page</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                Number of posts shown per page (1-100)
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultPostStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Post Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Status for new posts created by editors
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">RSS Feed</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="feedItemCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feed Items</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">Number of items in the RSS feed</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="feedContentMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feed Content</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="excerpt">Excerpt only</SelectItem>
                  <SelectItem value="full">Full content</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Show full article or just excerpt in RSS
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Locale</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                  <SelectItem value="Africa/Accra">Africa/Accra (GMT)</SelectItem>
                  <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                  <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                  <SelectItem value="Africa/Cairo">Africa/Cairo (EET)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ha">Hausa</SelectItem>
                  <SelectItem value="yo">Yoruba</SelectItem>
                  <SelectItem value="ig">Igbo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateFormat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date Format</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MMM d, yyyy">Mar 4, 2026</SelectItem>
                  <SelectItem value="d MMM yyyy">4 Mar 2026</SelectItem>
                  <SelectItem value="dd/MM/yyyy">04/03/2026</SelectItem>
                  <SelectItem value="MM/dd/yyyy">03/04/2026</SelectItem>
                  <SelectItem value="yyyy-MM-dd">2026-03-04</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timeFormat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Format</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="h:mm a">2:30 PM (12-hour)</SelectItem>
                  <SelectItem value="HH:mm">14:30 (24-hour)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Search Engines</h3>

      <FormField
        control={form.control}
        name="searchEngineVisibility"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-foreground text-sm font-medium">
                Search Engine Visibility
              </FormLabel>
              <p className="text-muted-foreground text-xs">
                When off, adds noindex to discourage search engines from indexing this site
              </p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Downloads</h3>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="enableDownloads"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-foreground text-sm font-medium">
                  Enable Music Downloads
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  Allow users to download music tracks
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxDownloadsPerHour"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Downloads Per Hour (Per IP)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                Rate limit for music downloads to prevent abuse (1-1000)
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
