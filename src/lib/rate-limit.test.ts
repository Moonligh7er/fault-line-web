import { describe, it, expect, vi, afterEach } from 'vitest';

const rpc = vi.fn();
vi.mock('./supabase/server', () => ({
  createSupabaseServiceClient: () => ({ rpc }),
}));

import { checkRateLimit, getRateLimitKey, ipKey, memoryKeyCount } from './rate-limit';

afterEach(() => {
  vi.unstubAllEnvs();
  rpc.mockReset();
});

// No UPSTASH_* or service key in tests, so this exercises the in-memory fallback.
describe('checkRateLimit fallback (no Upstash, no service key)', () => {
  it('allows up to the limit, then refuses', async () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect((await checkRateLimit('auth', key)).success).toBe(true);
    }
    expect((await checkRateLimit('auth', key)).success).toBe(false);
  });

  it('counts identifiers separately', async () => {
    const a = `a-${Math.random()}`;
    for (let i = 0; i < 5; i++) await checkRateLimit('auth', a);
    expect((await checkRateLimit('auth', `b-${Math.random()}`)).success).toBe(true);
  });

  it('keeps the memory map bounded', async () => {
    for (let i = 0; i < 10_050; i++) await checkRateLimit('read', `bound-${i}`);
    expect(memoryKeyCount()).toBeLessThanOrEqual(10_000);
  });
});

describe('checkRateLimit database backend', () => {
  it('uses rate_limit_hit when the service key is set', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
    rpc.mockResolvedValueOnce({ data: false, error: null });
    expect((await checkRateLimit('submit', 'u:1')).success).toBe(false);
    expect(rpc).toHaveBeenCalledWith('rate_limit_hit', {
      p_bucket: 'web:submit',
      p_key: 'u:1',
      p_max: 10,
      p_window_seconds: 3600,
    });
  });

  it('fails closed for auth and tts when the database errors', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
    rpc.mockResolvedValue({ data: null, error: { message: 'down' } });
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await checkRateLimit('auth', `fc-${Math.random()}`)).success).toBe(false);
    expect((await checkRateLimit('tts', `fc-${Math.random()}`)).success).toBe(false);
    // Other buckets fall back to the in-memory window.
    expect((await checkRateLimit('read', `fo-${Math.random()}`)).success).toBe(true);
    err.mockRestore();
  });
});

describe('ipKey', () => {
  it('keys IPv6 by /64', () => {
    expect(ipKey('2001:db8:abcd:12:1:2:3:4')).toBe('2001:db8:abcd:12::/64');
    expect(ipKey('2001:db8:abcd:12::99')).toBe('2001:db8:abcd:12::/64');
    expect(ipKey('2001:0DB8:ABCD:0012:ffff::1')).toBe('2001:db8:abcd:12::/64');
  });

  it('leaves IPv4 alone and unwraps IPv4-mapped addresses', () => {
    expect(ipKey('203.0.113.7')).toBe('203.0.113.7');
    expect(ipKey('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });

  it('is used by getRateLimitKey', () => {
    const h = new Headers({ 'x-forwarded-for': '2001:db8:abcd:12:aaaa::1, 10.0.0.1' });
    expect(getRateLimitKey(null, h)).toBe('ip:2001:db8:abcd:12::/64');
    expect(getRateLimitKey('abc', h)).toBe('u:abc');
  });
});
