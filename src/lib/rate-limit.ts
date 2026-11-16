import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createSupabaseServiceClient } from './supabase/server';

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

// Buckets that refuse requests when no shared limiter can be reached:
// sign-in emails and the paid TTS endpoint must never run unmetered.
const FAIL_CLOSED = new Set<LimitName>(['auth', 'tts', 'tts_global']);

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

const UNIT_MS: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

function windowOf(name: LimitName): { max: number; windowMs: number } {
  const [max, window] = windows[name] as [number, string];
  const [amount, unit] = window.split(' ');
  return { max, windowMs: Number(amount) * (UNIT_MS[unit ?? ''] ?? 60_000) };
}

/**
 * One hit against the database limiter (rate_limit_hit, service role only).
 * true = allowed and recorded, false = over the limit, null = the database
 * couldn't be asked (no service key, network or RPC error).
 */
export async function dbRateLimitHit(
  bucket: string,
  key: string,
  max: number,
  windowSeconds: number
): Promise<boolean | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const { data, error } = await createSupabaseServiceClient().rpc('rate_limit_hit', {
      p_bucket: bucket,
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error || typeof data !== 'boolean') {
      console.error('[rate-limit] rate_limit_hit failed', bucket, error);
      return null;
    }
    return data;
  } catch (e) {
    console.error('[rate-limit] rate_limit_hit threw', bucket, e);
    return null;
  }
}

// Last resort (no Upstash, no service key — local dev and tests — or the
// database call failed for a fail-open bucket): a per-instance in-memory
// sliding window. Bounded: the least recently used keys are evicted first.
const MAX_MEMORY_KEYS = 10_000;
const memoryHits = new Map<string, number[]>();
let warnedNoRedis = false;

function memoryLimit(name: LimitName, identifier: string): RateLimitResult {
  const { max, windowMs } = windowOf(name);
  const now = Date.now();
  const key = `${name}:${identifier}`;
  const hits = (memoryHits.get(key) ?? []).filter((t) => now - t < windowMs);
  const success = hits.length < max;
  if (success) hits.push(now);
  // Re-insert so Map order tracks recency, then trim the oldest entries.
  memoryHits.delete(key);
  memoryHits.set(key, hits);
  while (memoryHits.size > MAX_MEMORY_KEYS) {
    const oldest = memoryHits.keys().next().value;
    if (oldest === undefined) break;
    memoryHits.delete(oldest);
  }
  return {
    success,
    remaining: Math.max(0, max - hits.length),
    reset: (hits[0] ?? now) + windowMs,
    limit: max,
  };
}

/** Test hook: number of keys the in-memory fallback is holding. */
export function memoryKeyCount(): number {
  return memoryHits.size;
}

export async function checkRateLimit(
  name: LimitName,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(name);
  if (limiter) return limiter.limit(identifier);

  if (process.env.NODE_ENV === 'production' && !warnedNoRedis) {
    warnedNoRedis = true;
    console.warn('[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — using the database limiter');
  }

  // Shared across instances: the database limiter.
  const { max, windowMs } = windowOf(name);
  const allowed = await dbRateLimitHit(`web:${name}`, identifier, max, Math.round(windowMs / 1000));
  if (allowed !== null) {
    // The RPC answers yes/no only; `remaining` is a floor, not a count.
    return { success: allowed, remaining: allowed ? 1 : 0, reset: Date.now() + windowMs, limit: max };
  }
  if (FAIL_CLOSED.has(name) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, remaining: 0, reset: Date.now() + windowMs, limit: max };
  }
  return memoryLimit(name, identifier);
}

/**
 * Rate-limit key for an IP. IPv6 is keyed by its /64 (one subscriber's
 * allocation), so rotating through addresses in a prefix doesn't help.
 */
export function ipKey(raw: string): string {
  let ip = raw.trim().toLowerCase();
  if (ip.startsWith('[')) ip = ip.slice(1, ip.indexOf(']') > 0 ? ip.indexOf(']') : undefined);
  ip = ip.split('%')[0] ?? ip; // zone id
  if (!ip.includes(':')) return ip;

  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(ip);
  if (mapped) return mapped[1]!;

  const expand = (part: string) =>
    part ? part.split(':').flatMap((g) => (g.includes('.') ? ['0', '0'] : [g])) : [];
  let groups: string[];
  if (ip.includes('::')) {
    const [head = '', tail = ''] = ip.split('::');
    const h = expand(head);
    const t = expand(tail);
    groups = [...h, ...Array<string>(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t];
  } else {
    groups = expand(ip);
  }
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return ip;
  return `${groups
    .slice(0, 4)
    .map((g) => parseInt(g, 16).toString(16))
    .join(':')}::/64`;
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
  return `ip:${ipKey(ip)}`;
}
