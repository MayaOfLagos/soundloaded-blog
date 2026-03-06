"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

export function SeoSettings({ form }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">SEO & Meta</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Search engine optimization and meta tag configuration
        </p>
      </div>
      <Separator />

      <FormField
        control={form.control}
        name="metaTitleTemplate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title Template</FormLabel>
            <FormControl>
              <Input placeholder="%s | Soundloaded Blog" {...field} />
            </FormControl>
            <p className="text-muted-foreground text-xs">
              Use <code className="bg-muted rounded px-1">%s</code> as placeholder for the page
              title. E.g. &quot;My Post | Soundloaded Blog&quot;
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="metaDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default Meta Description</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="Nigeria's premier music blog..." {...field} />
            </FormControl>
            <p className="text-muted-foreground text-xs">
              Used when a page doesn&apos;t have its own description (max 500 chars)
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="seoKeywords"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SEO Keywords</FormLabel>
            <FormControl>
              <Input placeholder="Nigeria music, Afrobeats, free music download..." {...field} />
            </FormControl>
            <p className="text-muted-foreground text-xs">
              Comma-separated keywords for search engines
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Verification</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="googleSiteVerification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Google Site Verification</FormLabel>
              <FormControl>
                <Input placeholder="Verification code" className="font-mono text-sm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bingSiteVerification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bing Site Verification</FormLabel>
              <FormControl>
                <Input placeholder="Verification code" className="font-mono text-sm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="googleAnalyticsId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Google Analytics ID</FormLabel>
            <FormControl>
              <Input placeholder="G-XXXXXXXXXX" className="font-mono text-sm" {...field} />
            </FormControl>
            <p className="text-muted-foreground text-xs">
              Public tracking ID (safe to store here). The full GA script loads on the frontend.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
