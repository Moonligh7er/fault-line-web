import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEADER = [
  'id', 'category', 'status', 'hazard_level', 'size_rating', 'address', 'city', 'zip', 'latitude', 'longitude',
  'confirm_count', 'upvote_count', 'cluster_id', 'created_at', 'resolved_at',
] as const;

function esc(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // formula-injection guard
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Every report in the city's jurisdiction (no reporter identity), paged past the 5,000-row RPC cap. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const lines: string[] = [HEADER.join(',')];
  let after: string | null = null;
  for (let page = 0; page < 40; page++) {
    const { data, error } = await supabase.rpc('city_export_rows', { p_city: id, p_after: after, p_limit: 5000 });
    if (error) return new NextResponse(error.message, { status: error.code === '42501' || error.code === 'P0402' ? 403 : 500 });
    const rows = (data ?? []) as Record<string, unknown>[];
    for (const r of rows) lines.push(HEADER.map((k) => esc(r[k])).join(','));
    if (rows.length < 5000) break;
    after = String(rows[rows.length - 1]!.created_at);
  }

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="fault-line-reports-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
