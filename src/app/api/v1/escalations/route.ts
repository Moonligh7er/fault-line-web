import type { NextRequest } from 'next/server';
import { apiError, apiJson, apiOptions, authenticate, dateParam, page, paging } from '@/lib/api-v1';
import { isUuid, publicClient } from '@/lib/open311';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

// GET /api/v1/escalations — the record of notices sent to authorities.
//   ?cluster_id=uuid ?authority_id=uuid ?since=ISO (sent_at) ?limit ?offset
// escalation_log is admin-only. read:public keys get the public_escalations()
// RPC (no recipient, subject or body); read:internal keys also get those,
// read with the service role only after authenticate() checked the scope.
const INTERNAL_COLUMNS =
  'id, cluster_id, authority_id, method, recipient, subject, body, status, sent_at, delivered_at, external_ticket_id, external_status, last_status_check_at, bounced_at, bounce_type, created_at';

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth.ok) return auth.response;

  const p = req.nextUrl.searchParams;
  const { limit, offset } = paging(req);
  const since = dateParam(req, 'since');
  if (since === undefined) return apiError(400, 'since must be an ISO date');
  const filters: Record<'cluster_id' | 'authority_id', string | null> = { cluster_id: null, authority_id: null };
  for (const f of ['cluster_id', 'authority_id'] as const) {
    const v = p.get(f);
    if (v) {
      if (!isUuid(v)) return apiError(400, `${f} must be a UUID`);
      filters[f] = v;
    }
  }

  if (!auth.scopes.includes('read:internal')) {
    const { data, error } = await publicClient().rpc('public_escalations', {
      p_cluster_id: filters.cluster_id,
      p_authority_id: filters.authority_id,
      p_since: since,
      p_limit: limit,
      p_offset: offset,
    });
    if (error) {
      console.error('[api/v1/escalations] public_escalations', error);
      return apiError(500, 'Query failed');
    }
    return apiJson(page((data ?? []) as unknown[], limit, offset));
  }

  let q = createSupabaseServiceClient()
    .from('escalation_log')
    .select(INTERNAL_COLUMNS)
    .order('sent_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);
  if (since) q = q.gte('sent_at', since);
  if (filters.cluster_id) q = q.eq('cluster_id', filters.cluster_id);
  if (filters.authority_id) q = q.eq('authority_id', filters.authority_id);

  const { data, error } = await q;
  if (error) {
    console.error('[api/v1/escalations] internal', error);
    return apiError(500, 'Query failed');
  }
  return apiJson(page(data ?? [], limit, offset));
}

export const OPTIONS = apiOptions;
