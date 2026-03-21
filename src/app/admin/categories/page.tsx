"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import { Plus, Pencil, Trash2, Tag, Loader2, Check, X, GripVertical, icons } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateSlug } from "@/lib/utils";

const ICON_OPTIONS = [
  "headphones",
  "flame",
  "sparkles",
  "disc-3",
  "mic-vocal",
  "music",
  "newspaper",
  "message-square",
  "radio",
  "guitar",
  "drum",
  "piano",
  "megaphone",
  "tv",
  "film",
  "camera",
  "star",
  "heart",
  "zap",
  "trending-up",
  "globe",
  "bookmark",
  "circle-play",
  "volume-2",
  "podcast",
  "rss",
  "hash",
  "audio-lines",
  "speaker",
  "crown",
  "party-popper",
  "trophy",
  "clapperboard",
  "palette",
  "layers",
];

function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function LucideIcon({ name, className }: { name: string; className?: string }) {
  const pascalName = toPascalCase(name);
  const IconComponent = icons[pascalName as keyof typeof icons];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Lowercase, hyphens only"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder?: number;
  _count?: { posts: number };
}

/* ── Sortable Row ─────────────────────────────────────── */

function SortableRow({
  cat,
  onEdit,
  onDelete,
  deletingId,
}: {
  cat: Category;
  onEdit: (cat: Category) => void;
  onDelete: (id: string, name: string) => void;
  deletingId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="border-border">
      <TableCell className="w-10">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>
        <span className="text-foreground text-sm font-semibold">{cat.name}</span>
      </TableCell>
      <TableCell>
        <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
          {cat.slug}
        </code>
      </TableCell>
      <TableCell>
        {cat.icon ? (
          <div className="flex items-center gap-2">
            <LucideIcon name={cat.icon} className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground font-mono text-xs">{cat.icon}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
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
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(cat)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive h-8 w-8"
            onClick={() => onDelete(cat.id, cat.name)}
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
  );
}

/* ── Main Page ─────────────────────────────────────────── */

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", description: "", color: "", icon: "" },
  });

  const nameValue = form.watch("name");

  useEffect(() => {
    if (!slugTouched && nameValue && !editingCategory) {
      form.setValue("slug", generateSlug(nameValue), { shouldValidate: true });
    }
  }, [nameValue, slugTouched, editingCategory, form]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await axios.get<{ categories: Category[] }>("/api/categories?includeCounts=true");
      setCategories(res.data.categories ?? []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function openCreate() {
    setEditingCategory(null);
    setSlugTouched(false);
    form.reset({ name: "", slug: "", description: "", color: "", icon: "" });
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
      icon: cat.icon ?? "",
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
        icon: values.icon || null,
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

  async function saveOrder(newCategories: Category[]) {
    setIsSavingOrder(true);
    try {
      await axios.put("/api/admin/categories/reorder", {
        orderedIds: newCategories.map((c) => c.id),
      });
      toast.success("Order saved");
    } catch {
      toast.error("Failed to save order");
      await loadCategories();
    } finally {
      setIsSavingOrder(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    saveOrder(reordered);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black">Categories</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
            {isSavingOrder && (
              <span className="text-brand ml-2 inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving order...
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5"
        >
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </div>

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-10" />
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-center">Posts</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={categories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {categories.map((cat) => (
                    <SortableRow
                      key={cat.id}
                      cat={cat}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      deletingId={deletingId}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        )}
      </div>

      <p className="text-muted-foreground/60 flex items-center gap-1.5 text-xs">
        <GripVertical className="h-3.5 w-3.5" />
        Drag rows to reorder — changes are saved automatically and reflected on the frontend sidebar
      </p>

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
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2 font-normal"
                          >
                            {field.value ? (
                              <>
                                <LucideIcon name={field.value} className="h-4 w-4" />
                                {field.value}
                              </>
                            ) : (
                              <span className="text-muted-foreground">Choose an icon...</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-0" align="start">
                        <ScrollArea className="h-[280px] p-3">
                          <div className="grid grid-cols-6 gap-1.5">
                            {ICON_OPTIONS.map((iconName) => (
                              <button
                                key={iconName}
                                type="button"
                                title={iconName}
                                onClick={() => field.onChange(iconName)}
                                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                                  field.value === iconName
                                    ? "bg-brand/15 text-brand ring-brand ring-2"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <LucideIcon name={iconName} className="h-5 w-5" />
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
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
