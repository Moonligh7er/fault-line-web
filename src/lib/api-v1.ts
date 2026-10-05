import { NextResponse, type NextRequest } from 'next/server';
import { publicClient } from './open311';

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

export async function authenticate(req: NextRequest, required: Scope = 'read:public'): Promise<AuthResult> {
  const header = req.headers.get('authorization') ?? '';
  const key = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!key) return { ok: false, response: apiError(401, 'Missing API key (Authorization: Bearer flk_...)') };

  const { data, error } = await publicClient().rpc('verify_api_key', { p_key: key });
  const row = (data as { status: string; scopes: Scope[] | null }[] | null)?.[0];
  if (error || !row) return { ok: false, response: apiError(503, 'Key check unavailable') };
  if (row.status === 'over_limit') return { ok: false, response: apiError(429, 'Daily request limit reached for this key') };
  if (row.status !== 'ok' || !row.scopes) return { ok: false, response: apiError(401, 'Invalid or revoked API key') };
  if (!row.scopes.includes(required)) return { ok: false, response: apiError(403, `Scope ${required} required`) };
  return { ok: true, key, scopes: row.scopes };
}

/** limit (1..max, default 100) and offset (>=0) from the query string. */
export function paging(req: NextRequest, max = 500) {
  const p = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(p.get('limit')) || 100, 1), max);
  const offset = Math.max(Number(p.get('offset')) || 0, 0);
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
  return { data, limit, offset, next_offset: data.length === limit ? offset + limit : null };
}
