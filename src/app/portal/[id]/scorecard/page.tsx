import { createSupabaseServerClient } from '@/lib/supabase/server';
import { categoryLabel, formatDate } from '@/lib/city';
import { getCityContext } from '../city-context';
import Table from '../table';
import ContractorField from './contractor-field';

export const metadata = { title: 'Contractor scorecard' };
export const dynamic = 'force-dynamic';

interface Row { contractor: string; fixes: number; reopened: number; reopen_rate: number; median_days_to_fix: number | null }
interface Fixed { id: string; category: string; address: string | null; resolved_at: string; contractor_name: string | null; report_count: number }

export default async function ScorecardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { accessOpen, termsCurrent } = await getCityContext(id, `/portal/${id}/scorecard`);
  if (!accessOpen || !termsCurrent) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: score, error }, { data: fixed }] = await Promise.all([
    supabase.rpc('city_scorecard', { p_city: id, p_days: 365 }),
    supabase.rpc('city_resolved_clusters', { p_city: id }),
  ]);
  if (error) return <p role="alert">Could not load the scorecard: {error.message}</p>;
  const rows = (score ?? []) as Row[];
  const clusters = (fixed ?? []) as Fixed[];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section className="card">
        <h2 style={{ fontSize: 18, marginBottom: 6 }}>Recurrence by contractor (last 12 months)</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          A fix counts as reopened when a new report of the same kind lands within 25 m within 180 days of it being
          marked resolved, the same window the grading methodology uses. Tag fixes with the contractor below.
        </p>
        {rows.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No resolved issues yet.</p>
        ) : (
          <Table
            head={['Contractor', 'Fixes', 'Reopened', 'Reopen rate', 'Median days to fix']}
            rows={rows.map((r) => [r.contractor, r.fixes, r.reopened, `${r.reopen_rate}%`, r.median_days_to_fix ?? '—'])}
          />
        )}
      </section>
      <section className="card">
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Resolved issues</h2>
        {clusters.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nothing resolved yet.</p>
        ) : (
          <Table
            head={['Resolved', 'Category', 'Location', 'Reports', 'Contractor']}
            rows={clusters.map((c) => [
              formatDate(c.resolved_at),
              categoryLabel(c.category),
              c.address ?? '—',
              c.report_count,
              <ContractorField key={c.id} cityId={id} clusterId={c.id} initial={c.contractor_name ?? ''} />,
            ])}
          />
        )}
      </section>
    </div>
  );
}
