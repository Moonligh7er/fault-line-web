import { createSupabaseServerClient } from '@/lib/supabase/server';
import { categoryLabel } from '@/lib/city';
import { getCityContext } from '../city-context';
import Table from '../table';

export const metadata = { title: 'Pre-deployment report' };
export const dynamic = 'force-dynamic';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Prediction {
  lat: number;
  lng: number;
  category: string;
  address: string | null;
  reports: number;
  years_recurring: number;
  typical_months: number[];
  confidence: number;
  priority: 'high' | 'moderate' | 'watch';
}

export default async function PredeploymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { accessOpen, termsCurrent } = await getCityContext(id, `/portal/${id}/predeployment`);
  if (!accessOpen || !termsCurrent) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('city_predeployment', { p_city: id });
  if (error) return <p role="alert">Could not load the report: {error.message}</p>;
  const rows = (data ?? []) as Prediction[];

  return (
    <section className="card">
      <h2 style={{ fontSize: 18, marginBottom: 6 }}>Where issues are likely to recur in the next three months</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
        Built from your jurisdiction&apos;s own report history: ~200 m cells with reports in two or more years, or three
        or more reports, whose usual months fall in the coming quarter. It is a pattern in past reports, not an
        engineering forecast, so use it to plan inspections and stage materials. It gets sharper as history builds up.
      </p>
      {rows.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Not enough history yet. Patterns appear once locations repeat.</p>
      ) : (
        <Table
          head={['Priority', 'Category', 'Location', 'Reports', 'Years', 'Usual months', 'Confidence']}
          rows={rows.map((r) => [
            r.priority,
            categoryLabel(r.category),
            r.address ?? `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`,
            r.reports,
            r.years_recurring,
            [...r.typical_months].sort((a, b) => a - b).map((m) => MONTHS[m - 1]).join(', '),
            `${Math.round(r.confidence * 100)}%`,
          ])}
        />
      )}
    </section>
  );
}
