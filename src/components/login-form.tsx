"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

type BannerTone = "info" | "error";

interface LoginFormProps extends React.ComponentProps<"div"> {
  authError?: string | null;
  callbackUrl: string;
  reason?: string | null;
  registered?: boolean;
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function getAuthBanner(
  reason: string | null | undefined,
  authError: string | null | undefined,
  isAdminFlow: boolean
): { text: string; tone: BannerTone } | null {
  if (reason === "session_expired") {
    return {
      text: isAdminFlow
        ? "Your admin session expired. Sign in again to continue."
        : "Your session expired. Sign in again to continue.",
      tone: "info",
    };
  }

  if (authError === "AccessDenied") {
    return {
      text: "You do not have permission to access that page.",
      tone: "error",
    };
  }

  if (authError === "CredentialsSignin") {
    return {
      text: "Invalid email or password.",
      tone: "error",
    };
  }

  if (authError) {
    return {
      text: "We couldn't complete that sign-in request. Please try again.",
      tone: "error",
    };
  }

  return null;
}

export function LoginForm({
  authError,
  callbackUrl,
  className,
  reason,
  registered = false,
  ...props
}: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hideInitialBanner, setHideInitialBanner] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);
  const hasShownRegisteredToast = useRef(false);
  const { data: settings } = useSettings();
  const isAdminFlow = callbackUrl.startsWith("/admin");

  const initialBanner = useMemo(
    () => getAuthBanner(reason, authError, isAdminFlow),
    [authError, isAdminFlow, reason]
  );

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
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const banner = error
    ? { text: error, tone: isLocked ? "info" : ("error" as BannerTone) }
    : !hideInitialBanner
      ? initialBanner
      : null;

  const logoLight = settings?.logoLight ?? settings?.logoDark;
  const logoDark = settings?.logoDark ?? settings?.logoLight;
  const heroImage = settings?.defaultOgImage ?? "/uploads/seed/cover-1.jpg";
  const siteName = settings?.siteName ?? "Soundloaded";
  const tagline = settings?.tagline ?? "Nigeria's #1 music download & entertainment blog";
  // Show Turnstile only when env key exists AND admin hasn't disabled it in settings
  const showTurnstile = !!TURNSTILE_SITE_KEY && (settings?.enableTurnstile ?? true);

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
          // Ignore lockout check errors and fall back to the generic error state.
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
    <div className={cn("flex w-full min-w-0 flex-col gap-6", className)} {...props}>
      <Card className="border-border/60 bg-card/95 w-full overflow-hidden shadow-2xl backdrop-blur">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="p-6 md:p-8">
            <div className="flex h-full flex-col gap-6">
              <div className="flex items-center gap-3">
                {logoLight || logoDark ? (
                  <div className="flex h-10 items-center">
                    {logoLight ? (
                      <Image
                        src={logoLight}
                        alt={`${siteName} logo`}
                        width={160}
                        height={32}
                        className="block max-h-8 w-auto object-contain dark:hidden"
                      />
                    ) : null}
                    {logoDark ? (
                      <Image
                        src={logoDark}
                        alt={`${siteName} logo`}
                        width={160}
                        height={32}
                        className="hidden max-h-8 w-auto object-contain dark:block"
                      />
                    ) : null}
                  </div>
                ) : (
                  <div className="bg-brand/10 text-brand flex size-10 items-center justify-center rounded-xl">
                    <ShieldCheck className="size-5" />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{siteName}</p>
                  <p className="text-muted-foreground text-xs">
                    {isAdminFlow ? "Admin workspace" : "Account access"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-muted-foreground text-xs font-medium tracking-[0.24em] uppercase">
                  {isAdminFlow ? "Editorial Login" : "Welcome Back"}
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    {isAdminFlow ? "Sign in to the control room" : "Sign in to your account"}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {isAdminFlow
                      ? `Manage artists, releases, stories, and site settings for ${siteName}.`
                      : `Continue with ${siteName} and pick up where you left off.`}
                  </p>
                </div>
              </div>

              {banner ? (
                <div
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
                    banner.tone === "error"
                      ? "border-brand/20 bg-brand/10 text-brand"
                      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
                  )}
                >
                  {banner.tone === "error" ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : isLocked ? (
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{banner.text}</span>
                </div>
              ) : null}

              <div className="grid gap-5">
                <div className="grid gap-2">
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
                  {errors.email ? (
                    <p className="text-brand text-xs">{errors.email.message}</p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
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
                      onClick={() => setShowPassword((current) => !current)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-brand text-xs">{errors.password.message}</p>
                  ) : null}
                </div>

                {showTurnstile ? (
                  <div className="flex justify-center md:justify-start">
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={TURNSTILE_SITE_KEY!}
                      onSuccess={setTurnstileToken}
                      onError={() => setTurnstileToken(null)}
                      onExpire={() => setTurnstileToken(null)}
                      options={{ theme: "auto", size: "normal" }}
                    />
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={isSubmitting || isLocked || (showTurnstile && !turnstileToken)}
                  className="bg-brand hover:bg-brand/90 text-brand-foreground h-11 w-full"
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </div>

              <div className="text-sm">
                {isAdminFlow ? (
                  <p className="text-muted-foreground">
                    Need access? Contact a super admin to provision your editorial account.
                  </p>
                ) : settings?.allowRegistration ? (
                  <p className="text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/register"
                      className="text-foreground font-medium underline-offset-4 hover:underline"
                    >
                      Create one
                    </Link>
                  </p>
                ) : (
                  <p className="text-muted-foreground">Registration is currently unavailable.</p>
                )}
              </div>
            </div>
          </form>

          <div className="bg-muted relative hidden min-h-130 md:block">
            <Image
              src={heroImage}
              alt={`${siteName} editorial preview`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-br from-black/30 via-black/40 to-black/75" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-8 text-white">
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-[0.24em] text-white/75 uppercase">
                  {isAdminFlow ? "Editorial Desk" : siteName}
                </p>
                <h2 className="max-w-md text-3xl leading-tight font-semibold">
                  {isAdminFlow ? "Stay on top of artists, releases, and the front page." : tagline}
                </h2>
              </div>
              <p className="max-w-md text-sm text-white/80">
                {isAdminFlow
                  ? "Review new music, update artist records, and keep the newsroom moving without losing context."
                  : "News, music, videos, and artist updates from the culture in one place."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
