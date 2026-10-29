import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { TIERS, cityPriceCents, formatDate, formatUsd, type CityAccount } from '@/lib/city';
import { CreateCityForm, CityRowControls } from './city-forms';

export const metadata = { title: 'City accounts', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminCitiesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/cities');
  if (!(await isAdmin(supabase))) redirect('/');

  const [{ data: cities }, { data: invites }] = await Promise.all([
    supabase.from('city_accounts').select('*').order('created_at', { ascending: false }).returns<CityAccount[]>(),
    supabase.from('city_invites').select('city_account_id, email, role, accepted_at'),
  ]);
  const billingLive = !!process.env.STRIPE_SECRET_KEY;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>City accounts</h1>
      {!billingLive && (
        <p className="card" role="status">
          Billing is not configured (STRIPE_SECRET_KEY unset): pilots run and end normally, but no invoice can be sent.
        </p>
      )}
      <section className="card">
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>New city account</h2>
        <CreateCityForm />
      </section>
      {(cities ?? []).map((c) => (
        <section key={c.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: 18 }}>
              <Link href={`/portal/${c.id}`}>{c.display_name}</Link>
            </h2>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {TIERS[c.tier].label} · {c.status}
              {c.fee_waived ? ' · fee waived' : ` · ${formatUsd(cityPriceCents(c))}/yr`}
            </span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '6px 0' }}>
            Pilot ends {formatDate(c.pilot_ends_at)} · renewal {c.auto_renew === null ? 'not chosen' : c.auto_renew ? 'on' : 'off'} · terms{' '}
            {c.terms_accepted_at ? `accepted ${formatDate(c.terms_accepted_at)}` : 'not yet accepted'}
            {c.current_period_end ? ` · term ends ${formatDate(c.current_period_end)}` : ''} ·{' '}
            <Link href={`/city/${c.slug}`}>public page</Link>
          </p>
          <p style={{ fontSize: 13, marginBottom: 8 }}>
            {(invites ?? [])
              .filter((i) => i.city_account_id === c.id)
              .map((i) => `${i.email} (${i.role}${i.accepted_at ? '' : ', invited'})`)
              .join(' · ') || 'No members'}
          </p>
          <CityRowControls cityId={c.id} feeWaived={c.fee_waived} waiverNote={c.fee_waiver_note ?? ''} />
        </section>
      ))}
    </div>
  );
}
