import { describe, it, expect } from 'vitest';
import type { ErrorEvent } from '@sentry/nextjs';
import { scrubBreadcrumb, scrubEvent, stripQuery } from './sentry-scrub';

describe('sentry scrubbing', () => {
  it('strips query strings and fragments', () => {
    expect(stripQuery('https://app.fault-line.dev/auth/callback?code=abc#x')).toBe('https://app.fault-line.dev/auth/callback');
    expect(stripQuery('/search?q=main+st')).toBe('/search');
    expect(stripQuery('/map')).toBe('/map');
  });

  it('removes cookies, auth headers, bodies and query strings from events', () => {
    const event = scrubEvent({
      type: undefined,
      request: {
        url: 'https://app.fault-line.dev/api/v1/reports?limit=5',
        query_string: 'limit=5',
        cookies: { sb: 'x' },
        data: '{"email":"a@b.c"}',
        headers: { Cookie: 'sb=x', Authorization: 'Bearer flk_x', 'user-agent': 'ua' },
      },
    } as ErrorEvent);
    expect(event.request).toEqual({
      url: 'https://app.fault-line.dev/api/v1/reports',
      headers: { 'user-agent': 'ua' },
    });
  });

  it('drops query strings from fetch/xhr breadcrumbs', () => {
    expect(scrubBreadcrumb({ category: 'fetch', data: { url: '/api/tts?x=1', method: 'POST' } }).data).toEqual({
      url: '/api/tts',
      method: 'POST',
    });
    expect(scrubBreadcrumb({ category: 'xhr', data: { url: 'https://x.test/a?token=1' } }).data?.url).toBe('https://x.test/a');
    expect(scrubBreadcrumb({ category: 'ui.click', message: 'button' })).toEqual({ category: 'ui.click', message: 'button' });
  });
});
