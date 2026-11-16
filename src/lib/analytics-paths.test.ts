import { describe, it, expect } from 'vitest';
import { isAnalyticsExcluded } from './analytics-paths';

describe('isAnalyticsExcluded', () => {
  it('excludes private areas', () => {
    for (const p of [
      '/admin', '/admin/queue', '/portal', '/portal/abc/billing', '/profile', '/dashboard',
      '/login', '/auth/callback', '/report/abc/legal', '/report/abc/insurance', '/Report/abc/Legal',
    ]) {
      expect(isAnalyticsExcluded(p)).toBe(true);
    }
  });

  it('allows public pages', () => {
    for (const p of ['/', '/map', '/search', '/report/abc', '/authority/x', '/about', '/administrator-faq', '/profiles']) {
      expect(isAnalyticsExcluded(p)).toBe(false);
    }
  });
});
