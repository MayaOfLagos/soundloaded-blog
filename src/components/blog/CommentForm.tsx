"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function buildSchema(isGuest: boolean) {
  return z.object({
    body: z.string().min(1, "Comment cannot be empty").max(2000),
    guestName: isGuest
      ? z.string().min(2, "Name must be at least 2 characters").max(80)
      : z.string().optional(),
    guestEmail: isGuest ? z.string().email("Enter a valid email") : z.string().optional(),
    guestWebsite: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  });
}

type FormData = z.infer<ReturnType<typeof buildSchema>>;

interface CommentFormProps {
  postId: string;
  parentId?: string;
  replyingToName?: string;
  onSuccess: () => void;
  onCancelReply?: () => void;
  requireLogin?: boolean;
}

export function CommentForm({
  postId,
  parentId,
  replyingToName,
  onSuccess,
  onCancelReply,
  requireLogin = false,
}: CommentFormProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(buildSchema(!isAuthenticated)),
    defaultValues: {
      body: "",
      guestName: "",
      guestEmail: "",
      guestWebsite: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await axios.post("/api/comments", {
        postId,
        body: data.body,
        parentId: parentId || undefined,
        ...(!isAuthenticated && {
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestWebsite: data.guestWebsite || undefined,
        }),
      });

      const status = res.data.comment?.status;
      if (status === "APPROVED") {
        toast.success("Comment posted!");
      } else {
        toast.success("Comment submitted for review.");
      }

      reset();
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.error || "Failed to post comment.";
        toast.error(msg);
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  // If login is required and user is not authenticated, show login prompt
  if (requireLogin && !isAuthenticated) {
    return (
      <div className="border-border rounded-lg border p-6 text-center">
        <p className="text-muted-foreground text-sm">
          You must{" "}
          <Link href="/login" className="text-brand hover:underline">
            sign in
          </Link>{" "}
          to leave a comment.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border rounded-lg border p-4">
      {replyingToName && (
        <div className="bg-muted mb-3 flex items-center justify-between rounded-md px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            Replying to <strong className="text-foreground">{replyingToName}</strong>
          </span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onCancelReply}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {isAuthenticated ? (
        <p className="text-muted-foreground mb-3 text-sm">
          Commenting as{" "}
          <strong className="text-foreground">{session.user?.name || session.user?.email}</strong>
        </p>
      ) : (
        <p className="text-muted-foreground mb-3 text-sm">
          <Link href="/login" className="text-brand hover:underline">
            Sign in
          </Link>{" "}
          or leave a guest comment below:
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {!isAuthenticated && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="guestName" className="text-xs">
                Name *
              </Label>
              <Input
                id="guestName"
                placeholder="Your name"
                className="mt-1"
                {...register("guestName")}
              />
              {errors.guestName && (
                <p className="text-brand mt-0.5 text-xs">{errors.guestName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="guestEmail" className="text-xs">
                Email *
              </Label>
              <Input
                id="guestEmail"
                type="email"
                placeholder="your@email.com"
                className="mt-1"
                {...register("guestEmail")}
              />
              {errors.guestEmail && (
                <p className="text-brand mt-0.5 text-xs">{errors.guestEmail.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="guestWebsite" className="text-xs">
                Website
              </Label>
              <Input
                id="guestWebsite"
                placeholder="https://..."
                className="mt-1"
                {...register("guestWebsite")}
              />
              {errors.guestWebsite && (
                <p className="text-brand mt-0.5 text-xs">{errors.guestWebsite.message}</p>
              )}
            </div>
          </div>
        )}

        <div>
          <Textarea
            placeholder={parentId ? "Write a reply..." : "Share your thoughts..."}
            rows={3}
            {...register("body")}
          />
          {errors.body && <p className="text-brand mt-0.5 text-xs">{errors.body.message}</p>}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            size="sm"
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
          >
            {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {parentId ? "Post Reply" : "Post Comment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
