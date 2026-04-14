import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCategoryInfo } from '@/lib/categories';
import type { ReportRow, ProfileRow } from '@/lib/types';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/profile');

  const [{ data: profile }, { data: reports }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle<ProfileRow>(),
    supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<ReportRow[]>(),
  ]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          {profile?.display_name ?? user.email}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user.email}</p>
      </header>

      <div
        className="card"
        style={{ display: 'flex', gap: 24, marginBottom: 24 }}
      >
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {profile?.total_reports ?? 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reports</div>
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {profile?.total_upvotes ?? 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Upvotes</div>
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {profile?.points ?? 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Points</div>
        </div>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
        My Reports
      </h2>
      {(!reports || reports.length === 0) && (
        <p style={{ color: 'var(--text-muted)' }}>No reports yet.</p>
      )}
      <div style={{ display: 'grid', gap: 12 }}>
        {reports?.map((r) => {
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
                {r.address ?? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`}
                {' · '}
                {r.upvote_count} upvotes · Status: {r.status}
              </div>
            </Link>
          );
        })}
      </div>

      <form action="/auth/signout" method="post" style={{ marginTop: 32 }}>
        <button type="submit" className="btn btn-outline">
          Sign out
        </button>
      </form>
    </div>
  );
}
