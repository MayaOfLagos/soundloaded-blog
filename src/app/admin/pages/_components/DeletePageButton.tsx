"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi, getApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeletePageButtonProps {
  pageId: string;
  isArchived: boolean;
  isSystem: boolean;
}

export function DeletePageButton({ pageId, isArchived, isSystem }: DeletePageButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setIsPending(true);
    try {
      const res = await adminApi.delete(`/api/admin/pages/${pageId}`);
      toast.success(res.data?.deleted ? "Page deleted" : "Page archived");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(getApiError(error, "Failed to process page"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive hover:text-destructive h-8 w-8"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">{isArchived && !isSystem ? "Delete" : "Archive"}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isArchived && !isSystem ? "Delete page permanently?" : "Archive page?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isSystem
              ? "System pages are archived instead of permanently deleted, so legal or company URLs can be restored later."
              : isArchived
                ? "This permanently deletes the archived page and cannot be undone."
                : "This hides the page from visitors and removes it from navigation. You can restore it by editing the archived page."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            {isArchived && !isSystem ? "Delete" : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
