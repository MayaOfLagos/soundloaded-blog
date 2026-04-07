"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Loader2, Mail, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Something went wrong.");
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong.");
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
          <CheckCircle className="h-7 w-7 text-green-500" />
        </div>
        <div>
          <h1 className="text-foreground text-2xl font-black tracking-tight">Check your email</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            If an account exists for <strong>{getValues("email")}</strong>, we sent a password reset
            link. Check your inbox and spam folder.
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-brand/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <KeyRound className="text-brand h-7 w-7" />
        </div>
        <h1 className="text-foreground text-2xl font-black tracking-tight">Reset password</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {/* Form */}
      <div className="bg-card ring-border/40 rounded-2xl p-6 shadow-xl ring-1 backdrop-blur-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">
              Email
            </Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@soundloaded.ng"
                className="h-11 pl-10"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs font-medium text-red-500">{errors.email.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-500">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand hover:bg-brand/90 text-brand-foreground h-11 w-full text-sm font-bold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-muted-foreground text-center text-sm">
        <Link href="/login" className="text-brand font-semibold hover:underline">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
