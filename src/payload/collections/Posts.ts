import type { CollectionConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "type", "status", "category", "publishedAt", "author"],
    preview: (doc) => `${process.env.NEXT_PUBLIC_APP_URL}/${doc.slug}`,
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true; // logged in can see all
      return { status: { equals: "PUBLISHED" } }; // public only sees published
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === "admin" || req.user?.role === "super_admin",
  },
  versions: {
    drafts: { autosave: { interval: 60000 } },
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "URL-friendly identifier. Auto-generated if left empty." },
    },
    {
      name: "excerpt",
      type: "textarea",
      admin: { description: "Short summary shown in cards and search results (max 300 chars)." },
    },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "NEWS",
      options: [
        { label: "Music News", value: "NEWS" },
        { label: "Music Download", value: "MUSIC" },
        { label: "Gist / Entertainment", value: "GIST" },
        { label: "Album", value: "ALBUM" },
        { label: "Video", value: "VIDEO" },
        { label: "Lyrics", value: "LYRICS" },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "DRAFT",
      options: [
        { label: "Draft", value: "DRAFT" },
        { label: "Published", value: "PUBLISHED" },
        { label: "Scheduled", value: "SCHEDULED" },
        { label: "Archived", value: "ARCHIVED" },
      ],
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        description: "Set a future date to schedule this post.",
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "body",
      type: "richText",
      required: true,
      editor: lexicalEditor({}),
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      hasMany: false,
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
    {
      name: "seo",
      type: "group",
      label: "SEO",
      fields: [
        { name: "metaTitle", type: "text", label: "Meta Title" },
        { name: "metaDescription", type: "textarea", label: "Meta Description" },
        { name: "ogImage", type: "upload", relationTo: "media", label: "OG Image" },
      ],
    },
  ],
};
