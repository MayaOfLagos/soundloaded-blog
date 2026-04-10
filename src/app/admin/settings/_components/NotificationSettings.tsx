"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Send, Users } from "lucide-react";
import toast from "react-hot-toast";
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
      <Separator />
      <PushNotificationSender />
    </div>
  );
}

function PushNotificationSender() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/push/send")
      .then((r) => r.json())
      .then((d) => setSubscriberCount(d.subscriberCount ?? 0))
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          typeof data.error === "string" && data.error.length < 200
            ? data.error
            : "Failed to send notification"
        );
      toast.success(`Sent to ${data.sent} subscriber${data.sent !== 1 ? "s" : ""}`);
      setTitle("");
      setBody("");
      setUrl("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-foreground text-sm font-semibold">
            <Send className="mr-1.5 inline h-3.5 w-3.5" />
            Send Push Notification
          </h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Send a notification to all subscribed users
          </p>
        </div>
        {subscriberCount !== null && (
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            {subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <label className="text-foreground mb-1 block text-xs font-medium">Title</label>
          <Input
            placeholder="New music alert!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>
        <div>
          <label className="text-foreground mb-1 block text-xs font-medium">Body</label>
          <Input
            placeholder="Check out the latest drop from..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={300}
          />
        </div>
        <div>
          <label className="text-foreground mb-1 block text-xs font-medium">Link URL</label>
          <Input placeholder="/" value={url} onChange={(e) => setUrl(e.target.value)} />
          <p className="text-muted-foreground mt-1 text-[11px]">
            Where the user lands when they tap the notification
          </p>
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending..." : "Send Notification"}
        </button>
      </div>
    </div>
  );
}
