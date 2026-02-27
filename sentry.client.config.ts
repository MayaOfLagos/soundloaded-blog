import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,

  // Capture 5% of sessions, 100% on error
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],

  debug: false,
});
