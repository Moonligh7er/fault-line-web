import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Performance sampling — lower in prod, higher in dev
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Session replay disabled by default (can leak sensitive UI)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Send structured error IDs to the user (shown on error page)
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
    // Strip URLs that could leak tokens
    beforeSend(event) {
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          url.searchParams.delete('code');
          url.searchParams.delete('token');
          url.searchParams.delete('access_token');
          url.searchParams.delete('refresh_token');
          event.request.url = url.toString();
        } catch {
          /* ignore */
        }
      }
      return event;
    },
  });
}
