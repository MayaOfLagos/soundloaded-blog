"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, Download, Share, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  // Don't show on admin, login, register pages
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

    // iOS — show guide after 30s delay
    const timer = setTimeout(() => {
      if (isIOS()) {
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
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
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
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-20 z-50 mx-auto max-w-sm px-4 sm:bottom-6"
        >
          <div className="bg-card ring-border/30 relative overflow-hidden rounded-2xl shadow-2xl ring-1 backdrop-blur-xl">
            {/* Gradient accent bar */}
            <div className="from-brand via-brand/80 h-1 w-full bg-gradient-to-r to-rose-500" />

            <div className="p-4">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground absolute top-3 right-3 rounded-full p-1.5 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>

              {showIOSGuide ? (
                <div className="pr-6">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="bg-brand/10 flex h-11 w-11 items-center justify-center rounded-xl">
                      <Share className="text-brand h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-bold">Install Soundloaded</p>
                      <p className="text-muted-foreground text-[11px]">
                        Get the full app experience
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Tap the <span className="text-foreground font-semibold">Share</span> button in
                    Safari, then select{" "}
                    <span className="text-foreground font-semibold">
                      &quot;Add to Home Screen&quot;
                    </span>
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 pr-6">
                  <div className="bg-brand/10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl">
                    <Smartphone className="text-brand h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm font-bold">Install Soundloaded</p>
                    <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">
                      Quick access, offline support, and push notifications
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleInstall}
                    className="bg-brand text-brand-foreground hover:bg-brand/90 flex-shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors"
                  >
                    Install
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
