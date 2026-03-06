"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeletePostButton({ postId }: { postId: string }) {
  return (
    <form
      action={`/api/admin/posts/${postId}`}
      method="POST"
      onSubmit={(e) => {
        if (!confirm("Delete this post?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="_method" value="DELETE" />
      <Button
        size="icon"
        variant="ghost"
        className="text-destructive hover:text-destructive h-8 w-8"
        type="submit"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}
