"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import { Loader2, User, Globe, Share2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ArtistData {
  id: string;
  name: string;
  bio: string | null;
  photo: string | null;
  coverImage: string | null;
  country: string | null;
  genre: string | null;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  spotify: string | null;
  appleMusic: string | null;
}

interface FormValues {
  name: string;
  bio: string;
  photo: string;
  coverImage: string;
  country: string;
  genre: string;
  instagram: string;
  twitter: string;
  facebook: string;
  spotify: string;
  appleMusic: string;
}

interface ArtistProfileEditorProps {
  artist: ArtistData;
}

export function ArtistProfileEditor({ artist }: ArtistProfileEditorProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: artist.name || "",
      bio: artist.bio || "",
      photo: artist.photo || "",
      coverImage: artist.coverImage || "",
      country: artist.country || "",
      genre: artist.genre || "",
      instagram: artist.instagram || "",
      twitter: artist.twitter || "",
      facebook: artist.facebook || "",
      spotify: artist.spotify || "",
      appleMusic: artist.appleMusic || "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      await axios.put("/api/artist/profile", data);
      toast.success("Profile updated successfully");
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to update profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-card/50 ring-border/40 rounded-2xl p-5 ring-1 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <User className="text-brand h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold">Basic Information</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Artist Name *</Label>
            <Input
              id="name"
              {...register("name", { required: "Artist name is required" })}
              placeholder="Your artist name"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Input id="genre" {...register("genre")} placeholder="e.g. Afrobeats" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...register("country")} placeholder="e.g. Nigeria" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              placeholder="Tell fans about yourself..."
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-card/50 ring-border/40 rounded-2xl p-5 ring-1 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="text-brand h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold">Images</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="photo">Profile Photo URL</Label>
            <Input id="photo" {...register("photo")} placeholder="https://..." />
            {artist.photo && (
              <div className="mt-2">
                <Image
                  src={artist.photo}
                  alt="Current photo"
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-xl object-cover"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image URL</Label>
            <Input id="coverImage" {...register("coverImage")} placeholder="https://..." />
            {artist.coverImage && (
              <div className="mt-2">
                <Image
                  src={artist.coverImage}
                  alt="Current cover"
                  width={160}
                  height={80}
                  className="h-20 w-40 rounded-xl object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-card/50 ring-border/40 rounded-2xl p-5 ring-1 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <Share2 className="text-brand h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold">Social Links</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" {...register("instagram")} placeholder="instagram.com/username" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter / X</Label>
            <Input id="twitter" {...register("twitter")} placeholder="twitter.com/username" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input id="facebook" {...register("facebook")} placeholder="facebook.com/page" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spotify">Spotify</Label>
            <Input
              id="spotify"
              {...register("spotify")}
              placeholder="open.spotify.com/artist/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appleMusic">Apple Music</Label>
            <Input
              id="appleMusic"
              {...register("appleMusic")}
              placeholder="music.apple.com/artist/..."
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="min-w-[140px]">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
