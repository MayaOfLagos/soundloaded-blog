import type { CollectionConfig } from "payload";

export const Artists: CollectionConfig = {
  slug: "artists",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "genre", "country", "createdAt"],
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === "admin" || req.user?.role === "super_admin",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
      label: "Artist Photo",
    },
    { name: "bio", type: "textarea" },
    {
      name: "genre",
      type: "select",
      options: [
        { label: "Afrobeats", value: "Afrobeats" },
        { label: "Afropop", value: "Afropop" },
        { label: "Highlife", value: "Highlife" },
        { label: "Fuji", value: "Fuji" },
        { label: "Hip-Hop / Rap", value: "Hip-Hop" },
        { label: "R&B", value: "RnB" },
        { label: "Gospel", value: "Gospel" },
        { label: "Dancehall", value: "Dancehall" },
        { label: "Reggae", value: "Reggae" },
        { label: "Alternative", value: "Alternative" },
        { label: "Other", value: "Other" },
      ],
    },
    {
      name: "country",
      type: "text",
      defaultValue: "Nigeria",
    },
    {
      name: "socialLinks",
      type: "group",
      label: "Social Links",
      fields: [
        { name: "instagram", type: "text", label: "Instagram URL" },
        { name: "twitter", type: "text", label: "Twitter/X URL" },
        { name: "facebook", type: "text", label: "Facebook URL" },
        { name: "spotify", type: "text", label: "Spotify URL" },
        { name: "appleMusic", type: "text", label: "Apple Music URL" },
        { name: "youtube", type: "text", label: "YouTube URL" },
      ],
    },
  ],
};
