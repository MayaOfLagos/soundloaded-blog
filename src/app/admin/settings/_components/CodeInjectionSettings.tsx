"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

export function CodeInjectionSettings({ form }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">Code Injection</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Add custom scripts to the head or footer of every page. Useful for analytics, chat
          widgets, fonts, and tracking pixels.
        </p>
      </div>
      <Separator />

      <FormField
        control={form.control}
        name="headerScripts"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Header Scripts</FormLabel>
            <FormControl>
              <Textarea
                rows={8}
                placeholder={
                  '<!-- Injected into <head> -->\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>'
                }
                className="font-mono text-sm"
                {...field}
              />
            </FormControl>
            <p className="text-muted-foreground text-xs">
              HTML/scripts injected into the &lt;head&gt; tag. Max 20,000 characters.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="footerScripts"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Footer Scripts</FormLabel>
            <FormControl>
              <Textarea
                rows={8}
                placeholder={
                  "<!-- Injected before </body> -->\n<script>// Chat widget, tracking pixel, etc.</script>"
                }
                className="font-mono text-sm"
                {...field}
              />
            </FormControl>
            <p className="text-muted-foreground text-xs">
              HTML/scripts injected before the closing &lt;/body&gt; tag. Max 20,000 characters.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
