"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell } from "lucide-react";
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

export function NotificationSettings({ form }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">Notifications</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Configure how you get notified about site activity
        </p>
      </div>
      <Separator />

      <FormField
        control={form.control}
        name="discordWebhookUrl"
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
              Get notified in Discord for site events. Create a webhook in your Discord server
              settings.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Notification Triggers</h3>

      <div className="space-y-4">
        {[
          {
            name: "notifyOnNewComment" as const,
            label: "New comment (pending review)",
            description: "Get notified when a reader leaves a comment",
          },
          {
            name: "notifyOnNewSubscriber" as const,
            label: "New newsletter subscriber",
            description: "Get notified when someone subscribes to the newsletter",
          },
          {
            name: "notifyOnNewMusicUpload" as const,
            label: "New music upload",
            description: "Get notified when a new music track is uploaded",
          },
          {
            name: "emailNotificationsAdmin" as const,
            label: "Email notifications to admin",
            description: "Send email notifications for important events",
          },
        ].map(({ name, label, description }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-foreground text-sm font-medium">{label}</FormLabel>
                  <p className="text-muted-foreground text-xs">{description}</p>
                </div>
                <FormControl>
                  <Switch checked={field.value as boolean} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}
