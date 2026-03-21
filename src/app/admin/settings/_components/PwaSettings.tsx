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
import { Separator } from "@/components/ui/separator";
import { Smartphone } from "lucide-react";
import { ColorPickerField } from "./ColorPickerField";
import { ImageUploadField } from "./ImageUploadField";
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

export function PwaSettings({ form }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">PWA Settings</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Progressive Web App configuration for the install experience
        </p>
      </div>
      <Separator />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="pwaAppName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>App Name</FormLabel>
              <FormControl>
                <Input placeholder="Soundloaded Blog" {...field} />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                Full name shown in app stores and install prompts
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pwaShortName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Name</FormLabel>
              <FormControl>
                <Input placeholder="Soundloaded" maxLength={30} {...field} />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                Shown on the home screen (max 30 chars)
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ColorPickerField
          label="Theme Color"
          value={form.watch("pwaThemeColor")}
          onChange={(v) => form.setValue("pwaThemeColor", v, { shouldDirty: true })}
          hint="Browser toolbar and status bar color"
        />

        <ColorPickerField
          label="Background Color"
          value={form.watch("pwaBackgroundColor")}
          onChange={(v) => form.setValue("pwaBackgroundColor", v, { shouldDirty: true })}
          hint="Splash screen background color"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="pwaDisplayMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Mode</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="standalone">Standalone (recommended)</SelectItem>
                  <SelectItem value="fullscreen">Fullscreen</SelectItem>
                  <SelectItem value="minimal-ui">Minimal UI</SelectItem>
                  <SelectItem value="browser">Browser</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pwaOrientation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orientation</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                  <SelectItem value="portrait-primary">Portrait Primary</SelectItem>
                  <SelectItem value="landscape-primary">Landscape Primary</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">App Icon</h3>

      <ImageUploadField
        label="PWA App Icon"
        value={form.watch("pwaIcons")?.[0]?.src ?? null}
        onChange={(v) => {
          if (v) {
            form.setValue(
              "pwaIcons",
              [{ src: v, sizes: "512x512", type: "image/png", purpose: "any maskable" }],
              { shouldDirty: true }
            );
          } else {
            form.setValue("pwaIcons", [], { shouldDirty: true });
          }
        }}
        type="pwa-icon"
        hint="Upload a 512x512 PNG icon. Used for install prompts and home screen."
        acceptedFileTypes={["image/png"]}
        maxFileSize="1MB"
        previewWidth={128}
        previewHeight={128}
      />

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Splash Screen</h3>

      <ImageUploadField
        label="PWA Splash Screen"
        value={form.watch("pwaSplashScreens")?.[0]?.src ?? null}
        onChange={(v) => {
          if (v) {
            form.setValue("pwaSplashScreens", [{ src: v, sizes: "1242x2688" }], {
              shouldDirty: true,
            });
          } else {
            form.setValue("pwaSplashScreens", [], { shouldDirty: true });
          }
        }}
        type="pwa-splash"
        hint="Splash screen shown when the app launches. 1242x2688px recommended."
        acceptedFileTypes={["image/png", "image/jpeg"]}
        maxFileSize="5MB"
        previewWidth={120}
        previewHeight={260}
      />

      <div className="bg-muted/50 rounded-lg border p-4">
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <Smartphone className="h-3.5 w-3.5 shrink-0" />
          PWA settings are served via a dynamic manifest at{" "}
          <code className="bg-muted rounded px-1">/api/manifest</code>. Changes take effect on the
          next app install or browser refresh.
        </p>
      </div>
    </div>
  );
}
