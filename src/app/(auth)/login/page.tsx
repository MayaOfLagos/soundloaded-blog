"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Loader2, Lock, Mail, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormData = z.infer<typeof schema>;

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<{ reset: () => void }>(null);

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

    // Verify Turnstile if configured
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please complete the security check.");
      return;
    }

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      turnstileToken: turnstileToken ?? undefined,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      toast.error("Login failed. Check your credentials.");
      // Reset Turnstile on failure
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } else {
      toast.success("Welcome back!");
      router.push("/admin/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo / Brand */}
      <div className="text-center">
        <div className="bg-brand/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <ShieldCheck className="text-brand h-7 w-7" />
        </div>
        <h1 className="text-foreground text-2xl font-black tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-1 text-sm">Sign in to continue to the dashboard</p>
      </div>

      {/* Login Card */}
      <div className="bg-card ring-border/40 rounded-2xl p-6 shadow-xl ring-1 backdrop-blur-sm">
        <form onSubmit={(e) => handleSubmit(onSubmit)(e)} className="space-y-4">
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
                placeholder="admin@soundloaded.ng"
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-brand text-xs font-medium hover:underline"
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

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-500">
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
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
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-muted-foreground text-center text-xs">
        Protected by Cloudflare Turnstile &middot;{" "}
        <Link href="/" className="text-brand hover:underline">
          Back to site
        </Link>
      </p>
    </div>
  );
}
