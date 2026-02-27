"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

interface NewsletterFormProps {
  compact?: boolean;
  className?: string;
}

export function NewsletterForm({ compact = false, className }: NewsletterFormProps) {
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
      reset();
      toast.success("You're subscribed! Check your inbox for confirmation.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (success) {
    return (
      <p className="text-success text-sm font-medium">
        Thanks for subscribing! Check your email to confirm.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("flex gap-2", className)}>
      <div className="min-w-0 flex-1">
        <div className="relative">
          <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            {...register("email")}
            type="email"
            placeholder={compact ? "Your email" : "Enter your email address"}
            className="pl-9"
            aria-label="Email address for newsletter"
          />
        </div>
        {errors.email && !compact && (
          <p className="text-brand mt-1 text-xs">{errors.email.message}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand hover:bg-brand/90 text-brand-foreground flex-shrink-0"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
      </Button>
    </form>
  );
}
