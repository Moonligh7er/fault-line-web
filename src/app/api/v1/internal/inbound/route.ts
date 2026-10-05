import type { NextRequest } from 'next/server';
import { apiError, apiJson, apiOptions, authenticate } from '@/lib/api-v1';
import { publicClient } from '@/lib/open311';

// GET /api/v1/internal/inbound — replies received from authorities (read:internal).
//   ?status=unmatched|pending_review|applied|dismissed ?limit (≤500)
const STATUSES = new Set(['unmatched', 'pending_review', 'applied', 'dismissed']);

export async function GET(req: NextRequest) {
  const auth = await authenticate(req, 'read:internal');
  if (!auth.ok) return auth.response;

  const status = req.nextUrl.searchParams.get('status');
  if (status && !STATUSES.has(status)) return apiError(400, 'Unknown status');
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get('limit')) || 100, 1), 500);

  const { data, error } = await publicClient().rpc('api_internal_inbound', {
    p_key: auth.key,
    p_status: status,
    p_limit: limit,
  });
  if (error) return apiError(500, 'Query failed');
  return apiJson({ data: data ?? [] });
}

export const OPTIONS = apiOptions;
