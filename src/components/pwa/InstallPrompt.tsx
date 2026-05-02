"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { X, Zap, WifiOff, Bell, Plus, ArrowUpFromLine } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 7;

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone)
  );
}

function isDismissed(): boolean {
  if (typeof localStorage === "undefined") return false;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = parseInt(raw, 10);
  if (Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000) return true;
  localStorage.removeItem(DISMISS_KEY);
  return false;
}

const FEATURES = [
  { icon: Zap, label: "Blazing fast" },
  { icon: WifiOff, label: "Works offline" },
  { icon: Bell, label: "Push alerts" },
];

const IOS_STEPS = [
  {
    icon: ArrowUpFromLine,
    text: (
      <>
        Tap the <span className="text-foreground font-semibold">Share</span> button in Safari
      </>
    ),
  },
  {
    icon: Plus,
    text: (
      <>
        Select{" "}
        <span className="text-foreground font-semibold">&ldquo;Add to Home Screen&rdquo;</span>
      </>
    ),
  },
];

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  const isExcluded =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  useEffect(() => {
    if (isStandalone() || isDismissed() || isExcluded) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const timer = setTimeout(() => {
      if (isIOS() && !isDismissed()) {
        setShowIOSGuide(true);
        setVisible(true);
      }
    }, 30_000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, [isExcluded]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    if (outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  if (isExcluded) return null;
  const showBanner = visible && (deferredPrompt || showIOSGuide);

  return (
    <AnimatePresence>
      {showBanner && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320, mass: 0.9 }}
            className="fixed inset-x-0 bottom-0 z-50 px-0 sm:bottom-6 sm:mx-auto sm:max-w-sm sm:px-4"
          >
            <div className="bg-card ring-border/20 relative overflow-hidden rounded-t-3xl shadow-2xl ring-1 sm:rounded-3xl">
              {/* Top gradient bar */}
              <div className="from-brand via-brand/70 h-[3px] w-full bg-gradient-to-r to-violet-500" />

              {/* Drag handle (mobile visual cue) */}
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="bg-muted-foreground/30 h-1 w-10 rounded-full" />
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-full p-1.5 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="px-5 pt-4 pb-6 sm:px-6 sm:pt-5">
                {showIOSGuide ? (
                  /* ── iOS guide ── */
                  <div>
                    {/* App identity */}
                    <div className="mb-5 flex items-center gap-4">
                      <div className="ring-border/20 relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1">
                        <Image
                          src="/icons/icon-192x192.png"
                          alt="Soundloaded"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="text-foreground text-base leading-tight font-bold">
                          Install Soundloaded
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-[12px] leading-snug">
                          Add to your home screen for the full experience
                        </p>
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                      {IOS_STEPS.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="bg-muted mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                            <step.icon className="text-foreground h-3.5 w-3.5" />
                          </div>
                          <p className="text-muted-foreground flex-1 pt-1 text-[13px] leading-snug">
                            {step.text}
                          </p>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="text-muted-foreground hover:text-foreground mt-5 w-full text-center text-[12px] font-medium transition-colors"
                    >
                      Maybe later
                    </button>
                  </div>
                ) : (
                  /* ── Android / Chrome prompt ── */
                  <div>
                    {/* App identity */}
                    <div className="mb-5 flex items-center gap-4">
                      <div className="ring-border/20 relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1">
                        <Image
                          src="/icons/icon-192x192.png"
                          alt="Soundloaded"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="text-foreground text-base leading-tight font-bold">
                          Install Soundloaded
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-[12px] leading-snug">
                          The music platform for upcoming Naija artists
                        </p>
                      </div>
                    </div>

                    {/* Feature pills */}
                    <div className="mb-5 flex gap-2">
                      {FEATURES.map(({ icon: Icon, label }) => (
                        <div
                          key={label}
                          className={cn(
                            "bg-muted/60 border-border/40 flex flex-1 flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5"
                          )}
                        >
                          <Icon className="text-brand h-4 w-4" />
                          <span className="text-foreground text-center text-[10px] leading-tight font-semibold">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <button
                      type="button"
                      onClick={handleInstall}
                      disabled={installing}
                      className="bg-brand text-brand-foreground hover:bg-brand/90 w-full rounded-2xl py-3 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                      {installing ? "Installing…" : "Add to Home Screen"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="text-muted-foreground hover:text-foreground mt-3 w-full text-center text-[12px] font-medium transition-colors"
                    >
                      Maybe later
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
