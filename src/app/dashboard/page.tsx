import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCategoryInfo } from '@/lib/categories';
import type { ReportRow } from '@/lib/types';

export const metadata = { title: 'Dashboard' };

interface CategoryCount {
  category: string;
  count: number;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard');

  const [{ data: recent }, { count: totalCount }, { count: openCount }, { count: resolvedCount }] =
    await Promise.all([
      supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
        .returns<ReportRow[]>(),
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'acknowledged', 'in_progress']),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved'),
    ]);

  // Top categories from recent data (server-side aggregate)
  const categoryMap = new Map<string, number>();
  for (const r of recent ?? []) {
    categoryMap.set(r.category, (categoryMap.get(r.category) ?? 0) + 1);
  }
  const topCategories: CategoryCount[] = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Dashboard</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard label="Total reports" value={totalCount ?? 0} />
        <StatCard label="Open" value={openCount ?? 0} accent="var(--accent)" />
        <StatCard label="Resolved" value={resolvedCount ?? 0} accent="var(--success)" />
        <StatCard
          label="Resolution rate"
          value={
            totalCount && totalCount > 0
              ? `${Math.round(((resolvedCount ?? 0) / totalCount) * 100)}%`
              : '—'
          }
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <section className="card">
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Recent reports</h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(recent ?? []).slice(0, 10).map((r) => {
              const info = getCategoryInfo(r.category);
              return (
                <li key={r.id}>
                  <Link
                    href={`/report/${r.id}`}
                    style={{ color: 'var(--text)', fontSize: 14, textDecoration: 'none' }}
                  >
                    <strong>{info?.label ?? r.category}</strong>{' '}
                    <span style={{ color: 'var(--text-muted)' }}>
                      — {r.city ?? 'Unknown'} · {r.status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card">
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Top categories</h2>
          {topCategories.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No data yet.</p>
          )}
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topCategories.map((c) => {
              const info = getCategoryInfo(c.category as never);
              return (
                <li
                  key={c.category}
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>{info?.label ?? c.category}</span>
                  <strong>{c.count}</strong>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="card">
      <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: accent ?? 'var(--text)', marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}
