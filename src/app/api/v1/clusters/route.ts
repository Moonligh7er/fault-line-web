import type { NextRequest } from 'next/server';
import { apiError, apiJson, apiOptions, authenticate, dateParam, page, paging } from '@/lib/api-v1';
import { isUuid, publicClient } from '@/lib/open311';

// GET /api/v1/clusters — groups of reports about the same issue.
//   ?status= ?authority_id=uuid ?state=MA ?category= ?since=ISO (last_reported_at) ?limit ?offset
const COLUMNS =
  'id, category, centroid_latitude, centroid_longitude, radius_meters, report_count, unique_reporters, max_hazard_level, status, authority_id, city, state, address, first_reported_at, last_reported_at, submitted_at, escalated_at, submission_method, resolved_at, created_at, updated_at';

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth.ok) return auth.response;

  const p = req.nextUrl.searchParams;
  const { limit, offset } = paging(req);
  const since = dateParam(req, 'since');
  if (since === undefined) return apiError(400, 'since must be an ISO date');

  let q = publicClient()
    .from('report_clusters')
    .select(COLUMNS)
    .order('last_reported_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);
  if (since) q = q.gte('last_reported_at', since);
  for (const f of ['status', 'category'] as const) {
    const v = p.get(f);
    if (v) q = q.eq(f, v);
  }
  const state = p.get('state');
  if (state) q = q.eq('state', state.toUpperCase());
  const authority = p.get('authority_id');
  if (authority) {
    if (!isUuid(authority)) return apiError(400, 'authority_id must be a UUID');
    q = q.eq('authority_id', authority);
  }

  const { data, error } = await q;
  if (error) return apiError(500, 'Query failed');
  return apiJson(page(data ?? [], limit, offset));
}

export const OPTIONS = apiOptions;
