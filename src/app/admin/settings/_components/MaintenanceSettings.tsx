"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

export function MaintenanceSettings({ form }: Props) {
  const isActive = form.watch("maintenanceMode");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">Maintenance Mode</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Take your site offline temporarily for updates or maintenance
        </p>
      </div>
      <Separator />

      {isActive && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Maintenance mode is currently ACTIVE. Non-admin visitors will see the maintenance page.
          </p>
        </div>
      )}

      <FormField
        control={form.control}
        name="maintenanceMode"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-foreground text-sm font-medium">
                Enable Maintenance Mode
              </FormLabel>
              <p className="text-muted-foreground text-xs">
                Show a maintenance page to all non-admin visitors
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
        name="maintenanceMessage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maintenance Message</FormLabel>
            <FormControl>
              <Textarea rows={4} placeholder="We're upgrading. Be right back!" {...field} />
            </FormControl>
            <p className="text-muted-foreground text-xs">
              Message displayed to visitors during maintenance
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="maintenanceAllowedIPs"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Allowed IP Addresses</FormLabel>
            <FormControl>
              <Input placeholder="e.g. 102.88.34.5, 197.210.65.1" {...field} />
            </FormControl>
            <p className="text-muted-foreground text-xs">
              Comma-separated IPs that bypass maintenance mode (admins always bypass)
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
