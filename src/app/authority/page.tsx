import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { AuthorityRow } from '@/lib/types';

export const metadata = {
  title: 'Authorities',
  description: 'Local government authorities responsible for infrastructure.',
};

export default async function AuthoritiesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: authorities } = await supabase
    .from('authorities')
    .select('*')
    .eq('is_active', true)
    .order('state', { ascending: true })
    .order('name', { ascending: true })
    .returns<AuthorityRow[]>();

  // Group by state
  const byState = new Map<string, AuthorityRow[]>();
  for (const a of authorities ?? []) {
    const arr = byState.get(a.state) ?? [];
    arr.push(a);
    byState.set(a.state, arr);
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>Authorities</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Government entities responsible for infrastructure in covered regions.
      </p>

      {(!authorities || authorities.length === 0) && (
        <p style={{ color: 'var(--text-muted)' }}>No authorities listed yet.</p>
      )}

      {Array.from(byState.entries()).map(([state, list]) => (
        <section key={state} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>{state}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {list.map((a) => (
              <Link
                key={a.id}
                href={`/authority/${a.id}`}
                className="card"
                style={{ color: 'var(--text)', textDecoration: 'none' }}
              >
                <strong>{a.name}</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                  {a.level}
                  {a.city ? ` · ${a.city}` : ''}
                </div>
                {a.response_time_avg_days !== null && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                    Avg response: {a.response_time_avg_days.toFixed(1)}d
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
