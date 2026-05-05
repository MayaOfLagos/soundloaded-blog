"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Bell, X } from "lucide-react";
import toast from "react-hot-toast";

const DISMISS_KEY = "push-notification-dismissed";
const SUBSCRIBED_KEY = "push-notification-subscribed";
const PROMPT_TOAST_ID = "push-prompt";
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
    setTimeout(resolve, 8_000);
  });
}

async function requestAndSubscribe(vapidKey: string): Promise<void> {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    localStorage.removeItem(SUBSCRIBED_KEY);
    throw new Error("Permission denied");
  }

  localStorage.setItem(SUBSCRIBED_KEY, "true");

  // SW subscription runs as part of the promise so the toast reflects real progress
  let reg = await navigator.serviceWorker.getRegistration("/");
  if (!reg) reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
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
}

export function NotificationPrompt() {
  const pathname = usePathname();

  const isExcluded =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  const handleAllow = useCallback(() => {
    toast.dismiss(PROMPT_TOAST_ID);
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
    toast.promise(requestAndSubscribe(vapidKey), {
      loading: "Setting up notifications…",
      success: "You're in! We'll notify you when new music drops.",
      error: (err: Error) =>
        err.message === "Permission denied"
          ? "Notifications blocked in your browser."
          : "Could not enable notifications — try again.",
    });
  }, []);

  const handleDismiss = useCallback(() => {
    toast.dismiss(PROMPT_TOAST_ID);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  const showPrompt = useCallback(() => {
    toast.custom(
      (t) => (
        <div
          className={`flex items-center gap-2.5 rounded-lg bg-white px-3.5 py-2.5 text-sm text-[#363636] shadow-[0_3px_10px_rgba(0,0,0,0.1),0_3px_3px_rgba(0,0,0,0.05)] transition-opacity duration-200 ${t.visible ? "opacity-100" : "opacity-0"}`}
        >
          <Bell className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="font-medium">Never miss a drop</span>
          <button
            type="button"
            onClick={handleAllow}
            className="shrink-0 rounded-md bg-amber-500 px-3 py-1 text-xs font-bold text-white hover:bg-amber-600"
          >
            Allow
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      {
        id: PROMPT_TOAST_ID,
        duration: Infinity,
        position: "top-center",
      }
    );
  }, [handleAllow, handleDismiss]);

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

    const timer = setTimeout(showPrompt, SHOW_DELAY);
    return () => clearTimeout(timer);
  }, [isExcluded, showPrompt]);

  return null;
}
