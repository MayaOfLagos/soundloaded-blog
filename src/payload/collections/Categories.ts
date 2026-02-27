import type { CollectionConfig } from "payload";
import slugify from "slugify";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "description"],
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => req.user?.role === "admin" || req.user?.role === "super_admin",
    delete: ({ req }) => req.user?.role === "admin" || req.user?.role === "super_admin",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "Auto-generated from name. Used in URLs." },
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "color",
      type: "text",
      admin: { description: "Hex color code for category badge (e.g. #e11d48)" },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.slug && data.name) {
          data.slug = slugify(data.name, { lower: true, strict: true });
        }
        return data;
      },
    ],
  },
};
