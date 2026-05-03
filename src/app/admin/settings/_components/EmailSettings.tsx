"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

export function EmailSettings({ form }: Props) {
  const [sendingDigest, setSendingDigest] = useState(false);

  async function handleSendDigest() {
    setSendingDigest(true);
    try {
      const res = await fetch("/api/admin/newsletter/send-digest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (data.sent === 0) {
        toast(data.message ?? "Nothing to send");
      } else {
        toast.success(`Digest sent to ${data.sent} subscriber${data.sent !== 1 ? "s" : ""}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send digest");
    } finally {
      setSendingDigest(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">Email</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Configure outgoing email sender identity and automated emails
        </p>
      </div>
      <Separator />

      <h3 className="text-foreground text-sm font-semibold">Sender Identity</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="emailFromName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From Name</FormLabel>
              <FormControl>
                <Input placeholder="Soundloaded Blog" {...field} />
              </FormControl>
              <p className="text-muted-foreground text-xs">Sender name shown in email clients</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emailFromAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="hello@soundloaded.ng" {...field} />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                Sender email address (must be verified with your email provider)
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Automated Emails</h3>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="emailWelcomeEnabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-foreground text-sm font-medium">Welcome Email</FormLabel>
                <p className="text-muted-foreground text-xs">
                  Send a welcome email when a new user registers
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
          name="emailDigestEnabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-foreground text-sm font-medium">Weekly Digest</FormLabel>
                <p className="text-muted-foreground text-xs">
                  Send a weekly digest of new posts to newsletter subscribers
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("emailDigestEnabled") && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="emailDigestDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Digest Day</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                        "saturday",
                        "sunday",
                      ].map((day) => (
                        <SelectItem key={day} value={day}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    Day of the week to send the digest email
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border p-4">
              <p className="text-foreground mb-1 text-sm font-medium">Send Digest Now</p>
              <p className="text-muted-foreground mb-3 text-xs">
                Immediately send a digest of the last 7 days of posts to all confirmed subscribers
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sendingDigest}
                onClick={handleSendDigest}
                className="gap-2"
              >
                {sendingDigest ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {sendingDigest ? "Sending…" : "Send Digest Now"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
