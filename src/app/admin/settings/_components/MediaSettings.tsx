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

export function MediaSettings({ form }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">Media</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Configure image sizes, quality, and watermarking
        </p>
      </div>
      <Separator />

      <h3 className="text-foreground text-sm font-semibold">Image Sizes (px)</h3>
      <p className="text-muted-foreground text-xs">
        These define the maximum dimensions when generating image variants.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="thumbnailSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={50}
                  max={500}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 150)}
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">50-500px</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mediumImageSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medium</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={200}
                  max={1200}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 600)}
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">200-1200px</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="largeImageSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Large</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={600}
                  max={3000}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1200)}
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">600-3000px</p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="imageQuality"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Image Quality</FormLabel>
            <FormControl>
              <div className="flex items-center gap-3">
                <Input
                  type="range"
                  min={1}
                  max={100}
                  className="flex-1"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 80)}
                />
                <span className="text-foreground w-10 text-right text-sm font-medium">
                  {field.value}%
                </span>
              </div>
            </FormControl>
            <p className="text-muted-foreground text-xs">
              WebP/AVIF compression quality. Lower = smaller files, higher = better quality.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Watermark</h3>

      <FormField
        control={form.control}
        name="enableWatermark"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-foreground text-sm font-medium">
                Enable Watermark
              </FormLabel>
              <p className="text-muted-foreground text-xs">
                Overlay a watermark on uploaded images
              </p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {form.watch("enableWatermark") && (
        <FormField
          control={form.control}
          name="watermarkPosition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Watermark Position</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
