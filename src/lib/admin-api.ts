import axios, { AxiosError } from "axios";

// ── Centralized Admin API Client ────────────────────────────────────────
// Provides a shared axios instance for all admin frontend calls with:
// • Automatic 401 → redirect to login (session expired)
// • Automatic 429 → user-friendly rate limit message
// • Error sanitization — never leaks raw server internals to UI
// • Consistent error extraction for toast messages

const adminApi = axios.create({
  // Cookies are sent automatically for same-origin (no explicit credentials needed)
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Response interceptor ────────────────────────────────────────────────
adminApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    const status = error.response?.status;

    // Session expired — redirect to login
    if (status === 401) {
      if (typeof window !== "undefined") {
        const current = window.location.pathname;
        window.location.href = `/login?callbackUrl=${encodeURIComponent(current)}&reason=session_expired`;
      }
    }

    // Rate limited
    if (status === 429) {
      error.message = "Too many requests. Please wait a moment and try again.";
    }

    // CSRF failure — probably a stale tab
    if (status === 403 && error.response?.data?.error === "CSRF validation failed") {
      error.message = "Session validation failed. Please refresh the page.";
    }

    return Promise.reject(error);
  }
);

// ── Safe error message extractor ────────────────────────────────────────
// Use this to get a user-friendly error string for toast notifications.
// Never passes raw server strings longer than 200 chars to the UI.
const MAX_ERROR_LEN = 200;

export function getApiError(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;

  const status = error.response?.status;

  // Known safe status messages
  if (status === 401) return "Session expired. Please log in again.";
  if (status === 429) return "Too many requests. Please wait a moment.";
  if (status === 403) return "You don't have permission for this action.";

  // Extract server error message
  const serverMsg = error.response?.data?.error;

  // If it's an array (Zod errors), summarize
  if (Array.isArray(serverMsg)) {
    const first = serverMsg[0];
    const msg = typeof first === "string" ? first : (first?.message ?? "Validation error");
    return typeof msg === "string" && msg.length <= MAX_ERROR_LEN ? msg : "Validation error";
  }

  // If it's a clean short string from our API, use it
  if (typeof serverMsg === "string" && serverMsg.length > 0 && serverMsg.length <= MAX_ERROR_LEN) {
    return serverMsg;
  }

  // Anything else: use the fallback (never expose unknown server strings)
  return fallback;
}

export { adminApi };
