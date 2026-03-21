"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PERMALINK_TAGS, getPostUrl, isValidPermalinkStructure } from "@/lib/urls";
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

const EXAMPLE_POST = {
  slug: "olamide-new-single-2026",
  id: "clx9abc123",
  publishedAt: new Date("2026-03-05T10:00:00Z"),
  category: { slug: "music-mp3" },
  author: { name: "Maya" },
};

export function PermalinkSettings({ form }: Props) {
  const currentStructure = form.watch("permalinkStructure");
  const currentBase = form.watch("categoryBase");
  const siteUrl = form.watch("siteUrl") || "https://soundloadedblog.ng";

  const previewUrl = getPostUrl(EXAMPLE_POST, currentStructure);
  const isValid = isValidPermalinkStructure(currentStructure);

  const insertTag = (tag: string) => {
    const current = form.getValues("permalinkStructure");
    const separator = current.endsWith("/") || current === "" ? "" : "/";
    form.setValue("permalinkStructure", current + separator + tag, {
      shouldDirty: true,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">Permalinks</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Customize how your post URLs are structured
        </p>
      </div>
      <Separator />

      <h3 className="text-foreground text-sm font-semibold">Custom Structure</h3>

      <FormField
        control={form.control}
        name="permalinkStructure"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Permalink Structure</FormLabel>
            <FormControl>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground shrink-0 text-sm">{siteUrl}</span>
                  <Input
                    {...field}
                    placeholder="/%category%/%postname%"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </FormControl>
            {!isValid && currentStructure && (
              <p className="text-brand text-xs">Structure must include %postname% or %post_id%</p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium">
          Available tags (click to insert):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PERMALINK_TAGS.map(({ tag, description }) => (
            <Button
              key={tag}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 font-mono text-xs"
              onClick={() => insertTag(tag)}
            >
              {tag}
              <span className="text-muted-foreground font-sans">{description}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-muted/50 rounded-lg border p-4">
        <p className="text-muted-foreground mb-1 text-xs font-medium">Preview</p>
        <p className="text-foreground truncate font-mono text-sm">
          {siteUrl}
          <span className="text-brand font-semibold">{previewUrl}</span>
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Example post: &quot;Olamide New Single 2026&quot; in category &quot;Music MP3&quot;
        </p>
      </div>

      <Separator />

      <h3 className="text-foreground text-sm font-semibold">Optional</h3>

      <FormField
        control={form.control}
        name="categoryBase"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category Base</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground shrink-0 text-sm">{siteUrl}/</span>
                <Input
                  {...field}
                  placeholder="category"
                  className="max-w-[200px] font-mono text-sm"
                />
                <span className="text-muted-foreground shrink-0 text-sm">/{"{category-slug}"}</span>
              </div>
            </FormControl>
            <p className="text-muted-foreground text-xs">
              The prefix for category archive pages. Example: setting this to &quot;topics&quot;
              makes category URLs like{" "}
              <code className="text-foreground">
                {siteUrl}/{currentBase || "category"}/music-mp3
              </code>
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
