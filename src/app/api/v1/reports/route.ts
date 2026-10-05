import type { NextRequest } from 'next/server';
import { apiError, apiJson, apiOptions, authenticate, dateParam, page, paging } from '@/lib/api-v1';
import { publicClient } from '@/lib/open311';
import { isUuid } from '@/lib/open311';

// GET /api/v1/reports — Fault Line-originated reports, newest first.
//   ?since=ISO ?until=ISO ?status= ?category= ?authority_id=uuid ?state=MA ?cluster_id=uuid
//   ?limit (≤500) ?offset
// Never includes user ids or device-local media paths.
const COLUMNS =
  'id, category, latitude, longitude, address, city, state, zip, description, size_rating, hazard_level, urgency, condition_level, media, status, authority_id, submission_reference, upvote_count, confirm_count, is_anonymous, sensor_detected, is_quick_report, created_at, updated_at, resolved_at';

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth.ok) return auth.response;

  const p = req.nextUrl.searchParams;
  const { limit, offset } = paging(req);
  const since = dateParam(req, 'since');
  const until = dateParam(req, 'until');
  if (since === undefined || until === undefined) return apiError(400, 'since/until must be ISO dates');

  let q = publicClient()
    .from('reports')
    .select(COLUMNS)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (since) q = q.gte('created_at', since);
  if (until) q = q.lte('created_at', until);
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
  const cluster = p.get('cluster_id');
  if (cluster) {
    if (!isUuid(cluster)) return apiError(400, 'cluster_id must be a UUID');
    q = q.eq('submission_reference', cluster);
  }

  const { data, error } = await q;
  if (error) return apiError(500, 'Query failed');
  const rows = (data ?? []).map(({ submission_reference, media, ...r }) => ({
    ...r,
    cluster_id: submission_reference,
    photos: ((media ?? []) as { url?: string; uploadedUrl?: string }[])
      .map((m) => m?.url ?? m?.uploadedUrl)
      .filter((u): u is string => typeof u === 'string' && u.startsWith('https://')),
  }));
  return apiJson(page(rows, limit, offset));
}

export const OPTIONS = apiOptions;
