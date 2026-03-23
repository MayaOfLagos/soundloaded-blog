"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
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
} from "@/components/ui/alert-dialog";

export function DeletePostButton({
  postId,
  isArchived = false,
}: {
  postId: string;
  isArchived?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: () => axios.delete(`/api/admin/posts/${postId}`),
    onSuccess: () => {
      toast.success(isArchived ? "Post permanently deleted" : "Post archived");
      setOpen(false);
      router.refresh();
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="text-destructive hover:text-destructive h-8 w-8"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">Delete post</span>
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArchived ? "Permanently delete this post?" : "Delete this post?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArchived
                ? "This post will be permanently deleted. This action cannot be undone."
                : "The post will be archived and removed from the public site. You can restore it later from the Archived tab."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                mutate();
              }}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {isArchived ? "Delete Forever" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
