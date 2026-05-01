"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const DISMISS_KEY = "push-notification-dismissed";
const SUBSCRIBED_KEY = "push-notification-subscribed";
const DISMISS_DAYS = 14;
const SHOW_DELAY = 60_000;

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

/** Wait for a SW registration to reach "activated" state. */
async function waitForActivation(reg: ServiceWorkerRegistration): Promise<void> {
  if (reg.active) return;
  const sw = reg.installing ?? reg.waiting;
  if (!sw) return;
  return new Promise((resolve) => {
    sw.addEventListener("statechange", function handler() {
      if (sw.state === "activated") {
        sw.removeEventListener("statechange", handler);
        resolve();
      }
    });
    // Don't hang forever — resolve after 8 s regardless
    setTimeout(resolve, 8_000);
  });
}

/**
 * Fire-and-forget: register the push subscription with the server.
 * The panel is already closed by the time this runs so any failure
 * is silent — the browser permission is what the user cares about.
 */
async function subscribePush(vapidKey: string): Promise<void> {
  try {
    // Use an existing registration if available, otherwise register fresh.
    let reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) {
      reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }
    await waitForActivation(reg);

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
  } catch {
    // Silently swallow — user granted permission and SW is registered;
    // the subscription record can be retried on next page load.
  }
}

export function NotificationPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const isExcluded =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  useEffect(() => {
    if (typeof window === "undefined" || isExcluded) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
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
    const permission = await Notification.requestPermission();

    // Close the panel immediately regardless of outcome —
    // never leave the user staring at a spinner waiting for SW lifecycle.
    localStorage.setItem(SUBSCRIBED_KEY, "true");
    setVisible(false);

    if (permission !== "granted") {
      // User denied in the native dialog — remove the key so the
      // "already granted" guard doesn't hide a future re-prompt.
      localStorage.removeItem(SUBSCRIBED_KEY);
      return;
    }

    toast.success("You're in! We'll notify you when new music drops.");

    // Fire-and-forget — the panel is gone, this runs silently in background.
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (vapidKey) subscribePush(vapidKey);
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
                  className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600"
                >
                  Allow
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
