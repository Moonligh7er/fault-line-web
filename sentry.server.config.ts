import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
    // Strip sensitive headers
    beforeSend(event) {
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, string>;
        delete h.cookie;
        delete h.authorization;
        delete h['x-forwarded-for'];
      }
      return event;
    },
  });
}
