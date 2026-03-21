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

export function EmailSettings({ form }: Props) {
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
                <Input type="email" placeholder="hello@soundloadedblog.ng" {...field} />
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
        )}
      </div>
    </div>
  );
}
