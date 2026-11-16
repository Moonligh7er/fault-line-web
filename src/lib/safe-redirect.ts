// Open-redirect guard for `?next=` values (login, auth callback).
//
// Resolves the value against our own origin and keeps it only if it stays
// there; returns path + query only, never a full URL. Backslashes and control
// characters are refused outright: browsers normalise them differently from
// a naive prefix check (`/\evil.com` and `/<TAB>/evil.com` both become
// `//evil.com`).

const MAX_NEXT_LENGTH = 2048;

export function safeNextPath(next: unknown, origin: string): string {
  if (typeof next !== 'string' || next.length === 0 || next.length > MAX_NEXT_LENGTH) return '/';
  for (const ch of next) {
    const c = ch.charCodeAt(0);
    if (ch === '\\' || c < 0x20 || c === 0x7f) return '/';
  }
  if (!next.startsWith('/') || next.startsWith('//')) return '/';

  let base: URL;
  let url: URL;
  try {
    base = new URL(origin);
    url = new URL(next, base);
  } catch {
    return '/';
  }
  if (url.origin !== base.origin) return '/';
  return url.pathname + url.search;
}
