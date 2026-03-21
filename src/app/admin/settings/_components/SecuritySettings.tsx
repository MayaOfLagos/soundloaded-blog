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

export function SecuritySettings({ form }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-base font-bold">Security</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Configure login protection, registration, and password policies
        </p>
      </div>
      <Separator />

      <h3 className="text-foreground text-sm font-semibold">Login Protection</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="maxLoginAttempts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Login Attempts</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                Lock account after this many failed attempts (1-20)
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="loginLockoutDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lockout Duration (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={1440}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 15)}
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                How long to lock out after max attempts (1-1440 min)
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="requireStrongPasswords"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-foreground text-sm font-medium">
                Require Strong Passwords
              </FormLabel>
              <p className="text-muted-foreground text-xs">
                Enforce minimum 8 characters with uppercase, lowercase, and number
              </p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <Separator />
      <h3 className="text-foreground text-sm font-semibold">Registration</h3>

      <FormField
        control={form.control}
        name="allowRegistration"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-foreground text-sm font-medium">
                Allow Public Registration
              </FormLabel>
              <p className="text-muted-foreground text-xs">
                When off, only admins can create new user accounts
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
        name="defaultUserRole"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default Role for New Users</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="READER">Reader (can comment)</SelectItem>
                <SelectItem value="CONTRIBUTOR">Contributor (can write drafts)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Role assigned to users who register on the site
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
