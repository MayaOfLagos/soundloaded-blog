"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Download, Share } from "lucide-react";
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
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    // Android / Chrome — intercept beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show after 30s delay
    const timer = setTimeout(() => {
      if (isIOS()) {
        setShowIOSGuide(true);
      }
      setVisible(true);
    }, 30_000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

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

  const showBanner = visible && (deferredPrompt || showIOSGuide);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-20 z-50 mx-auto max-w-md px-4 sm:bottom-6"
        >
          <div className="bg-card/95 ring-border/40 relative overflow-hidden rounded-2xl p-4 shadow-2xl ring-1 backdrop-blur-xl">
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground absolute top-3 right-3 rounded-full p-1 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            {showIOSGuide ? (
              <div className="flex items-start gap-3 pr-6">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                  <Share className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">Install Soundloaded</p>
                  <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                    Tap the <span className="font-medium">Share</span> button, then{" "}
                    <span className="font-medium">&quot;Add to Home Screen&quot;</span> for the best
                    experience.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 pr-6">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                  <Download className="h-5 w-5 text-rose-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-semibold">Install Soundloaded</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Get instant access from your home screen.
                  </p>
                </div>
                <button
                  onClick={handleInstall}
                  className="flex-shrink-0 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
                >
                  Install
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
