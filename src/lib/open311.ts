import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { CATEGORIES, getCategoryInfo } from './categories';
import { env } from './env';
import { checkRateLimit, getRateLimitKey } from './rate-limit';
import type { ReportRow } from './types';

// Open311 GeoReport v2 (read-only) — http://wiki.open311.org/GeoReport_v2/
//
// Publishes ONLY reports that originated in Fault Line (the `reports` table,
// written by our web + mobile clients). If we ever ingest a city's own 311
// data, it goes in a separate table and is never served from here.
//
// JSON only. `jurisdiction_id` scopes results to one authority (its UUID in
// our `authorities` table) — the natural way for a city to pull "its" reports.

export const OPEN311_MAX_RESULTS = 1000;
export const OPEN311_DEFAULT_WINDOW_DAYS = 90;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLOSED_STATUSES = new Set(['resolved', 'closed', 'rejected']);

export const REPORT_COLUMNS =
  'id, category, latitude, longitude, address, zip, description, hazard_level, media, status, authority_id, created_at, updated_at, resolved_at';

export type PublicReport = Pick<
  ReportRow,
  | 'id' | 'category' | 'latitude' | 'longitude' | 'address' | 'zip' | 'description'
  | 'hazard_level' | 'media' | 'status' | 'authority_id' | 'created_at' | 'updated_at' | 'resolved_at'
>;

export interface ServiceRequest {
  service_request_id: string;
  status: 'open' | 'closed';
  status_notes: string;
  service_name: string;
  service_code: string;
  description: string | null;
  agency_responsible: string | null;
  service_notice: string;
  requested_datetime: string;
  updated_datetime: string;
  expected_datetime: null;
  address: string | null;
  address_id: null;
  zipcode: string | null;
  lat: number;
  long: number;
  media_url: string | null;
}

export function isUuid(value: string | null | undefined): value is string {
  return !!value && UUID_RE.test(value);
}

export function services() {
  return CATEGORIES.map((c) => ({
    service_code: c.key,
    service_name: c.label,
    description: c.description,
    metadata: false,
    type: 'realtime',
    keywords: '',
    group: 'infrastructure',
  }));
}

export function toServiceRequest(r: PublicReport, agencyName: string | null): ServiceRequest {
  // Web rows store { url }, mobile rows { uploadedUrl, uri } — never expose a
  // device-local `uri`, only hosted https URLs.
  const photo = (r.media ?? [])
    .map((m) => (m as { url?: string; uploadedUrl?: string })?.url ?? (m as { uploadedUrl?: string })?.uploadedUrl)
    .find((u): u is string => typeof u === 'string' && u.startsWith('https://'));
  return {
    service_request_id: r.id,
    status: CLOSED_STATUSES.has(r.status) ? 'closed' : 'open',
    status_notes: `Fault Line status: ${r.status}; hazard: ${r.hazard_level}`,
    service_name: getCategoryInfo(r.category)?.label ?? r.category,
    service_code: r.category,
    description: r.description,
    agency_responsible: agencyName,
    service_notice: 'Community report submitted via Fault Line (fault-line.dev)',
    requested_datetime: r.created_at,
    updated_datetime: r.updated_at,
    expected_datetime: null,
    address: r.address,
    address_id: null,
    zipcode: r.zip,
    lat: r.latitude,
    long: r.longitude,
    media_url: photo ?? null,
  };
}

/** Anonymous, cookie-less client: the feed only ever sees what RLS lets the public see. */
export function publicClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function agencyNames(
  client: ReturnType<typeof publicClient>,
  ids: (string | null)[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  if (unique.length === 0) return new Map();
  const { data } = await client.from('authorities').select('id, name').in('id', unique);
  return new Map((data ?? []).map((a: { id: string; name: string }) => [a.id, a.name]));
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, max-age=300',
};

export function open311Json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

/** Open311 errors are an array of { code, description }. */
export function open311Error(status: number, description: string) {
  return open311Json([{ code: status, description }], status);
}

export function open311Options() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function open311RateLimited(headers: Headers): Promise<boolean> {
  const rl = await checkRateLimit('read', getRateLimitKey(null, headers));
  return !rl.success;
}
