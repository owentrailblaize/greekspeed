// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: 
    process.env.NEXT_PUBLIC_SENTRY_DSN || 
    "https://c6180c6dcfab2b9a4f3d825eaa60be4e@o4510313671426048.ingest.us.sentry.io/4510313905061888",

  // Only enable Replay in production
  integrations: isProd ? [Sentry.replayIntegration()] : [],

  // No tracing in dev, moderate sampling in prod
  tracesSampleRate: isProd ? 0.2 : 0,

  // Only log to Sentry in prod
  enableLogs: isProd,

  // Replay sampling: on in prod, off in dev
  replaysSessionSampleRate: isProd ? 0.1 : 0,
  replaysOnErrorSampleRate: isProd ? 1.0 : 0,
  // Only send PII in prod
  sendDefaultPii: isProd,
  // Hard gate: do not send anything outside production
  enabled: isProd,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;