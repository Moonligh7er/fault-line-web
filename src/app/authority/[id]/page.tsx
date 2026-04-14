import { notFound } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCategoryInfo } from '@/lib/categories';
import type { AuthorityRow, ReportRow } from '@/lib/types';

const idSchema = z.string().uuid();

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { title: 'Authority' };

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('authorities')
    .select('name')
    .eq('id', parsed.data)
    .maybeSingle();
  return { title: data?.name ?? 'Authority' };
}

export default async function AuthorityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) notFound();

  const supabase = await createSupabaseServerClient();
  const [{ data: authority }, { data: reports, count }] = await Promise.all([
    supabase
      .from('authorities')
      .select('*')
      .eq('id', parsed.data)
      .maybeSingle<AuthorityRow>(),
    supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('authority_id', parsed.data)
      .order('created_at', { ascending: false })
      .limit(25)
      .returns<ReportRow[]>(),
  ]);

  if (!authority) notFound();

  const resolved = (reports ?? []).filter((r) => r.status === 'resolved').length;
  const fixRate =
    reports && reports.length > 0 ? Math.round((resolved / reports.length) * 100) : null;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Link href="/authority" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
        ← All authorities
      </Link>
      <h1 style={{ fontSize: 32, fontWeight: 900, margin: '12px 0 4px' }}>{authority.name}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        {authority.level} · {authority.state}
        {authority.city ? ` · ${authority.city}` : ''}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase' }}>
            Reports
          </div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{count ?? 0}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase' }}>
            Resolved
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)' }}>{resolved}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase' }}>
            Fix rate
          </div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>
            {fixRate !== null ? `${fixRate}%` : '—'}
          </div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase' }}>
            Avg response
          </div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>
            {authority.response_time_avg_days !== null
              ? `${authority.response_time_avg_days.toFixed(1)}d`
              : '—'}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 20, marginBottom: 12 }}>Recent reports</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {(reports ?? []).map((r) => {
          const info = getCategoryInfo(r.category);
          return (
            <Link
              key={r.id}
              href={`/report/${r.id}`}
              className="card"
              style={{ color: 'var(--text)', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{info?.label ?? r.category}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {r.address ?? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`} · {r.status}
              </div>
            </Link>
          );
        })}
        {(!reports || reports.length === 0) && (
          <p style={{ color: 'var(--text-muted)' }}>No reports for this authority yet.</p>
        )}
      </div>
    </div>
  );
}
