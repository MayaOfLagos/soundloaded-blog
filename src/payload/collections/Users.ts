import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email", "role", "createdAt"],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      label: "Full Name",
    },
    {
      name: "role",
      type: "select",
      defaultValue: "editor",
      required: true,
      options: [
        { label: "Super Admin", value: "super_admin" },
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Contributor", value: "contributor" },
      ],
      access: {
        update: ({ req }) => req.user?.role === "admin" || req.user?.role === "super_admin",
      },
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      label: "Profile Photo",
    },
    {
      name: "bio",
      type: "textarea",
      label: "Bio",
    },
  ],
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === "admin" || req.user?.role === "super_admin",
    update: ({ req, id }) =>
      req.user?.id === id || req.user?.role === "admin" || req.user?.role === "super_admin",
    delete: ({ req }) => req.user?.role === "super_admin",
  },
};
