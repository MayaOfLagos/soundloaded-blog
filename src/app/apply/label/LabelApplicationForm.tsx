"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { Loader2, Plus, X, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  creatorApplicationSchema,
  type CreatorApplicationFormValues,
} from "@/lib/validations/application";

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function LabelApplicationForm() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [proofUrls, setProofUrls] = useState<string[]>([""]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatorApplicationFormValues>({
    resolver: zodResolver(creatorApplicationSchema),
    defaultValues: {
      type: "LABEL",
      country: "Nigeria",
      socialLinks: {},
      proofUrls: [],
    },
  });

  const slugValue = watch("slug");

  async function onSubmit(data: CreatorApplicationFormValues) {
    try {
      const filteredProofs = proofUrls.filter((url) => url.trim() !== "");
      data.proofUrls = filteredProofs.length > 0 ? filteredProofs : null;

      await axios.post("/api/applications", data);
      setSubmitted(true);
      toast.success("Application submitted!");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        const msg =
          typeof err.response.data.error === "string"
            ? err.response.data.error
            : "Validation error";
        toast.error(msg);
      } else {
        toast.error("Failed to submit application");
      }
    }
  }

  if (submitted) {
    return (
      <div className="bg-card/50 ring-border/40 rounded-2xl p-8 text-center ring-1 backdrop-blur-sm">
        <CheckCircle2 className="text-brand mx-auto h-12 w-12" />
        <h2 className="text-foreground mt-4 text-lg font-semibold">Application Submitted!</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          We&apos;ll review your application and notify you once a decision is made.
        </p>
        <Button className="mt-6" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-card/50 ring-border/40 space-y-5 rounded-2xl p-6 ring-1 backdrop-blur-sm">
        <h2 className="text-foreground flex items-center gap-2 font-semibold">
          <Building2 className="text-brand h-4 w-4" />
          Label Info
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="displayName">Label Name *</Label>
          <Input
            id="displayName"
            placeholder="e.g. Mavin Records"
            {...register("displayName", {
              onChange: (e) => {
                if (!slugValue || slugValue === generateSlug(watch("displayName") ?? "")) {
                  setValue("slug", generateSlug(e.target.value));
                }
              },
            })}
          />
          {errors.displayName && (
            <p className="text-xs text-red-500">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">Profile URL Slug *</Label>
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <span>soundloaded.ng/labels/</span>
            <Input id="slug" placeholder="mavin-records" className="flex-1" {...register("slug")} />
          </div>
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="genre">Primary Genre</Label>
            <Input id="genre" placeholder="e.g. Afrobeats" {...register("genre")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <Input id="country" placeholder="Nigeria" {...register("country")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">About the Label</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about your record label..."
            rows={4}
            {...register("bio")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="photo">Logo URL</Label>
          <Input id="photo" placeholder="https://..." {...register("photo")} />
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-card/50 ring-border/40 space-y-4 rounded-2xl p-6 ring-1 backdrop-blur-sm">
        <h2 className="text-foreground font-semibold">Social & Web</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input placeholder="https://..." {...register("socialLinks.website")} />
          </div>
          <div className="space-y-1.5">
            <Label>Instagram</Label>
            <Input placeholder="@handle" {...register("socialLinks.instagram")} />
          </div>
          <div className="space-y-1.5">
            <Label>Twitter / X</Label>
            <Input placeholder="@handle" {...register("socialLinks.twitter")} />
          </div>
          <div className="space-y-1.5">
            <Label>Facebook</Label>
            <Input placeholder="Page URL or handle" {...register("socialLinks.facebook")} />
          </div>
          <div className="space-y-1.5">
            <Label>Spotify</Label>
            <Input placeholder="Label URL" {...register("socialLinks.spotify")} />
          </div>
          <div className="space-y-1.5">
            <Label>Apple Music</Label>
            <Input placeholder="Label URL" {...register("socialLinks.appleMusic")} />
          </div>
        </div>
      </div>

      {/* Proof URLs */}
      <div className="bg-card/50 ring-border/40 space-y-4 rounded-2xl p-6 ring-1 backdrop-blur-sm">
        <div>
          <h2 className="text-foreground font-semibold">Proof of Identity</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Add links that verify your label (website, social media, distribution profiles, etc.)
          </p>
        </div>
        <div className="space-y-2">
          {proofUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => {
                  const updated = [...proofUrls];
                  updated[i] = e.target.value;
                  setProofUrls(updated);
                }}
                placeholder="https://..."
              />
              {proofUrls.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setProofUrls(proofUrls.filter((_, j) => j !== i))}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {proofUrls.length < 5 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setProofUrls([...proofUrls, ""])}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3 w-3" />
              Add Link
            </Button>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand hover:bg-brand/90 w-full gap-2"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Application
      </Button>
    </form>
  );
}
