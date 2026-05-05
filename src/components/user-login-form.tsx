"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Info, Loader2, Lock, Mail, ShieldAlert } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;
type BannerTone = "info" | "error";

interface UserLoginFormProps {
  authError?: string | null;
  callbackUrl: string;
  reason?: string | null;
  registered?: boolean;
  googleEnabled?: boolean;
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function getBanner(
  reason: string | null | undefined,
  authError: string | null | undefined
): { text: string; tone: BannerTone } | null {
  if (reason === "session_expired")
    return { text: "Your session expired. Sign in again to continue.", tone: "info" };
  if (authError === "AccessDenied")
    return { text: "You do not have permission to access that page.", tone: "error" };
  if (authError === "CredentialsSignin")
    return { text: "Invalid email or password.", tone: "error" };
  if (authError === "OAuthAccountNotLinked")
    return {
      text: "An account with that email already exists. Sign in with your password instead.",
      tone: "error",
    };
  if (authError)
    return { text: "We couldn't complete that sign-in. Please try again.", tone: "error" };
  return null;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function UserLoginForm({
  authError,
  callbackUrl,
  reason,
  registered = false,
  googleEnabled = false,
}: UserLoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hideInitialBanner, setHideInitialBanner] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);
  const hasShownRegisteredToast = useRef(false);
  const { data: settings } = useSettings();

  const showTurnstile = !!TURNSTILE_SITE_KEY && (settings?.enableTurnstile ?? true);

  const initialBanner = useMemo(() => getBanner(reason, authError), [authError, reason]);

  useEffect(() => {
    if (registered && !hasShownRegisteredToast.current) {
      toast.success("Account created! Please sign in.");
      hasShownRegisteredToast.current = true;
    }
  }, [registered]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const banner = error
    ? { text: error, tone: isLocked ? "info" : ("error" as BannerTone) }
    : !hideInitialBanner
      ? initialBanner
      : null;

  const logoLight = settings?.logoLight ?? settings?.logoDark;
  const logoDark = settings?.logoDark ?? settings?.logoLight;
  const siteName = settings?.siteName ?? "Soundloaded";
  const heroImage = settings?.defaultOgImage ?? "/uploads/seed/cover-1.jpg";

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setError(null);
    setIsLocked(false);
    setHideInitialBanner(true);

    if (showTurnstile && !turnstileToken) {
      setError("Please complete the security check.");
      return;
    }

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        callbackUrl,
        redirect: false,
        turnstileToken: turnstileToken ?? undefined,
      });

      if (result?.error) {
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
            turnstileRef.current?.reset();
            setTurnstileToken(null);
            return;
          }
        } catch {
          /* ignore lockout check errors */
        }
        setError("Invalid email or password.");
        toast.error("Login failed. Check your credentials.");
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }

      toast.success("Welcome back!");
      window.location.assign(result?.url ?? callbackUrl);
    } catch {
      setError("We couldn't sign you in right now. Please try again.");
      toast.error("Login failed. Please try again.");
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Background */}
      <div className="absolute inset-0">
        <Image src={heroImage} alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="from-brand/20 absolute inset-0 bg-linear-to-br via-transparent to-black/60" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm px-4 py-8">
        <div className="bg-card/90 border-border/40 space-y-6 rounded-2xl border p-7 shadow-2xl backdrop-blur-xl">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 text-center">
            {logoLight || logoDark ? (
              <div className="flex h-10 items-center">
                {logoLight && (
                  <Image
                    src={logoLight}
                    alt={siteName}
                    width={0}
                    height={0}
                    priority
                    className="block h-9 w-auto object-contain dark:hidden"
                  />
                )}
                {logoDark && (
                  <Image
                    src={logoDark}
                    alt={siteName}
                    width={0}
                    height={0}
                    priority
                    className="hidden h-9 w-auto object-contain dark:block"
                  />
                )}
              </div>
            ) : (
              <p className="text-foreground text-xl font-bold">{siteName}</p>
            )}
            <div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground mt-1 text-sm">Sign in to your account</p>
            </div>
          </div>

          {/* Banner */}
          {banner && (
            <div
              className={cn(
                "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
                banner.tone === "error"
                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-400"
              )}
            >
              {banner.tone === "error" ? (
                isLocked ? (
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{banner.text}</span>
            </div>
          )}

          {/* Google sign-in */}
          {googleEnabled && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || isSubmitting}
                className="border-border bg-background text-foreground hover:bg-muted flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="border-border h-px flex-1 border-t" />
                <span className="text-muted-foreground text-xs">or continue with email</span>
                <div className="border-border h-px flex-1 border-t" />
              </div>
            </>
          )}

          {/* Credentials form */}
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@soundloaded.ng"
                  className="h-11 pl-9"
                  disabled={isLocked}
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-muted-foreground hover:text-foreground text-xs transition-colors"
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
                  className="h-11 pr-10 pl-9"
                  disabled={isLocked}
                  {...register("password")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {showTurnstile && (
              <div className="flex justify-center">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY!}
                  onSuccess={setTurnstileToken}
                  onError={() => setTurnstileToken(null)}
                  onExpire={() => setTurnstileToken(null)}
                  options={{ theme: "auto", size: "normal" }}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || isLocked || (showTurnstile && !turnstileToken)}
              className="bg-brand hover:bg-brand/90 text-brand-foreground h-11 w-full"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Register link */}
          {settings?.allowRegistration ? (
            <p className="text-muted-foreground text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-foreground font-semibold underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </p>
          ) : (
            <p className="text-muted-foreground text-center text-sm">
              Registration is currently unavailable.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
