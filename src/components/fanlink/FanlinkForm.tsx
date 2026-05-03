"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CoverArtUpload } from "./CoverArtUpload";
import toast from "react-hot-toast";

const PLATFORMS = [
  { key: "soundloaded", label: "Soundloaded" },
  { key: "audiomack", label: "Audiomack" },
  { key: "boomplay", label: "Boomplay" },
  { key: "spotify", label: "Spotify" },
  { key: "apple music", label: "Apple Music" },
  { key: "youtube music", label: "YouTube Music" },
  { key: "youtube", label: "YouTube" },
  { key: "deezer", label: "Deezer" },
  { key: "tidal", label: "Tidal" },
  { key: "amazon music", label: "Amazon Music" },
  { key: "soundcloud", label: "SoundCloud" },
  { key: "tiktok", label: "TikTok" },
  { key: "custom", label: "Custom" },
];

type PlatformLink = {
  platform: string;
  url: string;
  label?: string;
  isEnabled: boolean;
  sortOrder: number;
};

type FormData = {
  slug: string;
  title: string;
  artistName: string;
  type: "SINGLE" | "ALBUM" | "EP" | "MIXTAPE";
  releaseDate: string;
  description: string;
  genre: string;
  coverArt: string;
  accentColor: string;
  pageTheme: "dark" | "light" | "auto";
  buttonStyle: "filled" | "outline" | "pill";
  platformLinks: PlatformLink[];
  emailCaptureEnabled: boolean;
  emailCapturePrompt: string;
  showSocialIcons: boolean;
  tipEnabled: boolean;
  tipLabel: string;
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
  abSplit: number;
  status: "DRAFT" | "PUBLISHED";
};

type Props = {
  initialData?: Partial<FormData> & { id?: string };
  artistName: string;
  mode?: "create" | "edit";
};

const STEPS = ["Core Info", "Platforms", "Fan Engagement", "Publish"];

const DEFAULT_FORM: FormData = {
  slug: "",
  title: "",
  artistName: "",
  type: "SINGLE",
  releaseDate: "",
  description: "",
  genre: "",
  coverArt: "",
  accentColor: "#e11d48",
  pageTheme: "dark",
  buttonStyle: "filled",
  platformLinks: [],
  emailCaptureEnabled: false,
  emailCapturePrompt: "Enter your email to unlock",
  showSocialIcons: true,
  tipEnabled: false,
  tipLabel: "Support this artist",
  preSaveEnabled: false,
  preSaveSpotifyUrl: "",
  preSaveAppleUrl: "",
  preSaveDeezerUrl: "",
  preSaveMessage: "Save this track before it drops!",
  fanGateEnabled: false,
  fanGateAction: "follow",
  fanGateSpotifyUrl: "",
  fanGateTwitterText: "",
  abEnabled: false,
  abSplit: 50,
  status: "DRAFT",
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export function FanlinkForm({ initialData, artistName, mode = "create" }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    ...DEFAULT_FORM,
    artistName,
    ...initialData,
  });
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const checkSlug = useCallback(
    async (slug: string) => {
      if (!slug || slug.length < 2) {
        setSlugAvailable(null);
        return;
      }
      setSlugChecking(true);
      try {
        const res = await fetch(
          `/api/fanlinks/check-slug?slug=${encodeURIComponent(slug)}${initialData?.id ? `&excludeId=${initialData.id}` : ""}`
        );
        const data = await res.json();
        setSlugAvailable(data.available);
      } catch {
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    },
    [initialData?.id]
  );

  const handleTitleChange = (title: string) => {
    update("title", title);
    if (mode === "create" && !form.slug) {
      const slug = slugify(title);
      update("slug", slug);
      checkSlug(slug);
    }
  };

  const handleSlugChange = (slug: string) => {
    const clean = slugify(slug);
    update("slug", clean);
    checkSlug(clean);
  };

  const addPlatform = (platform: string) => {
    if (form.platformLinks.find((l) => l.platform === platform)) return;
    const newLink: PlatformLink = {
      platform,
      url: "",
      label: "",
      isEnabled: true,
      sortOrder: form.platformLinks.length,
    };
    update("platformLinks", [...form.platformLinks, newLink]);
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

  const removePlatformLink = (idx: number) => {
    update(
      "platformLinks",
      form.platformLinks.filter((_, i) => i !== idx).map((l, i) => ({ ...l, sortOrder: i }))
    );
  };

  const handleSubmit = async (publish = false) => {
    setError("");
    setSaving(true);
    const payload = { ...form, status: publish ? "PUBLISHED" : form.status };

    try {
      const url =
        mode === "edit" && initialData?.id ? `/api/fanlinks/${initialData.id}` : "/api/fanlinks";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      toast.success(publish ? "Fanlink published!" : "Fanlink saved!");
      router.push("/dashboard/fanlinks");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all",
                i === step
                  ? "bg-brand text-white"
                  : i < step
                    ? "cursor-pointer bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </button>
            <span
              className={cn(
                "hidden text-[11px] font-medium sm:block",
                i === step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn("mx-1 h-px flex-1", i < step ? "bg-emerald-500/50" : "bg-border/50")}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-card/60 ring-border/40 space-y-5 rounded-2xl p-6 ring-1 backdrop-blur-sm">
        {/* Step 0: Core Info */}
        {step === 0 && (
          <>
            <h2 className="text-foreground text-lg font-bold">Core Info</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Song / Release Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Emotions"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(e) => update("type", e.target.value as FormData["type"])}
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

            <div className="space-y-1.5">
              <Label htmlFor="slug">
                Custom URL Slug *
                <span className="text-muted-foreground ml-1 text-xs font-normal">
                  soundloaded.ng/fanlink/
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="e.g. emotions-by-davido"
                  className={cn(
                    slugAvailable === true && "border-emerald-500/50",
                    slugAvailable === false && "border-red-500/50"
                  )}
                />
                <div className="absolute top-1/2 right-3 -translate-y-1/2 text-[11px] font-medium">
                  {slugChecking ? (
                    <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
                  ) : slugAvailable === true ? (
                    <span className="text-emerald-500">Available</span>
                  ) : slugAvailable === false ? (
                    <span className="text-red-500">Taken</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={form.genre}
                  onChange={(e) => update("genre", e.target.value)}
                  placeholder="Afrobeats"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="releaseDate">Release Date</Label>
                <Input
                  id="releaseDate"
                  type="date"
                  value={form.releaseDate}
                  onChange={(e) => update("releaseDate", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Short Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="A short note shown below the title on your fanlink page"
                rows={3}
                maxLength={500}
              />
              <p className="text-muted-foreground text-right text-[11px]">
                {form.description.length}/500
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Cover Art</Label>
              <p className="text-muted-foreground text-[11px]">
                Square image, min 500×500px recommended
              </p>
              <CoverArtUpload value={form.coverArt} onChange={(url) => update("coverArt", url)} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) => update("accentColor", e.target.value)}
                    className="border-border h-9 w-12 cursor-pointer rounded-md border bg-transparent p-0.5"
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
                  onChange={(e) => update("pageTheme", e.target.value as FormData["pageTheme"])}
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
                  onChange={(e) => update("buttonStyle", e.target.value as FormData["buttonStyle"])}
                  className="bg-input border-border text-foreground w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="filled">Filled</option>
                  <option value="outline">Outline</option>
                  <option value="pill">Pill</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Step 1: Platforms */}
        {step === 1 && (
          <>
            <h2 className="text-foreground text-lg font-bold">Streaming Platform Links</h2>
            <p className="text-muted-foreground text-sm">
              Add links in order of priority. Fans will see them in this order.
            </p>

            {/* Add platform buttons */}
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(({ key, label }) => {
                const added = form.platformLinks.some((l) => l.platform === key);
                return (
                  <button
                    key={key}
                    onClick={() => !added && addPlatform(key)}
                    disabled={added}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all",
                      added
                        ? "cursor-default border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                        : "border-border/60 text-muted-foreground hover:border-brand/50 hover:text-foreground hover:bg-brand/5"
                    )}
                  >
                    {added ? (
                      <Check className="mr-1 inline h-3 w-3" />
                    ) : (
                      <Plus className="mr-1 inline h-3 w-3" />
                    )}
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Platform link inputs */}
            <div className="space-y-3">
              {form.platformLinks.length === 0 && (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Select platforms above to add links
                </p>
              )}
              {form.platformLinks.map((link, idx) => (
                <div
                  key={`${link.platform}-${idx}`}
                  className="bg-muted/30 border-border/40 flex items-start gap-3 rounded-xl border p-3"
                >
                  <GripVertical className="text-muted-foreground/50 mt-2.5 h-4 w-4 flex-shrink-0" />
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
                      placeholder={`https://${link.platform}.com/...`}
                      type="url"
                    />
                    <Input
                      value={link.label}
                      onChange={(e) => updatePlatformLink(idx, "label", e.target.value)}
                      placeholder={`Custom button text (default: Listen on ${link.platform})`}
                    />
                  </div>
                  <button
                    onClick={() => removePlatformLink(idx)}
                    className="text-muted-foreground mt-1 flex-shrink-0 transition-colors hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Fan Engagement */}
        {step === 2 && (
          <>
            <h2 className="text-foreground text-lg font-bold">Fan Engagement & Monetization</h2>

            <div className="space-y-4">
              {/* Email capture */}
              <div className="bg-muted/20 border-border/40 space-y-3 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-semibold">Email Capture</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Ask fans for their email before showing links
                    </p>
                  </div>
                  <Switch
                    checked={form.emailCaptureEnabled}
                    onCheckedChange={(v) => update("emailCaptureEnabled", v)}
                  />
                </div>
                {form.emailCaptureEnabled && (
                  <div className="space-y-1.5">
                    <Label htmlFor="emailPrompt">Prompt Text</Label>
                    <Input
                      id="emailPrompt"
                      value={form.emailCapturePrompt}
                      onChange={(e) => update("emailCapturePrompt", e.target.value)}
                      placeholder="Enter your email to unlock"
                    />
                  </div>
                )}
              </div>

              {/* Social icons */}
              <div className="bg-muted/20 border-border/40 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-semibold">Show Social Icons</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Display your artist social links on the page
                    </p>
                  </div>
                  <Switch
                    checked={form.showSocialIcons}
                    onCheckedChange={(v) => update("showSocialIcons", v)}
                  />
                </div>
              </div>

              {/* Tip button */}
              <div className="bg-muted/20 border-border/40 space-y-3 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-semibold">Tip Button</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Allow fans to send you money via Paystack
                    </p>
                  </div>
                  <Switch
                    checked={form.tipEnabled}
                    onCheckedChange={(v) => update("tipEnabled", v)}
                  />
                </div>
                {form.tipEnabled && (
                  <div className="space-y-1.5">
                    <Label htmlFor="tipLabel">Button Label</Label>
                    <Input
                      id="tipLabel"
                      value={form.tipLabel}
                      onChange={(e) => update("tipLabel", e.target.value)}
                      placeholder="Support this artist"
                    />
                  </div>
                )}
              </div>

              {/* Pre-save */}
              <div className="bg-muted/20 border-border/40 space-y-3 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-semibold">Pre-Save Mode</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Collect pre-saves before your release date
                    </p>
                  </div>
                  <Switch
                    checked={form.preSaveEnabled}
                    onCheckedChange={(v) => update("preSaveEnabled", v)}
                  />
                </div>
                {form.preSaveEnabled && (
                  <div className="space-y-2.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="preSaveMessage">Banner Message</Label>
                      <Input
                        id="preSaveMessage"
                        value={form.preSaveMessage}
                        onChange={(e) => update("preSaveMessage", e.target.value)}
                        placeholder="Save this track before it drops!"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="preSaveSpotify">Spotify Pre-Save URL</Label>
                      <Input
                        id="preSaveSpotify"
                        value={form.preSaveSpotifyUrl}
                        onChange={(e) => update("preSaveSpotifyUrl", e.target.value)}
                        placeholder="https://distrokid.com/hyperfollow/..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="preSaveApple">Apple Music Pre-Add URL</Label>
                      <Input
                        id="preSaveApple"
                        value={form.preSaveAppleUrl}
                        onChange={(e) => update("preSaveAppleUrl", e.target.value)}
                        placeholder="https://music.apple.com/..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="preSaveDeezer">Deezer Pre-Save URL</Label>
                      <Input
                        id="preSaveDeezer"
                        value={form.preSaveDeezerUrl}
                        onChange={(e) => update("preSaveDeezerUrl", e.target.value)}
                        placeholder="https://www.deezer.com/..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* A/B Split */}
              <div className="bg-muted/20 border-border/40 space-y-3 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-semibold">A/B Split Test</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Split traffic between two page variants
                    </p>
                  </div>
                  <Switch
                    checked={form.abEnabled}
                    onCheckedChange={(v) => update("abEnabled", v)}
                  />
                </div>
                {form.abEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Variant B traffic</Label>
                      <span className="text-foreground text-sm font-bold tabular-nums">
                        {form.abSplit}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      step={5}
                      value={form.abSplit}
                      onChange={(e) => update("abSplit", parseInt(e.target.value, 10))}
                      className="accent-brand w-full"
                    />
                    <p className="text-muted-foreground text-xs">
                      {100 - form.abSplit}% → Variant A (original) &nbsp;·&nbsp; {form.abSplit}% →
                      Variant B
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Configure Variant B content in the edit page after saving.
                    </p>
                  </div>
                )}
              </div>

              {/* Fan-gate */}
              <div className="bg-muted/20 border-border/40 space-y-3 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-semibold">Social Fan-Gate</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Require a social action to unlock links
                    </p>
                  </div>
                  <Switch
                    checked={form.fanGateEnabled}
                    onCheckedChange={(v) => update("fanGateEnabled", v)}
                  />
                </div>
                {form.fanGateEnabled && (
                  <div className="space-y-2.5">
                    <div className="space-y-1.5">
                      <Label>Required Action</Label>
                      <div className="flex gap-2">
                        {(["follow", "share", "both"] as const).map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => update("fanGateAction", a)}
                            className={cn(
                              "flex-1 rounded-lg border py-1.5 text-xs font-semibold capitalize transition-all",
                              form.fanGateAction === a
                                ? "border-brand bg-brand/10 text-brand"
                                : "border-border/50 text-muted-foreground hover:border-brand/40"
                            )}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(form.fanGateAction === "follow" || form.fanGateAction === "both") && (
                      <div className="space-y-1.5">
                        <Label htmlFor="fanGateSpotify">Spotify Artist URL to Follow</Label>
                        <Input
                          id="fanGateSpotify"
                          value={form.fanGateSpotifyUrl}
                          onChange={(e) => update("fanGateSpotifyUrl", e.target.value)}
                          placeholder="https://open.spotify.com/artist/..."
                        />
                      </div>
                    )}
                    {(form.fanGateAction === "share" || form.fanGateAction === "both") && (
                      <div className="space-y-1.5">
                        <Label htmlFor="fanGateTwitter">Tweet Text (pre-filled)</Label>
                        <Input
                          id="fanGateTwitter"
                          value={form.fanGateTwitterText}
                          onChange={(e) => update("fanGateTwitterText", e.target.value)}
                          placeholder="Just pre-saved {title} by {artist}! 🔥"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Step 3: Publish */}
        {step === 3 && (
          <>
            <h2 className="text-foreground text-lg font-bold">Review & Publish</h2>

            <div className="bg-muted/20 border-border/40 space-y-3 rounded-xl border p-4">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">Title</span>
                <span className="text-foreground truncate font-medium">{form.title || "—"}</span>
                <span className="text-muted-foreground">Slug</span>
                <span className="text-foreground truncate font-mono text-xs">
                  /fanlink/{form.slug || "—"}
                </span>
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground">{form.type}</span>
                <span className="text-muted-foreground">Platforms</span>
                <span className="text-foreground">
                  {form.platformLinks.filter((l) => l.isEnabled && l.url).length} active links
                </span>
                <span className="text-muted-foreground">Email capture</span>
                <span className="text-foreground">{form.emailCaptureEnabled ? "On" : "Off"}</span>
                <span className="text-muted-foreground">Tip button</span>
                <span className="text-foreground">{form.tipEnabled ? "On" : "Off"}</span>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleSubmit(false)}
                disabled={saving}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save as Draft
              </Button>
              <Button
                className="bg-brand hover:bg-brand/90 flex-1"
                onClick={() => handleSubmit(true)}
                disabled={saving || !form.title || !form.slug || slugAvailable === false}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Publish Fanlink
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        {step < STEPS.length - 1 && (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && (!form.title || !form.slug || slugAvailable === false)}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
