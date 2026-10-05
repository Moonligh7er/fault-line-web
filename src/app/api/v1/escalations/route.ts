import type { NextRequest } from 'next/server';
import { apiError, apiJson, apiOptions, authenticate, dateParam, page, paging } from '@/lib/api-v1';
import { isUuid, publicClient } from '@/lib/open311';

// GET /api/v1/escalations — the record of notices sent to authorities.
//   ?cluster_id=uuid ?authority_id=uuid ?since=ISO (sent_at) ?limit ?offset
// Message bodies are included only for keys with read:internal.
const BASE =
  'id, cluster_id, authority_id, method, recipient, subject, status, sent_at, external_ticket_id, external_status, last_status_check_at, delivered_at, bounced_at, bounce_type';

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth.ok) return auth.response;

  const p = req.nextUrl.searchParams;
  const { limit, offset } = paging(req);
  const since = dateParam(req, 'since');
  if (since === undefined) return apiError(400, 'since must be an ISO date');

  const columns = auth.scopes.includes('read:internal') ? `${BASE}, body` : BASE;
  let q = publicClient()
    .from('escalation_log')
    .select(columns)
    .order('sent_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);
  if (since) q = q.gte('sent_at', since);
  for (const f of ['cluster_id', 'authority_id'] as const) {
    const v = p.get(f);
    if (v) {
      if (!isUuid(v)) return apiError(400, `${f} must be a UUID`);
      q = q.eq(f, v);
    }
  }

  const { data, error } = await q;
  if (error) return apiError(500, 'Query failed');
  return apiJson(page(data ?? [], limit, offset));
}

export const OPTIONS = apiOptions;
