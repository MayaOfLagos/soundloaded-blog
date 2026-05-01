"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Bell, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const DISMISS_KEY = "push-notification-dismissed";
const SUBSCRIBED_KEY = "push-notification-subscribed";
const DISMISS_DAYS = 14;
const SHOW_DELAY = 60_000;
const SW_READY_TIMEOUT = 15_000;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timed out waiting for service worker")), ms)
    ),
  ]);
}

export function NotificationPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const isExcluded =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  useEffect(() => {
    if (typeof window === "undefined" || isExcluded) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    // If permission is already granted, never show the prompt again —
    // even if the subscription handshake got stuck and SUBSCRIBED_KEY was never set.
    if (Notification.permission === "granted") {
      localStorage.setItem(SUBSCRIBED_KEY, "true");
      return;
    }
    if (Notification.permission === "denied") return;
    if (isDismissed()) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY);
    return () => clearTimeout(timer);
  }, [isExcluded]);

  const handleSubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied");
        setVisible(false);
        return;
      }

      // Mark granted immediately so a page refresh won't show the prompt again
      // even if the push subscription step below fails or times out.
      localStorage.setItem(SUBSCRIBED_KEY, "true");

      const registration = await withTimeout(navigator.serviceWorker.ready, SW_READY_TIMEOUT);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
          .buffer as ArrayBuffer,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) throw new Error("Failed to save subscription");

      toast.success("You'll get notified about new music drops!");
    } catch {
      toast.error("Could not enable notifications");
    } finally {
      setLoading(false);
      setVisible(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  if (isExcluded) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 top-16 z-50 mx-auto max-w-sm px-4"
        >
          <div className="bg-card ring-border/30 relative overflow-hidden rounded-2xl shadow-2xl ring-1 backdrop-blur-xl">
            {/* Gradient accent bar */}
            <div className="h-1 w-full bg-linear-to-r from-amber-500 via-orange-500 to-rose-500" />

            <div className="p-4">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground absolute top-3 right-3 rounded-full p-1.5 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 pr-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                  <Bell className="h-5 w-5 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-bold">Never miss a drop</p>
                  <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">
                    Get notified when new music is uploaded
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Allow"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
