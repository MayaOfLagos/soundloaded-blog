"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const DISMISS_KEY = "push-notification-dismissed";
const SUBSCRIBED_KEY = "push-notification-subscribed";
const DISMISS_DAYS = 14;
const SHOW_DELAY = 60_000; // Show after 60s

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

function isAlreadySubscribed(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(SUBSCRIBED_KEY) === "true";
}

export function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "granted" && isAlreadySubscribed()) return;
    if (Notification.permission === "denied") return;
    if (isDismissed()) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied");
        setVisible(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
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

      localStorage.setItem(SUBSCRIBED_KEY, "true");
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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 top-16 z-50 mx-auto max-w-md px-4"
        >
          <div className="bg-card/95 ring-border/40 relative overflow-hidden rounded-2xl p-4 shadow-2xl ring-1 backdrop-blur-xl">
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground absolute top-3 right-3 rounded-full p-1 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 pr-6">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                <Bell className="h-5 w-5 text-rose-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-semibold">Never miss a drop</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Get notified when new music is uploaded.
                </p>
              </div>
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="flex-shrink-0 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {loading ? "..." : "Allow"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
