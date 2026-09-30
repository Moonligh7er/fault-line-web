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

export async function checkRateLimit(
  name: LimitName,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(name);
  if (!limiter) {
    // Fail-open in dev when Upstash isn't configured. In production,
    // deployment validation enforces Upstash credentials exist.
    if (process.env.NODE_ENV === 'production') {
      return { success: false, remaining: 0, reset: 0, limit: 0 };
    }
    return { success: true, remaining: 999, reset: 0, limit: 999 };
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
