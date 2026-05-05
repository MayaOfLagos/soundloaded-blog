"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Trash2, ShieldAlert, ShieldCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FanlinkAnalytics } from "./FanlinkAnalytics";
import type { PlatformLink } from "./FanlinkLandingPage";

type ClicksByGroup = {
  platform?: string | null;
  device?: string | null;
  country?: string | null;
  variant?: string | null;
  _count: { id: number };
}[];

type FanlinkAdmin = {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  type: "SINGLE" | "ALBUM" | "EP" | "MIXTAPE";
  releaseDate: string;
  description: string;
  genre: string;
  coverArt: string;
  bgColor: string;
  accentColor: string;
  buttonStyle: "filled" | "outline" | "pill";
  pageTheme: "dark" | "light" | "auto";
  platformLinks: PlatformLink[];
  emailCaptureEnabled: boolean;
  emailCapturePrompt: string;
  showSocialIcons: boolean;
  tipEnabled: boolean;
  tipLabel: string;
  tipAmounts: number[];
  merchUrl: string;
  merchLabel: string;
  metaPixelId: string;
  gaId: string;
  ogImage: string;
  preSaveEnabled: boolean;
  preSaveSpotifyUrl: string;
  preSaveAppleUrl: string;
  preSaveDeezerUrl: string;
  preSaveMessage: string;
  fanGateEnabled: boolean;
  fanGateAction: "follow" | "share" | "both";
  fanGateSpotifyUrl: string;
  fanGateTwitterText: string;
  abEnabled: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED";
  adminNotes: string;
  totalClicks: number;
  uniqueVisitors: number;
  artist: { id: string; name: string; slug: string };
  createdBy: { id: string; name: string; email: string };
  counts: { clicks: number; emails: number; tips: number };
  createdAt: string;
  updatedAt: string;
};

type Props = {
  fanlink: FanlinkAdmin;
  clicksByPlatform: ClicksByGroup;
  clicksByDevice: ClicksByGroup;
  clicksByCountry: ClicksByGroup;
  clicksByVariant: ClicksByGroup;
};

const TABS = ["Edit", "Analytics"] as const;

export function AdminFanlinkEditor({
  fanlink,
  clicksByPlatform,
  clicksByDevice,
  clicksByCountry,
  clicksByVariant,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Edit");
  const [form, setForm] = useState<FanlinkAdmin>(fanlink);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = <K extends keyof FanlinkAdmin>(key: K, value: FanlinkAdmin[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess("");
  };

  const updatePlatformLink = (
    idx: number,
    field: keyof PlatformLink,
    value: string | boolean | number
  ) => {
    const links = [...form.platformLinks];
    (links[idx] as Record<string, unknown>)[field] = value;
    update("platformLinks", links);
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/fanlinks/${fanlink.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          title: form.title,
          artistName: form.artistName,
          type: form.type,
          releaseDate: form.releaseDate ? new Date(form.releaseDate).toISOString() : null,
          description: form.description || null,
          genre: form.genre || null,
          coverArt: form.coverArt || null,
          bgColor: form.bgColor || null,
          accentColor: form.accentColor || null,
          buttonStyle: form.buttonStyle,
          pageTheme: form.pageTheme,
          platformLinks: form.platformLinks,
          emailCaptureEnabled: form.emailCaptureEnabled,
          emailCapturePrompt: form.emailCapturePrompt,
          showSocialIcons: form.showSocialIcons,
          tipEnabled: form.tipEnabled,
          tipLabel: form.tipLabel,
          tipAmounts: form.tipAmounts,
          merchUrl: form.merchUrl || null,
          merchLabel: form.merchLabel || null,
          metaPixelId: form.metaPixelId || null,
          gaId: form.gaId || null,
          ogImage: form.ogImage || null,
          preSaveEnabled: form.preSaveEnabled,
          preSaveSpotifyUrl: form.preSaveSpotifyUrl || null,
          preSaveAppleUrl: form.preSaveAppleUrl || null,
          preSaveDeezerUrl: form.preSaveDeezerUrl || null,
          preSaveMessage: form.preSaveMessage,
          fanGateEnabled: form.fanGateEnabled,
          fanGateAction: form.fanGateAction,
          fanGateSpotifyUrl: form.fanGateSpotifyUrl || null,
          fanGateTwitterText: form.fanGateTwitterText || null,
          status: form.status,
          adminNotes: form.adminNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setSuccess("Saved successfully");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete "${fanlink.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/fanlinks/${fanlink.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/fanlinks");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  };

  const toggleSuspend = async () => {
    const newStatus = form.status === "SUSPENDED" ? "DRAFT" : "SUSPENDED";
    update("status", newStatus);
  };

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="bg-muted/30 flex w-fit gap-1 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Analytics" && (
        <div className="space-y-4">
          {fanlink.counts.emails > 0 && (
            <div className="flex justify-end">
              <Button asChild variant="outline" size="sm">
                <a href={`/api/admin/fanlinks/${fanlink.id}/emails`} download>
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Export Emails ({fanlink.counts.emails})
                </a>
              </Button>
            </div>
          )}
          <FanlinkAnalytics
            fanlink={{
              title: fanlink.title,
              totalClicks: fanlink.totalClicks,
              uniqueVisitors: fanlink.uniqueVisitors,
              abEnabled: fanlink.abEnabled,
            }}
            clicksByPlatform={clicksByPlatform}
            clicksByDevice={clicksByDevice}
            clicksByCountry={clicksByCountry}
            clicksByVariant={clicksByVariant}
            emailCount={fanlink.counts.emails}
          />
        </div>
      )}

      {activeTab === "Edit" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* Main form */}
          <div className="bg-card/60 ring-border/40 space-y-5 rounded-2xl p-6 ring-1 backdrop-blur-sm">
            <h2 className="text-foreground text-base font-bold">Fanlink Details</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="a-title">Title</Label>
                <Input
                  id="a-title"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-artistName">Artist Name</Label>
                <Input
                  id="a-artistName"
                  value={form.artistName}
                  onChange={(e) => update("artistName", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="a-slug">Slug</Label>
                <Input
                  id="a-slug"
                  value={form.slug}
                  onChange={(e) =>
                    update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-type">Type</Label>
                <select
                  id="a-type"
                  value={form.type}
                  onChange={(e) => update("type", e.target.value as FanlinkAdmin["type"])}
                  className="bg-input border-border text-foreground w-full rounded-md border px-3 py-2 text-sm"
                >
                  {["SINGLE", "ALBUM", "EP", "MIXTAPE"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="a-genre">Genre</Label>
                <Input
                  id="a-genre"
                  value={form.genre}
                  onChange={(e) => update("genre", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-releaseDate">Release Date</Label>
                <Input
                  id="a-releaseDate"
                  type="date"
                  value={form.releaseDate}
                  onChange={(e) => update("releaseDate", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="a-description">Description</Label>
              <Textarea
                id="a-description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="a-coverArt">Cover Art URL</Label>
              <Input
                id="a-coverArt"
                value={form.coverArt}
                onChange={(e) => update("coverArt", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) => update("accentColor", e.target.value)}
                    className="border-border h-9 w-10 cursor-pointer rounded border bg-transparent p-0.5"
                  />
                  <Input
                    value={form.accentColor}
                    onChange={(e) => update("accentColor", e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Theme</Label>
                <select
                  value={form.pageTheme}
                  onChange={(e) => update("pageTheme", e.target.value as FanlinkAdmin["pageTheme"])}
                  className="bg-input border-border text-foreground w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Button Style</Label>
                <select
                  value={form.buttonStyle}
                  onChange={(e) =>
                    update("buttonStyle", e.target.value as FanlinkAdmin["buttonStyle"])
                  }
                  className="bg-input border-border text-foreground w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="filled">Filled</option>
                  <option value="outline">Outline</option>
                  <option value="pill">Pill</option>
                </select>
              </div>
            </div>

            {/* Platform links */}
            <div className="space-y-3">
              <Label>Platform Links</Label>
              {form.platformLinks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No platform links.</p>
              ) : (
                form.platformLinks.map((link, idx) => (
                  <div
                    key={`${link.platform}-${idx}`}
                    className="bg-muted/30 border-border/40 flex items-start gap-3 rounded-xl border p-3"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground text-sm font-semibold capitalize">
                          {link.platform}
                        </span>
                        <Switch
                          checked={link.isEnabled}
                          onCheckedChange={(v) => updatePlatformLink(idx, "isEnabled", v)}
                        />
                      </div>
                      <Input
                        value={link.url}
                        onChange={(e) => updatePlatformLink(idx, "url", e.target.value)}
                        placeholder="https://..."
                        type="url"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Advanced (Phase 2 fields) */}
            <div className="border-border/40 grid grid-cols-1 gap-4 border-t pt-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="a-metaPixel">Meta Pixel ID</Label>
                <Input
                  id="a-metaPixel"
                  value={form.metaPixelId}
                  onChange={(e) => update("metaPixelId", e.target.value)}
                  placeholder="e.g. 123456789"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-gaId">Google Analytics ID</Label>
                <Input
                  id="a-gaId"
                  value={form.gaId}
                  onChange={(e) => update("gaId", e.target.value)}
                  placeholder="e.g. G-XXXXXXXXXX"
                />
              </div>
            </div>

            {/* Pre-save */}
            <div className="border-border/40 space-y-3 border-t pt-2">
              <div className="flex items-center justify-between">
                <Label>Pre-Save Mode</Label>
                <Switch
                  checked={form.preSaveEnabled}
                  onCheckedChange={(v) => update("preSaveEnabled", v)}
                />
              </div>
              {form.preSaveEnabled && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="a-preSaveMsg">Banner Message</Label>
                    <Input
                      id="a-preSaveMsg"
                      value={form.preSaveMessage}
                      onChange={(e) => update("preSaveMessage", e.target.value)}
                      placeholder="Save this track before it drops!"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="a-preSaveSpotify">Spotify Pre-Save URL</Label>
                    <Input
                      id="a-preSaveSpotify"
                      value={form.preSaveSpotifyUrl}
                      onChange={(e) => update("preSaveSpotifyUrl", e.target.value)}
                      placeholder="https://distrokid.com/..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="a-preSaveApple">Apple Music URL</Label>
                    <Input
                      id="a-preSaveApple"
                      value={form.preSaveAppleUrl}
                      onChange={(e) => update("preSaveAppleUrl", e.target.value)}
                      placeholder="https://music.apple.com/..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="a-preSaveDeezer">Deezer Pre-Save URL</Label>
                    <Input
                      id="a-preSaveDeezer"
                      value={form.preSaveDeezerUrl}
                      onChange={(e) => update("preSaveDeezerUrl", e.target.value)}
                      placeholder="https://www.deezer.com/..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Fan-gate */}
            <div className="border-border/40 space-y-3 border-t pt-2">
              <div className="flex items-center justify-between">
                <Label>Social Fan-Gate</Label>
                <Switch
                  checked={form.fanGateEnabled}
                  onCheckedChange={(v) => update("fanGateEnabled", v)}
                />
              </div>
              {form.fanGateEnabled && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Required Action</Label>
                    <select
                      value={form.fanGateAction}
                      onChange={(e) =>
                        update("fanGateAction", e.target.value as FanlinkAdmin["fanGateAction"])
                      }
                      className="bg-input border-border text-foreground w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="follow">Follow on Spotify</option>
                      <option value="share">Share on Twitter/X</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  {(form.fanGateAction === "follow" || form.fanGateAction === "both") && (
                    <div className="space-y-1.5">
                      <Label htmlFor="a-fanGateSpotify">Spotify Artist URL</Label>
                      <Input
                        id="a-fanGateSpotify"
                        value={form.fanGateSpotifyUrl}
                        onChange={(e) => update("fanGateSpotifyUrl", e.target.value)}
                        placeholder="https://open.spotify.com/artist/..."
                      />
                    </div>
                  )}
                  {(form.fanGateAction === "share" || form.fanGateAction === "both") && (
                    <div className="space-y-1.5">
                      <Label htmlFor="a-fanGateTwitter">Tweet Text</Label>
                      <Input
                        id="a-fanGateTwitter"
                        value={form.fanGateTwitterText}
                        onChange={(e) => update("fanGateTwitterText", e.target.value)}
                        placeholder="Just pre-saved {title}..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
                {success}
              </p>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Status + Admin controls */}
            <div className="bg-card/60 ring-border/40 space-y-4 rounded-2xl p-5 ring-1 backdrop-blur-sm">
              <h3 className="text-foreground text-sm font-bold">Admin Controls</h3>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value as FanlinkAdmin["status"])}
                  className="bg-input border-border text-foreground w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="a-adminNotes">Admin Notes</Label>
                <Textarea
                  id="a-adminNotes"
                  value={form.adminNotes}
                  onChange={(e) => update("adminNotes", e.target.value)}
                  rows={4}
                  placeholder="Internal notes — not visible to creator"
                />
              </div>

              <div className="border-border/40 flex flex-col gap-2 border-t pt-2">
                <Button
                  variant="outline"
                  className={
                    form.status === "SUSPENDED"
                      ? "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                      : "border-red-500/30 text-red-500 hover:bg-red-500/10"
                  }
                  onClick={toggleSuspend}
                >
                  {form.status === "SUSPENDED" ? (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" /> Unsuspend
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="mr-2 h-4 w-4" /> Suspend
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:bg-red-500/10"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete Fanlink
                </Button>
              </div>
            </div>

            {/* Creator info */}
            <div className="bg-card/60 ring-border/40 space-y-3 rounded-2xl p-5 ring-1 backdrop-blur-sm">
              <h3 className="text-foreground text-sm font-bold">Creator</h3>
              <div className="space-y-1 text-sm">
                <p className="text-foreground font-medium">{fanlink.createdBy.name}</p>
                <p className="text-muted-foreground text-xs">{fanlink.createdBy.email}</p>
                <p className="text-muted-foreground text-xs">Artist: {fanlink.artist.name}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-card/60 ring-border/40 text-muted-foreground space-y-2 rounded-2xl p-5 text-xs ring-1 backdrop-blur-sm">
              <div className="flex justify-between">
                <span>Created</span>
                <span>{new Date(fanlink.createdAt).toLocaleDateString("en-GB")}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>{new Date(fanlink.updatedAt).toLocaleDateString("en-GB")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
