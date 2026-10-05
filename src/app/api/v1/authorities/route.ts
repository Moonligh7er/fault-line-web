import type { NextRequest } from 'next/server';
import { apiError, apiJson, apiOptions, authenticate, page, paging } from '@/lib/api-v1';
import { publicClient } from '@/lib/open311';

// GET /api/v1/authorities — the municipal/state bodies reports are routed to.
//   ?state=MA ?q=<name contains> ?level=city|town|county|state ?limit ?offset
// Boundary polygons are omitted (large); submission methods are public contact info.
const COLUMNS =
  'id, name, level, state, city, county, submission_methods, response_time_avg_days, fix_rate_percent, email_health, is_active, updated_at';

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth.ok) return auth.response;

  const p = req.nextUrl.searchParams;
  const { limit, offset } = paging(req);

  let q = publicClient()
    .from('authorities')
    .select(COLUMNS)
    .order('state')
    .order('name')
    .range(offset, offset + limit - 1);
  const state = p.get('state');
  if (state) q = q.eq('state', state.toUpperCase());
  const level = p.get('level');
  if (level) q = q.eq('level', level);
  const name = p.get('q');
  if (name) {
    if (name.length > 100) return apiError(400, 'q too long');
    q = q.ilike('name', `%${name.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  }

  const { data, error } = await q;
  if (error) return apiError(500, 'Query failed');
  return apiJson(page(data ?? [], limit, offset));
}

export const OPTIONS = apiOptions;
