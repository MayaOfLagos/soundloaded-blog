"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className="w-full max-w-sm">
        <div className="border-border bg-card rounded-2xl border p-8 text-center shadow-sm">
          <h1 className="text-foreground mb-2 text-xl font-bold">Invalid Link</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            This password reset link is missing or malformed.
          </p>
          <Link href="/forgot-password">
            <Button variant="outline" className="w-full">
              Request a new link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="border-border bg-card rounded-2xl border p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h1 className="text-foreground mb-2 text-xl font-bold">Password Reset!</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            Your password has been updated. You can now sign in.
          </p>
          <Link href="/login">
            <Button className="bg-brand hover:bg-brand/90 text-brand-foreground w-full">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="border-border bg-card rounded-2xl border p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-foreground text-2xl font-black">New Password</h1>
          <p className="text-muted-foreground mt-1 text-sm">Choose a strong new password</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="pl-9"
                {...register("password")}
              />
            </div>
            {errors.password && <p className="text-brand text-xs">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="pl-9"
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-brand text-xs">{errors.confirmPassword.message}</p>
            )}
          </div>

          <p className="text-muted-foreground text-xs">
            At least 8 characters, with uppercase, lowercase, and a number.
          </p>

          {error && <p className="text-brand bg-brand/10 rounded-lg px-3 py-2 text-sm">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand hover:bg-brand/90 text-brand-foreground w-full"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="mr-1 inline h-3 w-3" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
