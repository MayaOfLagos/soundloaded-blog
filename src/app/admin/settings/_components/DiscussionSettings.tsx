"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import type { SettingsFormValues } from "../page";

interface Props {
  form: UseFormReturn<SettingsFormValues>;
}

export function DiscussionSettings({ form }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">Discussion</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Configure how comments and discussions work on your site
        </p>
      </div>
      <Separator />

      <h3 className="text-foreground text-sm font-semibold">General</h3>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="enableComments"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-foreground text-sm font-medium">
                  Enable Comments
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  Allow readers to leave comments on posts
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
          name="requireLoginToComment"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-foreground text-sm font-medium">
                  Require Login to Comment
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  Only logged-in users can post comments (disables guest commenting)
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Display & Threading</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="commentOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment Order</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="newest">Newest first</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="commentsPerPage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comments Per Page</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">Paginate after this many (5-100)</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="commentNestingDepth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nesting Depth</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(parseInt(v))}
                value={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} level{n > 1 ? "s" : ""} deep
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">How many levels of threaded replies</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="closeCommentsAfterDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Auto-Close Comments After</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={365}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                Days after publishing (0 = never close)
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Before a Comment Appears</h3>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="autoApproveComments"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-foreground text-sm font-medium">
                  Auto-Approve Comments
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  Automatically approve comments without manual review
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
          name="commentPreviouslyApproved"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-foreground text-sm font-medium">
                  Require Previously Approved Comment
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  Comment author must have a previously approved comment before auto-approval
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Moderation</h3>

      <FormField
        control={form.control}
        name="commentMaxLinks"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max Links Before Moderation</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                max={100}
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <p className="text-muted-foreground text-xs">
              Hold comment for review if it contains this many or more links. Set to 0 to disable.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="commentModerationKeywords"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Moderation Keywords</FormLabel>
            <FormControl>
              <Textarea
                rows={4}
                placeholder={"spam\nbuy cheap\nclick here"}
                className="font-mono text-sm"
                {...field}
              />
            </FormControl>
            <p className="text-muted-foreground text-xs">
              One word or phrase per line. Comments containing these in content, name, email, or IP
              will be held for review.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="commentBlocklist"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Blocklist</FormLabel>
            <FormControl>
              <Textarea
                rows={4}
                placeholder={"spam@example.com\n192.168.1.1\nbadword"}
                className="font-mono text-sm"
                {...field}
              />
            </FormControl>
            <p className="text-muted-foreground text-xs">
              One entry per line. Comments matching these words, emails, or IPs will be
              automatically rejected.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Email Notifications</h3>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="emailOnNewComment"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-foreground text-sm font-medium">
                  Email on New Comment
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  Send an email when anyone posts a comment
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
          name="emailOnModeration"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-foreground text-sm font-medium">
                  Email on Moderation
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  Send an email when a comment is held for moderation
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
