import type { NextRequest } from 'next/server';
import {
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

// GET /open311/v2/requests/<uuid>.json — one request, as a one-item array (per spec).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (await open311RateLimited(req.headers)) return open311Error(429, 'Rate limit exceeded');
  const { id: raw } = await params;
  const id = raw.replace(/\.json$/i, '');
  if (!isUuid(id)) return open311Error(400, 'Invalid service_request_id');

  const supabase = publicClient();
  const { data } = await supabase
    .from('reports')
    .select(REPORT_COLUMNS)
    .eq('id', id)
    .neq('status', 'draft')
    .maybeSingle();
  if (!data) return open311Error(404, 'Service request not found');

  const report = data as PublicReport;
  const agencies = await agencyNames(supabase, [report.authority_id]);
  return open311Json([toServiceRequest(report, agencies.get(report.authority_id ?? '') ?? null)]);
}

export const OPTIONS = open311Options;
