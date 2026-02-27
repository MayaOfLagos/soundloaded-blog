import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    staticDir: "../public/uploads",
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 768, height: 432, position: "centre" },
      { name: "og", width: 1200, height: 630, position: "centre" },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"],
  },
  admin: {
    useAsTitle: "alt",
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === "admin" || req.user?.role === "super_admin",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      label: "Alt Text",
    },
    {
      name: "caption",
      type: "text",
      label: "Caption",
    },
    {
      name: "credit",
      type: "text",
      label: "Photo Credit",
    },
  ],
};
