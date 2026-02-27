import type { CollectionConfig } from "payload";

export const Albums: CollectionConfig = {
  slug: "albums",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "artist", "type", "releaseDate"],
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
      name: "coverArt",
      type: "upload",
      relationTo: "media",
      label: "Cover Art",
    },
    {
      name: "type",
      type: "select",
      defaultValue: "ALBUM",
      options: [
        { label: "Album", value: "ALBUM" },
        { label: "EP", value: "EP" },
        { label: "Mixtape", value: "MIXTAPE" },
        { label: "Compilation", value: "COMPILATION" },
      ],
    },
    { name: "releaseDate", type: "date" },
    { name: "genre", type: "text" },
    { name: "label", type: "text", label: "Record Label" },
    {
      name: "description",
      type: "textarea",
      label: "Album Description",
    },
  ],
};
