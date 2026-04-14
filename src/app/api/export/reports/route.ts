import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import type { ReportRow } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * CSV export of public report data. Sensitive fields stripped.
 * Signed-in users only to prevent anonymous scraping.
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const rl = await checkRateLimit('read', getRateLimitKey(user.id, request.headers));
  if (!rl.success) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }

  const url = new URL(request.url);
  const stateParam = url.searchParams.get('state');
  const state =
    stateParam && /^[A-Z]{2}$/.test(stateParam.toUpperCase())
      ? stateParam.toUpperCase()
      : null;

  let query = supabase
    .from('reports')
    .select(
      'id,category,state,city,latitude,longitude,size_rating,hazard_level,status,upvote_count,confirm_count,created_at,resolved_at'
    )
    .order('created_at', { ascending: false })
    .limit(1000);

  if (state) query = query.eq('state', state);

  const { data, error } = await query.returns<Partial<ReportRow>[]>();
  if (error || !data) {
    return new NextResponse('Export failed', { status: 500 });
  }

  // CSV build — escape every field to prevent injection (including =, +, -, @)
  const header = [
    'id',
    'category',
    'state',
    'city',
    'latitude',
    'longitude',
    'size_rating',
    'hazard_level',
    'status',
    'upvote_count',
    'confirm_count',
    'created_at',
    'resolved_at',
  ];

  function esc(value: unknown): string {
    if (value === null || value === undefined) return '';
    let s = String(value);
    // CSV formula injection guard
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  const rows = data.map((r) =>
    header.map((k) => esc((r as Record<string, unknown>)[k])).join(',')
  );
  const csv = [header.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="faultline-reports-${Date.now()}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
