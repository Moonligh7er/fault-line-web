import { NextResponse, type NextRequest } from 'next/server';
import { publicClient } from './open311';
import { dbRateLimitHit, getRateLimitKey } from './rate-limit';

// Keyed read API (/api/v1) for AI agents, tools and partners.
// Keys are issued on /admin/api-keys and verified in the database
// (verify_api_key: hashed lookup, usage-counted, daily cap). Scopes:
//   read:public   — reports, clusters, authorities, escalation record
//   read:internal — additionally the outbound queue and inbound replies

export type Scope = 'read:public' | 'read:internal';

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
};

export function apiJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: HEADERS });
}

export function apiError(status: number, error: string) {
  return apiJson({ error }, status);
}

export function apiOptions() {
  return new NextResponse(null, { status: 204, headers: HEADERS });
}

export type AuthResult =
  | { ok: true; key: string; scopes: Scope[] }
  | { ok: false; response: NextResponse };

// Failed key checks per client IP: past FAILED_AUTH_MAX in the window the IP
// gets 429s. Counted in the database (rate_limit_hit) so every instance
// shares it; each instance also remembers a tripped IP so it stops calling
// verify_api_key for it at all.
const FAILED_AUTH_MAX = 20;
const FAILED_AUTH_WINDOW_S = 15 * 60;
const blockedUntil = new Map<string, number>();

function isBlocked(ip: string): boolean {
  const until = blockedUntil.get(ip);
  if (until === undefined) return false;
  if (until > Date.now()) return true;
  blockedUntil.delete(ip);
  return false;
}

async function noteFailedAuth(ip: string): Promise<boolean> {
  const allowed = await dbRateLimitHit('api_key_fail', ip, FAILED_AUTH_MAX, FAILED_AUTH_WINDOW_S);
  if (allowed !== false) return false;
  if (blockedUntil.size >= 10_000) blockedUntil.clear();
  blockedUntil.set(ip, Date.now() + FAILED_AUTH_WINDOW_S * 1000);
  return true;
}

const tooManyFailures = () => apiError(429, 'Too many failed key checks. Try again later.');

export async function authenticate(req: NextRequest, required: Scope = 'read:public'): Promise<AuthResult> {
  const header = req.headers.get('authorization') ?? '';
  const key = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!key) return { ok: false, response: apiError(401, 'Missing API key (Authorization: Bearer flk_...)') };

  const ip = getRateLimitKey(null, req.headers);
  if (isBlocked(ip)) return { ok: false, response: tooManyFailures() };

  const { data, error } = await publicClient().rpc('verify_api_key', { p_key: key });
  const row = (data as { status: string; scopes: Scope[] | null }[] | null)?.[0];
  if (error || !row) return { ok: false, response: apiError(503, 'Key check unavailable') };
  if (row.status === 'over_limit') return { ok: false, response: apiError(429, 'Daily request limit reached for this key') };
  if (row.status !== 'ok' || !row.scopes) {
    if (await noteFailedAuth(ip)) return { ok: false, response: tooManyFailures() };
    return { ok: false, response: apiError(401, 'Invalid or revoked API key') };
  }
  if (!row.scopes.includes(required)) return { ok: false, response: apiError(403, `Scope ${required} required`) };
  return { ok: true, key, scopes: row.scopes };
}

/** Deep offsets are slow scans; past this, page with `since` instead. */
export const MAX_OFFSET = 10_000;

/** limit (1..max, default 100) and offset (0..MAX_OFFSET) from the query string. */
export function paging(req: NextRequest, max = 500) {
  const p = req.nextUrl.searchParams;
  const limit = Math.floor(Math.min(Math.max(Number(p.get('limit')) || 100, 1), max));
  const offset = Math.floor(Math.min(Math.max(Number(p.get('offset')) || 0, 0), MAX_OFFSET));
  return { limit, offset };
}

/** ISO date param or null; `undefined` signals a malformed value. */
export function dateParam(req: NextRequest, name: string): string | null | undefined {
  const raw = req.nextUrl.searchParams.get(name);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function page<T>(data: T[], limit: number, offset: number) {
  const more = data.length === limit && offset + limit <= MAX_OFFSET;
  return { data, limit, offset, next_offset: more ? offset + limit : null };
}
