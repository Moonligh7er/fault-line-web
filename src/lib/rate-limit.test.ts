import { describe, it, expect } from 'vitest';
import { checkRateLimit } from './rate-limit';

// No UPSTASH_* env in tests, so this exercises the in-memory fallback.
describe('checkRateLimit fallback (no Upstash)', () => {
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
});
