"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Music,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

const SOCIAL_FIELDS = [
  {
    name: "instagram" as const,
    label: "Instagram",
    icon: Instagram,
    prefix: "@",
    placeholder: "soundloadedng",
  },
  {
    name: "twitter" as const,
    label: "X / Twitter",
    icon: Twitter,
    prefix: "@",
    placeholder: "soundloadedng",
  },
  {
    name: "facebook" as const,
    label: "Facebook",
    icon: Facebook,
    prefix: "fb.com/",
    placeholder: "soundloadedng",
  },
  {
    name: "youtube" as const,
    label: "YouTube",
    icon: Youtube,
    prefix: "@",
    placeholder: "soundloadedng",
  },
  {
    name: "tiktok" as const,
    label: "TikTok",
    icon: Music,
    prefix: "@",
    placeholder: "soundloadedng",
  },
  {
    name: "spotify" as const,
    label: "Spotify",
    icon: Music,
    prefix: "",
    placeholder: "Artist or playlist URL",
  },
  {
    name: "appleMusic" as const,
    label: "Apple Music",
    icon: Music,
    prefix: "",
    placeholder: "Artist or playlist URL",
  },
  {
    name: "telegram" as const,
    label: "Telegram",
    icon: Send,
    prefix: "@",
    placeholder: "soundloadedng",
  },
  {
    name: "whatsapp" as const,
    label: "WhatsApp",
    icon: Phone,
    prefix: "+",
    placeholder: "2348012345678",
  },
] as const;

export function SocialSettings({ form }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">Social Links</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Used in the site footer, sidebar, and JSON-LD structured data
        </p>
      </div>
      <Separator />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SOCIAL_FIELDS.map(({ name, label, icon: Icon, prefix, placeholder }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Icon className="mr-1.5 inline h-3.5 w-3.5" />
                  {label}
                </FormLabel>
                <FormControl>
                  {prefix ? (
                    <div className="flex">
                      <span className="bg-muted border-input text-muted-foreground flex items-center rounded-l-md border border-r-0 px-3 text-sm">
                        {prefix}
                      </span>
                      <Input placeholder={placeholder} className="rounded-l-none" {...field} />
                    </div>
                  ) : (
                    <Input placeholder={placeholder} {...field} />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>

      <div className="bg-muted/50 rounded-lg border p-4">
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <MessageCircle className="h-3.5 w-3.5 shrink-0" />
          Social links are displayed in the site footer and left sidebar. They&apos;re also used in
          JSON-LD structured data for better SEO.
        </p>
      </div>
    </div>
  );
}
