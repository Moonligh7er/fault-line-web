import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCityContext } from '../city-context';
import type { CityDashboardData } from '@/lib/city';
import PdfButton, { type PdfData } from './pdf-button';

export const metadata = { title: 'Exports' };
export const dynamic = 'force-dynamic';

export default async function ExportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { city, accessOpen, termsCurrent } = await getCityContext(id, `/portal/${id}/exports`);
  if (!accessOpen || !termsCurrent) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: dash }, { data: score }, { data: pre }] = await Promise.all([
    supabase.rpc('city_dashboard', { p_city: id }),
    supabase.rpc('city_scorecard', { p_city: id, p_days: 365 }),
    supabase.rpc('city_predeployment', { p_city: id }),
  ]);
  const pdf: PdfData = {
    city: city.display_name,
    dashboard: dash as CityDashboardData,
    scorecard: (score ?? []) as PdfData['scorecard'],
    predeployment: (pre ?? []) as PdfData['predeployment'],
  };

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 760 }}>
      <section className="card">
        <h2 style={{ fontSize: 18, marginBottom: 6 }}>Council &amp; grant packet (PDF)</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          Open backlog, severity distribution, category and ZIP-code density, the 12-month trend, the contractor
          recurrence scorecard and the pre-deployment list, laid out for a council packet or a funding application.
        </p>
        <PdfButton data={pdf} />
      </section>
      <section className="card">
        <h2 style={{ fontSize: 18, marginBottom: 6 }}>All reports (CSV)</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          Every report in your jurisdiction, one row each, with location, category, severity, status and dates. No
          reporter identity is included. Opens in Excel or any GIS tool.
        </p>
        <a className="btn btn-outline" href={`/portal/${id}/exports/csv`}>
          Download CSV
        </a>
      </section>
    </div>
  );
}
