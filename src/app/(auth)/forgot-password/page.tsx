"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
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
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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
        setError(json.error ?? "Something went wrong.");
        return;
      }

      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        <div className="border-border bg-card rounded-2xl border p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h1 className="text-foreground mb-2 text-xl font-bold">Check your email</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            If an account exists with that email, we&apos;ve sent a password reset link. It expires
            in 1 hour.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="border-border bg-card rounded-2xl border p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-foreground text-2xl font-black">Forgot Password</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@soundloaded.ng"
                className="pl-9"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-brand text-xs">{errors.email.message}</p>}
          </div>

          {error && <p className="text-brand bg-brand/10 rounded-lg px-3 py-2 text-sm">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand hover:bg-brand/90 text-brand-foreground w-full"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Sending..." : "Send Reset Link"}
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
