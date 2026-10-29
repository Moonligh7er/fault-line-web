import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { categoryLabel, formatDate, type CityDashboardData } from '@/lib/city';
import { getCityContext } from './city-context';
import CityTerms from './city-terms';
import AcceptTerms from './accept-terms';
import Table from './table';

export const metadata = { title: 'City dashboard' };
export const dynamic = 'force-dynamic';

const SEVERITY = ['extremely_dangerous', 'dangerous', 'significant', 'moderate', 'minor'];

export default async function CityDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { city, role, accessOpen, termsCurrent } = await getCityContext(id, `/portal/${id}`);

  if (!termsCurrent) {
    return (
      <section className="card" style={{ maxWidth: 760 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>
          {city.terms_accepted_at ? 'Our city terms changed' : 'Before your dashboard opens'}
        </h2>
        <CityTerms city={city} />
        {role === 'owner' ? (
          <AcceptTerms cityId={id} feeWaived={city.fee_waived} />
        ) : (
          <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>
            Your city&apos;s account owner needs to accept these terms. The dashboard opens for everyone once they do.
          </p>
        )}
      </section>
    );
  }
  if (!accessOpen) return null; // the layout explains why and links to billing

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('city_dashboard', { p_city: id });
  if (error || !data) return <p role="alert">Could not load the dashboard: {error?.message}</p>;
  const d = data as CityDashboardData;
  const resolvedPct = d.totals.all ? Math.round((d.totals.resolved / d.totals.all) * 100) : null;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <Stat label="Open reports" value={d.totals.open} />
        <Stat label="Severity-weighted backlog" value={d.weighted_backlog} />
        <Stat label="New in 30 days" value={d.totals.last_30_days} />
        <Stat label="Resolved" value={resolvedPct === null ? '—' : `${resolvedPct}%`} />
        <Stat label="Median days to resolve" value={d.median_days_to_resolve ?? '—'} />
        <Stat label="Escalations (90 days)" value={d.escalations_90d} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <section className="card">
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Open by severity</h2>
          <Table
            head={['Severity', 'Open']}
            rows={SEVERITY.map((s) => [s.replace(/_/g, ' '), d.open_by_severity[s] ?? 0])}
          />
        </section>
        <section className="card">
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>By category</h2>
          <Table
            head={['Category', 'Open', 'All time']}
            rows={d.by_category.slice(0, 12).map((c) => [categoryLabel(c.category), c.open, c.total])}
          />
        </section>
        <section className="card">
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>By ZIP code</h2>
          <Table head={['ZIP', 'Open', 'All time']} rows={d.by_area.slice(0, 12).map((a) => [a.zip, a.open, a.total])} />
        </section>
        <section className="card">
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Last 12 months</h2>
          <Table head={['Month', 'Reported', 'Resolved']} rows={d.monthly.map((m) => [m.month, m.reported, m.resolved])} />
        </section>
      </div>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Open reports (newest first)</h2>
          <Link href={`/portal/${id}/exports`} style={{ fontSize: 14 }}>
            Export CSV or PDF
          </Link>
        </div>
        {d.recent.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No open reports in your jurisdiction.</p>
        ) : (
          <Table
            head={['Reported', 'Category', 'Severity', 'Status', 'Location', 'Confirms']}
            rows={d.recent.map((r) => [
              formatDate(r.created_at),
              <Link key={r.id} href={`/report/${r.id}`}>
                {categoryLabel(r.category)}
              </Link>,
              r.hazard_level.replace(/_/g, ' '),
              r.status.replace(/_/g, ' '),
              r.address ?? r.zip ?? '—',
              r.confirm_count,
            ])}
          />
        )}
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 10 }}>
          Status updates flow back from your 311 / work-order system. Reporter identities are never shown.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card">
      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
