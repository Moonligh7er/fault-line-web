import { describe, it, expect } from 'vitest';
import { generateNonce, buildCsp } from './csp';

describe('generateNonce', () => {
  it('returns a base64 string', () => {
    const n = generateNonce();
    expect(typeof n).toBe('string');
    expect(n.length).toBeGreaterThan(0);
    // base64 alphabet
    expect(n).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('is unique per call', () => {
    const nonces = new Set<string>();
    for (let i = 0; i < 100; i++) nonces.add(generateNonce());
    expect(nonces.size).toBe(100);
  });
});

describe('buildCsp', () => {
  const nonce = 'test-nonce-abc';

  it('includes default-src self', () => {
    expect(buildCsp({ nonce, isDev: false })).toContain("default-src 'self'");
  });

  it('includes nonce in script-src', () => {
    expect(buildCsp({ nonce, isDev: false })).toContain(`'nonce-${nonce}'`);
  });

  it('uses strict-dynamic', () => {
    expect(buildCsp({ nonce, isDev: false })).toContain("'strict-dynamic'");
  });

  it('does NOT include unsafe-eval in production', () => {
    expect(buildCsp({ nonce, isDev: false })).not.toContain("'unsafe-eval'");
  });

  it('DOES include unsafe-eval in dev (for React Fast Refresh)', () => {
    expect(buildCsp({ nonce, isDev: true })).toContain("'unsafe-eval'");
  });

  it('blocks frame-ancestors', () => {
    expect(buildCsp({ nonce, isDev: false })).toContain("frame-ancestors 'none'");
  });

  it('blocks objects', () => {
    expect(buildCsp({ nonce, isDev: false })).toContain("object-src 'none'");
  });

  it('upgrades insecure requests', () => {
    expect(buildCsp({ nonce, isDev: false })).toContain('upgrade-insecure-requests');
  });

  it('allows Supabase websocket', () => {
    expect(buildCsp({ nonce, isDev: false })).toContain('wss://*.supabase.co');
  });

  it('allows Formspree for feedback submissions', () => {
    expect(buildCsp({ nonce, isDev: false })).toContain('https://formspree.io');
  });
});
