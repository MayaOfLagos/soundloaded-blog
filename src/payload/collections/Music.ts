import type { CollectionConfig } from "payload";

export const MusicCollection: CollectionConfig = {
  slug: "music",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "artist", "genre", "downloadCount", "createdAt"],
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === "admin" || req.user?.role === "super_admin",
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    {
      name: "artist",
      type: "relationship",
      relationTo: "artists",
      required: true,
    },
    {
      name: "album",
      type: "relationship",
      relationTo: "albums",
      hasMany: false,
    },
    {
      name: "trackNumber",
      type: "number",
      label: "Track Number (for albums)",
      min: 1,
    },
    {
      name: "coverArt",
      type: "upload",
      relationTo: "media",
      label: "Cover Art",
    },
    {
      name: "r2Key",
      type: "text",
      required: true,
      label: "R2 Storage Key",
      admin: { description: "The Cloudflare R2 object key for the audio file." },
    },
    {
      name: "filename",
      type: "text",
      required: true,
      label: "Original Filename",
    },
    {
      name: "fileSize",
      type: "number",
      label: "File Size (bytes)",
    },
    {
      name: "duration",
      type: "number",
      label: "Duration (seconds)",
    },
    {
      name: "format",
      type: "select",
      options: [
        { label: "MP3", value: "mp3" },
        { label: "FLAC", value: "flac" },
        { label: "WAV", value: "wav" },
        { label: "AAC", value: "aac" },
        { label: "OGG", value: "ogg" },
      ],
      defaultValue: "mp3",
    },
    { name: "bitrate", type: "number", label: "Bitrate (kbps)" },
    {
      name: "genre",
      type: "select",
      options: [
        { label: "Afrobeats", value: "Afrobeats" },
        { label: "Afropop", value: "Afropop" },
        { label: "Highlife", value: "Highlife" },
        { label: "Hip-Hop / Rap", value: "Hip-Hop" },
        { label: "R&B", value: "RnB" },
        { label: "Gospel", value: "Gospel" },
        { label: "Dancehall", value: "Dancehall" },
        { label: "Reggae", value: "Reggae" },
        { label: "Other", value: "Other" },
      ],
    },
    { name: "year", type: "number", label: "Release Year" },
    { name: "label", type: "text", label: "Record Label" },
    {
      name: "lyrics",
      type: "textarea",
      label: "Lyrics (optional)",
    },
    {
      name: "downloadCount",
      type: "number",
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: "streamCount",
      type: "number",
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: "isExclusive",
      type: "checkbox",
      label: "Exclusive / Premium",
      defaultValue: false,
    },
  ],
};
