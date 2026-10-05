import type { NextRequest } from 'next/server';
import {
  OPEN311_DEFAULT_WINDOW_DAYS,
  OPEN311_MAX_RESULTS,
  REPORT_COLUMNS,
  agencyNames,
  isUuid,
  open311Error,
  open311Json,
  open311Options,
  open311RateLimited,
  publicClient,
  toServiceRequest,
  type PublicReport,
} from '@/lib/open311';
import { CATEGORIES } from '@/lib/categories';

const OPEN_STATUSES = ['submitted', 'acknowledged', 'in_progress'];
const CLOSED_STATUSES = ['resolved', 'closed', 'rejected'];

// GET /open311/v2/requests.json
//   ?jurisdiction_id=<authority uuid>  ?service_code=pothole  ?status=open|closed
//   ?start_date=ISO  ?end_date=ISO (default: last 90 days, max 1000 results)
//   ?service_request_id=<uuid>,<uuid>
export async function GET(req: NextRequest) {
  if (await open311RateLimited(req.headers)) return open311Error(429, 'Rate limit exceeded');
  const p = req.nextUrl.searchParams;

  const supabase = publicClient();
  let q = supabase
    .from('reports')
    .select(REPORT_COLUMNS)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(OPEN311_MAX_RESULTS);

  const ids = p.get('service_request_id');
  if (ids) {
    const list = ids.split(',').map((s) => s.trim());
    if (list.length > 100 || !list.every(isUuid)) return open311Error(400, 'Invalid service_request_id');
    q = q.in('id', list);
  } else {
    const end = p.get('end_date') ? new Date(p.get('end_date')!) : new Date();
    const start = p.get('start_date')
      ? new Date(p.get('start_date')!)
      : new Date(end.getTime() - OPEN311_DEFAULT_WINDOW_DAYS * 86_400_000);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return open311Error(400, 'Invalid start_date/end_date');
    }
    q = q.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());

    const jurisdiction = p.get('jurisdiction_id');
    if (jurisdiction) {
      if (!isUuid(jurisdiction)) return open311Error(400, 'Invalid jurisdiction_id');
      q = q.eq('authority_id', jurisdiction);
    }

    const codes = p.get('service_code')?.split(',').map((s) => s.trim());
    if (codes) {
      const known = new Set<string>(CATEGORIES.map((c) => c.key));
      if (!codes.every((c) => known.has(c))) return open311Error(400, 'Unknown service_code');
      q = q.in('category', codes);
    }

    const status = p.get('status');
    if (status === 'open') q = q.in('status', OPEN_STATUSES);
    else if (status === 'closed') q = q.in('status', CLOSED_STATUSES);
    else if (status) return open311Error(400, 'status must be open or closed');
  }

  const { data, error } = await q;
  if (error) return open311Error(500, 'Query failed');
  const rows = (data ?? []) as PublicReport[];
  const agencies = await agencyNames(supabase, rows.map((r) => r.authority_id));
  return open311Json(rows.map((r) => toServiceRequest(r, agencies.get(r.authority_id ?? '') ?? null)));
}

export const OPTIONS = open311Options;
