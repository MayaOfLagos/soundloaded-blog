"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ColorPickerField } from "./ColorPickerField";
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

export function AppearanceSettings({ form }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">Appearance</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Customize the look and feel of your site
        </p>
      </div>
      <Separator />

      <ColorPickerField
        label="Brand Color"
        value={form.watch("brandColor")}
        onChange={(v) => form.setValue("brandColor", v, { shouldDirty: true })}
        hint="Primary accent color used throughout the site"
      />

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Theme</h3>

      <FormField
        control={form.control}
        name="enableDarkMode"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-foreground text-sm font-medium">
                Enable Dark Mode
              </FormLabel>
              <p className="text-muted-foreground text-xs">
                Allow users to switch between light and dark themes
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
        name="defaultTheme"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default Theme</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System (auto)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              The theme shown to new visitors before they choose their own
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Custom CSS</h3>

      <FormField
        control={form.control}
        name="customCss"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Custom CSS</FormLabel>
            <FormControl>
              <Textarea
                rows={10}
                placeholder={`/* Custom styles */\n.my-class {\n  color: red;\n}`}
                className="font-mono text-sm"
                {...field}
              />
            </FormControl>
            <p className="text-muted-foreground text-xs">
              Advanced: inject custom CSS into every page. Max 10,000 characters.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
