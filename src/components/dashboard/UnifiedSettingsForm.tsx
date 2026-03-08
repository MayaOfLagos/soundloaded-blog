"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { useTheme } from "next-themes";
import { Loader2, Download, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { useUserProfile, useUserPreferences } from "@/hooks/useUserDashboard";
import {
  useUpdateProfile,
  useChangePassword,
  useDeleteAccount,
  useUpdatePreferences,
  useExportData,
} from "@/hooks/useUserMutations";

import { SettingsTabBar, SETTINGS_TABS } from "./SettingsTabBar";
import { AvatarUploadField } from "./AvatarUploadField";

// ── Schemas ──────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2).max(80),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  twitter: z.string().max(50).optional(),
  instagram: z.string().max(50).optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(8, "Min 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

// ── Helpers ──────────────────────────────────────────────────────────────

function SettingRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tab bar skeleton */}
      <div className="bg-muted flex w-fit gap-1 rounded-full p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="bg-card/50 ring-border/40 space-y-4 rounded-2xl p-6 ring-1 backdrop-blur-sm">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-1 h-4 w-60" />
        {Array.from({ length: 4 }).map((_, j) => (
          <div key={j} className="flex items-center justify-between py-3">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export function UnifiedSettingsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state — synced with ?tab= URL param
  const initialTab = SETTINGS_TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")!
    : "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = useCallback(
    (id: string) => {
      setActiveTab(id);
      const params = new URLSearchParams(searchParams.toString());
      if (id === "profile") {
        params.delete("tab");
      } else {
        params.set("tab", id);
      }
      const qs = params.toString();
      router.replace(`/settings${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams]
  );

  // ── Data hooks ──
  const { data: user, isLoading: profileLoading } = useUserProfile();
  const { data: preferences, isLoading: prefsLoading } = useUserPreferences();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();
  const updatePreferences = useUpdatePreferences();
  const exportData = useExportData();
  const { theme, setTheme } = useTheme();

  // ── Profile form (kept at top level so state persists across tab switches) ──
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", bio: "", location: "", twitter: "", instagram: "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const [deletePassword, setDeletePassword] = useState("");

  const handleAvatarUploaded = useCallback(
    (url: string) => {
      updateProfile.mutate({ image: url });
    },
    [updateProfile]
  );

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name ?? "",
        bio: user.bio ?? "",
        location: user.location ?? "",
        twitter: user.socialLinks?.twitter ?? "",
        instagram: user.socialLinks?.instagram ?? "",
      });
    }
  }, [user, profileForm]);

  // ── Handlers ──
  const onProfileSubmit = (values: ProfileValues) => {
    updateProfile.mutate({
      name: values.name,
      bio: values.bio,
      location: values.location,
      socialLinks: { twitter: values.twitter, instagram: values.instagram },
    });
  };

  const onPasswordSubmit = (values: PasswordValues) => {
    changePassword.mutate(values, { onSuccess: () => passwordForm.reset() });
  };

  const onDeleteAccount = () => {
    if (!deletePassword) return;
    deleteAccount.mutate(deletePassword);
  };

  const handlePrefUpdate = (key: string, value: boolean | string) => {
    updatePreferences.mutate({ [key]: value });
  };

  // ── Loading ──
  if (profileLoading || prefsLoading) {
    return <SettingsSkeleton />;
  }

  const initials =
    user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  // ── Tab content renderers ──

  const renderProfile = () => (
    <div className="space-y-5">
      {/* ── Avatar & Identity Card ── */}
      <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
        {/* Gradient banner */}
        <div className="from-brand/80 via-brand/60 h-24 bg-gradient-to-r to-pink-500/50" />
        <div className="px-5 pb-5">
          {/* Avatar overlapping the banner */}
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
            <Avatar className="ring-card h-20 w-20 shadow-lg ring-4">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
              <AvatarFallback className="bg-brand/15 text-brand text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 sm:pb-1">
              <h3 className="text-foreground truncate text-lg font-black">
                {user?.name ?? "User"}
              </h3>
              <p className="text-muted-foreground truncate text-sm">{user?.email}</p>
              {user?.location && (
                <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                  <MapPin className="h-3 w-3" />
                  {user.location}
                </p>
              )}
            </div>
          </div>

          {/* FilePond avatar uploader */}
          <div className="mt-4">
            <AvatarUploadField onUploaded={handleAvatarUploaded} />
          </div>
        </div>
      </div>

      {/* ── Edit Profile Form ── */}
      <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
        <div className="px-5 pt-5">
          <h2 className="text-foreground text-base font-bold">Edit Profile</h2>
          <p className="text-muted-foreground mt-1 text-xs">Update your personal details</p>
        </div>
        <div className="p-5">
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" placeholder="Your name" {...profileForm.register("name")} />
                {profileForm.formState.errors.name && (
                  <p className="text-destructive text-sm">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Lagos, Nigeria"
                  {...profileForm.register("location")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself"
                rows={3}
                {...profileForm.register("bio")}
              />
              {profileForm.formState.errors.bio && (
                <p className="text-destructive text-sm">
                  {profileForm.formState.errors.bio.message}
                </p>
              )}
            </div>

            <Separator />

            <div>
              <p className="mb-3 text-sm font-medium">Social Links</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="text-muted-foreground text-xs">
                    Twitter
                  </Label>
                  <Input
                    id="twitter"
                    placeholder="@username"
                    {...profileForm.register("twitter")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-muted-foreground text-xs">
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    placeholder="@username"
                    {...profileForm.register("instagram")}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-5">
      {/* Change Password */}
      <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
        <div className="px-5 pt-5">
          <h2 className="text-foreground text-base font-bold">Change Password</h2>
        </div>
        <div className="p-5">
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...passwordForm.register("currentPassword")}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-destructive text-sm">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-destructive text-sm">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...passwordForm.register("confirmPassword")}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-destructive text-sm">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl bg-red-500/5 ring-1 ring-red-500/30">
        <div className="px-5 pt-5">
          <h2 className="text-base font-bold text-red-600">Danger Zone</h2>
        </div>
        <div className="p-5">
          <p className="text-muted-foreground mb-4 text-sm">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, downloads, bookmarks, comments, and all
                  other data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="delete-password">Enter your password to confirm</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletePassword("")}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteAccount}
                  disabled={!deletePassword || deleteAccount.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteAccount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete My Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-5">
      <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
        <div className="px-5 pt-5">
          <h2 className="text-foreground text-base font-bold">Notifications</h2>
          <p className="text-muted-foreground mt-1 text-xs">Choose how you want to be notified</p>
        </div>
        <div className="p-5">
          <SettingRow
            label="Push Notifications"
            description="Receive push notifications in your browser"
            checked={preferences?.pushEnabled ?? false}
            onCheckedChange={(v) => handlePrefUpdate("pushEnabled", v)}
          />
          <Separator />
          <SettingRow
            label="Email Digest"
            description="Get a weekly summary of activity"
            checked={preferences?.emailDigest ?? false}
            onCheckedChange={(v) => handlePrefUpdate("emailDigest", v)}
          />
          <Separator />
          <SettingRow
            label="Comment Reply Emails"
            description="Get notified when someone replies to your comment"
            checked={preferences?.emailCommentReplies ?? false}
            onCheckedChange={(v) => handlePrefUpdate("emailCommentReplies", v)}
          />
          <Separator />
          <SettingRow
            label="New Music Alerts"
            description="Get notified when new music is posted"
            checked={preferences?.emailNewMusic ?? false}
            onCheckedChange={(v) => handlePrefUpdate("emailNewMusic", v)}
          />
        </div>
      </div>

      <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
        <div className="px-5 pt-5">
          <h2 className="text-foreground text-base font-bold">Email Preferences</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Manage your email subscription settings
          </p>
        </div>
        <div className="p-5">
          <SettingRow
            label="Newsletter"
            description="Receive our weekly newsletter with curated content"
            checked={preferences?.emailNewsletter ?? false}
            onCheckedChange={(v) => handlePrefUpdate("emailNewsletter", v)}
          />
          <Separator />
          <SettingRow
            label="Marketing Emails"
            description="Receive promotional emails and special offers"
            checked={preferences?.emailMarketing ?? false}
            onCheckedChange={(v) => handlePrefUpdate("emailMarketing", v)}
          />
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
      <div className="px-5 pt-5">
        <h2 className="text-foreground text-base font-bold">Privacy</h2>
        <p className="text-muted-foreground mt-1 text-xs">Control your profile visibility</p>
      </div>
      <div className="p-5">
        <SettingRow
          label="Show Profile Publicly"
          description="Allow other users to view your profile"
          checked={preferences?.showProfile ?? false}
          onCheckedChange={(v) => handlePrefUpdate("showProfile", v)}
        />
        <Separator />
        <SettingRow
          label="Show Download History"
          description="Display your download history on your public profile"
          checked={preferences?.showDownloadHistory ?? false}
          onCheckedChange={(v) => handlePrefUpdate("showDownloadHistory", v)}
        />
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
      <div className="px-5 pt-5">
        <h2 className="text-foreground text-base font-bold">Appearance</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Customize how Soundloaded looks for you
        </p>
      </div>
      <div className="p-5">
        <div className="py-3">
          <Label className="text-sm font-medium">Theme</Label>
          <p className="text-muted-foreground mb-3 text-xs">Select your preferred color scheme</p>
          <div className="flex gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTheme("light");
                handlePrefUpdate("theme", "light");
              }}
            >
              Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTheme("dark");
                handlePrefUpdate("theme", "dark");
              }}
            >
              Dark
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTheme("system");
                handlePrefUpdate("theme", "system");
              }}
            >
              System
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderData = () => (
    <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
      <div className="px-5 pt-5">
        <h2 className="text-foreground text-base font-bold">Data</h2>
        <p className="text-muted-foreground mt-1 text-xs">Manage your personal data</p>
      </div>
      <div className="p-5">
        <div className="py-3">
          <p className="text-sm font-medium">Export Your Data</p>
          <p className="text-muted-foreground mb-3 text-xs">Download a copy of all your data</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData.mutate()}
            disabled={exportData.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportData.isPending ? "Exporting..." : "Export Data"}
          </Button>
        </div>
      </div>
    </div>
  );

  const TAB_CONTENT: Record<string, () => React.JSX.Element> = {
    profile: renderProfile,
    security: renderSecurity,
    notifications: renderNotifications,
    privacy: renderPrivacy,
    appearance: renderAppearance,
    data: renderData,
  };

  return (
    <div className="space-y-6">
      <LayoutGroup>
        <SettingsTabBar activeTab={activeTab} onTabChange={handleTabChange} />
      </LayoutGroup>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {TAB_CONTENT[activeTab]?.()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
