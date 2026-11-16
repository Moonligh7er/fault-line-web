import type { Breadcrumb, Event } from '@sentry/nextjs';

// Scrubbers shared by the Sentry configs (server, edge, client). Query
// strings can carry auth codes, tokens and search terms; cookies, auth
// headers and request bodies carry sessions, keys and personal data. None
// of it goes to Sentry. Runs on the Edge runtime too, so no Node APIs.

const DROP_HEADERS = ['cookie', 'set-cookie', 'authorization', 'proxy-authorization', 'x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'stripe-signature', 'svix-signature'];

/** URL without its query string or fragment (relative URLs stay relative). */
export function stripQuery(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

export function scrubEvent<T extends Event>(event: T): T {
  const req = event.request;
  if (req) {
    if (req.url) req.url = stripQuery(req.url);
    delete req.query_string;
    delete req.cookies;
    delete req.data;
    if (req.headers) {
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (!DROP_HEADERS.includes(k.toLowerCase())) headers[k] = v;
      }
      req.headers = headers;
    }
  }
  if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);
  return event;
}

export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb {
  if ((crumb.category === 'fetch' || crumb.category === 'xhr' || crumb.category === 'http') && crumb.data) {
    const data = { ...crumb.data };
    if (typeof data.url === 'string') data.url = stripQuery(data.url);
    delete data['http.query'];
    delete data['http.fragment'];
    return { ...crumb, data };
  }
  return crumb;
}
