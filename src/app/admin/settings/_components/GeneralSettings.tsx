"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Globe, Mail } from "lucide-react";
import { ImageUploadField } from "./ImageUploadField";
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

export function GeneralSettings({ form }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">Site Identity</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">Basic information about your site</p>
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
              Used in meta descriptions and the site header (max 300 chars)
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Mail className="mr-1.5 inline h-3.5 w-3.5" />
                Contact Email
              </FormLabel>
              <FormControl>
                <Input placeholder="hello@soundloaded.ng" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="copyrightText"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Copyright Text</FormLabel>
            <FormControl>
              <Input placeholder="Soundloaded Nigeria. All rights reserved." {...field} />
            </FormControl>
            <p className="text-muted-foreground text-xs">Shown in the site footer</p>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Branding</h3>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ImageUploadField
          label="Logo (Light Mode)"
          value={form.watch("logoLight") ?? null}
          onChange={(v) => form.setValue("logoLight", v, { shouldDirty: true })}
          type="logo-light"
          hint="Shown on light backgrounds. SVG or PNG, max 2MB."
          previewWidth={180}
          previewHeight={60}
        />

        <ImageUploadField
          label="Logo (Dark Mode)"
          value={form.watch("logoDark") ?? null}
          onChange={(v) => form.setValue("logoDark", v, { shouldDirty: true })}
          type="logo-dark"
          hint="Shown on dark backgrounds. SVG or PNG, max 2MB."
          previewWidth={180}
          previewHeight={60}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ImageUploadField
          label="Favicon"
          value={form.watch("favicon") ?? null}
          onChange={(v) => form.setValue("favicon", v, { shouldDirty: true })}
          type="favicon"
          hint="Browser tab icon. PNG 32x32 or 64x64."
          acceptedFileTypes={["image/png", "image/x-icon", "image/vnd.microsoft.icon"]}
          previewWidth={64}
          previewHeight={64}
        />

        <ImageUploadField
          label="Default OG Image"
          value={form.watch("defaultOgImage") ?? null}
          onChange={(v) => form.setValue("defaultOgImage", v, { shouldDirty: true })}
          type="og-image"
          hint="Social sharing preview. 1200x630px recommended."
          maxFileSize="5MB"
          previewWidth={240}
          previewHeight={126}
        />
      </div>
    </div>
  );
}
