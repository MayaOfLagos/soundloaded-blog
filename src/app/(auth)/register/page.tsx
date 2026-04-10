"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Loader2, Lock, Mail, User, Eye, EyeOff, UserPlus } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/hooks/useSettings";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Must include uppercase, lowercase, and a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);
  const { data: settings, isLoading: settingsLoading } = useSettings();

  const allowRegistration = settings?.allowRegistration ?? true;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please complete the security check.");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Registration failed.");
        toast.error(json.error || "Registration failed.");
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }

      toast.success("Account created! Please sign in.");
      router.push("/login?registered=1");
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong.");
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!allowRegistration) {
    return (
      <div className="space-y-6 text-center">
        <div className="bg-muted/50 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          <UserPlus className="text-muted-foreground h-7 w-7" />
        </div>
        <div>
          <h1 className="text-foreground text-2xl font-black">Registration Closed</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Registration is currently disabled. Please check back later.
          </p>
        </div>
        <Link href="/login">
          <Button className="bg-brand hover:bg-brand/90 text-brand-foreground">
            Go to Sign In
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
          <UserPlus className="text-brand h-7 w-7" />
        </div>
        <h1 className="text-foreground text-2xl font-black tracking-tight">Create Account</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Join the {settings?.siteName ?? "Soundloaded"} community
        </p>
      </div>

      {/* Register Card */}
      <div className="bg-card ring-border/40 rounded-2xl p-6 shadow-xl ring-1 backdrop-blur-sm">
        <form onSubmit={(e) => handleSubmit(onSubmit)(e)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">
              Name
            </Label>
            <div className="relative">
              <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                className="h-11 pl-10"
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="text-xs font-medium text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
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
                placeholder="you@example.com"
                className="h-11 pl-10"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs font-medium text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold">
              Password
            </Label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-11 pr-10 pl-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-11 pl-10"
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs font-medium text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-500">
              {error}
            </div>
          )}

          {/* Turnstile */}
          {TURNSTILE_SITE_KEY && (
            <div className="flex justify-center">
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={setTurnstileToken}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                options={{ theme: "auto", size: "normal" }}
              />
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting || (!!TURNSTILE_SITE_KEY && !turnstileToken)}
            className="bg-brand hover:bg-brand/90 text-brand-foreground h-11 w-full text-sm font-bold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-brand font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
