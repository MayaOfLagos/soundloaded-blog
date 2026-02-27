"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import { Plus, Pencil, Trash2, Tag, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { generateSlug } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Lowercase, hyphens only"),
  description: z.string().optional(),
  color: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  _count?: { posts: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", description: "", color: "" },
  });

  const nameValue = form.watch("name");

  useEffect(() => {
    if (!slugTouched && nameValue && !editingCategory) {
      form.setValue("slug", generateSlug(nameValue), { shouldValidate: true });
    }
  }, [nameValue, slugTouched, editingCategory, form]);

  async function loadCategories() {
    try {
      const res = await axios.get<{ categories: Category[] }>("/api/categories?includeCounts=true");
      setCategories(res.data.categories ?? []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function openCreate() {
    setEditingCategory(null);
    setSlugTouched(false);
    form.reset({ name: "", slug: "", description: "", color: "" });
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    setSlugTouched(true);
    form.reset({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      color: cat.color ?? "",
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: CategoryFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        description: values.description || null,
        color: values.color || null,
      };

      if (editingCategory) {
        await axios.put(`/api/admin/categories/${editingCategory.id}`, payload);
        toast.success("Category updated!");
      } else {
        await axios.post("/api/admin/categories", payload);
        toast.success("Category created!");
      }

      setDialogOpen(false);
      await loadCategories();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to save category")
        : "Failed to save category";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? Posts will lose their category assignment.`)) return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/admin/categories/${id}`);
      toast.success("Category deleted");
      await loadCategories();
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black">Categories</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5"
        >
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Table */}
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Tag className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No categories yet</p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              Create your first category to organize posts
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="text-center">Posts</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id} className="border-border">
                  <TableCell>
                    <span className="text-foreground text-sm font-semibold">{cat.name}</span>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                      {cat.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground line-clamp-1 text-sm">
                      {cat.description ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {cat.color ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="border-border h-4 w-4 rounded-full border"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-muted-foreground font-mono text-xs">{cat.color}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {cat._count?.posts ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(cat)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={deletingId === cat.id}
                      >
                        {deletingId === cat.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Music News" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="music-news"
                        className="font-mono"
                        {...field}
                        onChange={(e) => {
                          setSlugTouched(true);
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color (hex)</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder="#e11d48" className="font-mono" {...field} />
                      </FormControl>
                      {field.value && (
                        <div
                          className="border-border h-9 w-9 flex-shrink-0 rounded-md border"
                          style={{ backgroundColor: field.value }}
                        />
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="mr-1 h-4 w-4" /> Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {editingCategory ? "Save Changes" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
