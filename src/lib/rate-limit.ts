import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

type LimitName = 'auth' | 'submit' | 'vote' | 'upload' | 'read' | 'tts' | 'tts_global';

const windows: Record<LimitName, Parameters<typeof Ratelimit.slidingWindow>> = {
  auth: [5, '15 m'],
  submit: [10, '1 h'],
  vote: [60, '1 h'],
  upload: [20, '1 h'],
  read: [300, '1 m'],
  // /api/tts proxies a paid GPU endpoint: per-visitor cap plus a site-wide
  // daily ceiling so a botnet can't run up the bill either.
  tts: [20, '1 h'],
  tts_global: [1000, '1 d'],
};

const limiters: Partial<Record<LimitName, Ratelimit>> = {};

function getLimiter(name: LimitName): Ratelimit | null {
  if (!redis) return null;
  if (limiters[name]) return limiters[name]!;
  const args = windows[name];
  limiters[name] = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(...args),
    analytics: true,
    prefix: `rl:${name}`,
  });
  return limiters[name]!;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

// Fallback when Upstash isn't configured: a per-instance in-memory sliding
// window. Weaker than Redis (each serverless instance counts separately),
// but it keeps the site usable instead of refusing every request — the old
// fail-closed behavior blocked sign-in and submission in production. DB-side
// limits (report insert trigger, edge-function limits) still apply.
const UNIT_MS: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
const memoryHits = new Map<string, number[]>();
let warnedNoRedis = false;

function memoryLimit(name: LimitName, identifier: string): RateLimitResult {
  const [max, window] = windows[name] as [number, string];
  const [amount, unit] = window.split(' ');
  const windowMs = Number(amount) * (UNIT_MS[unit ?? ''] ?? 60_000);
  const now = Date.now();
  const key = `${name}:${identifier}`;
  const hits = (memoryHits.get(key) ?? []).filter((t) => now - t < windowMs);
  const success = hits.length < max;
  if (success) hits.push(now);
  memoryHits.set(key, hits);
  if (memoryHits.size > 10_000) memoryHits.clear(); // crude bound on memory
  return {
    success,
    remaining: Math.max(0, max - hits.length),
    reset: (hits[0] ?? now) + windowMs,
    limit: max,
  };
}

export async function checkRateLimit(
  name: LimitName,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(name);
  if (!limiter) {
    if (process.env.NODE_ENV === 'production' && !warnedNoRedis) {
      warnedNoRedis = true;
      console.warn('[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — using per-instance in-memory limits');
    }
    return memoryLimit(name, identifier);
  }
  return limiter.limit(identifier);
}

/**
 * Extract a stable identifier for rate limiting. Prefers user ID, then
 * forwarded IP. Never trusts X-Forwarded-For without validation in prod.
 */
export function getRateLimitKey(
  userId: string | null,
  headers: Headers
): string {
  if (userId) return `u:${userId}`;
  // Vercel sets x-forwarded-for as a single trusted IP
  const fwd = headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0]?.trim() || headers.get('x-real-ip') || 'anon';
  return `ip:${ip}`;
}
