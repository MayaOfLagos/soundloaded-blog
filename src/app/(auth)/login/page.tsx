"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, Mail, Eye, EyeOff, ShieldAlert, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/hooks/useSettings";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { data: settings } = useSettings();

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      toast.success("Account created! Please sign in.");
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setIsLocked(false);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      // Check if account is locked out
      try {
        const lockRes = await fetch("/api/auth/check-lockout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        });
        const lockData = await lockRes.json();
        if (lockData.locked) {
          setIsLocked(true);
          setError(`Account temporarily locked. Try again in ${lockData.minutes ?? 15} minutes.`);
          toast.error("Too many failed attempts.");
          return;
        }
      } catch {
        // Ignore lockout check errors
      }

      setError("Invalid email or password.");
      toast.error("Login failed. Check your credentials.");
    } else {
      toast.success("Welcome back!");
      router.push("/admin/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="border-border bg-card rounded-2xl border p-8 shadow-sm transition-shadow hover:shadow-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="bg-brand/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Lock className="text-brand h-5 w-5" />
          </div>
          <h1 className="text-foreground text-2xl font-black tracking-tight">Sign In</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {settings?.siteName ?? "Soundloaded"} editorial access
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className={`mb-4 flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm ${
              isLocked
                ? "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                : "bg-brand/10 text-brand border-brand/20 border"
            }`}
          >
            {isLocked ? (
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
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
                disabled={isLocked}
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-brand text-xs">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-muted-foreground hover:text-brand text-xs transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-10 pl-9"
                disabled={isLocked}
                {...register("password")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-brand text-xs">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isLocked}
            className="bg-brand hover:bg-brand/90 text-brand-foreground w-full"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
