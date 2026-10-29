import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/city';

export const metadata = { title: 'City portal', robots: { index: false, follow: false } };

interface MyCity {
  id: string;
  slug: string;
  display_name: string;
  role: 'owner' | 'staff';
  status: string;
  pilot_ends_at: string | null;
  access_open: boolean;
}

export default async function PortalHome() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/portal');

  // Invites are matched to the signed-in (already verified) email address.
  await supabase.rpc('claim_city_invites');
  const { data } = await supabase.rpc('my_city_accounts');
  const cities = (data ?? []) as MyCity[];
  if (cities.length === 1) redirect(`/portal/${cities[0]!.id}`);

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>City portal</h1>
      {cities.length === 0 ? (
        <div className="card">
          <p style={{ marginBottom: 12 }}>
            This account isn&apos;t linked to a city yet. City accounts are set up after a demo call; staff are
            added by email, and signing in with that address links you automatically.
          </p>
          <p style={{ color: 'var(--text-muted)' }}>
            Signed in as {user.email}. Wrong address? <Link href="/auth/signout">Sign out</Link> and sign in with
            the one your city was invited with, or see <a href="https://fault-line.dev/cities">For cities</a>.
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
          {cities.map((c) => (
            <li key={c.id} className="card">
              <Link href={`/portal/${c.id}`} style={{ fontWeight: 700, fontSize: 18 }}>
                {c.display_name}
              </Link>
              <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                {c.role} · {c.status}
                {c.status === 'pilot' && c.pilot_ends_at ? ` · pilot ends ${formatDate(c.pilot_ends_at)}` : ''}
                {c.access_open ? '' : ' · access paused'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
