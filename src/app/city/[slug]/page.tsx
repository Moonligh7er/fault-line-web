import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCityPublic, thresholdsMet, THRESHOLD_LABELS } from '@/lib/city-public';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await getCityPublic(slug);
  return d
    ? { title: `${d.name}: infrastructure responsiveness`, description: `Live backlog, response trend and grade status for ${d.name}, from resident reports on Fault Line.` }
    : { title: 'City not found' };
}

export default async function CityPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await getCityPublic(slug);
  if (!d) notFound();
  const met = thresholdsMet(d);
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'https://app.fault-line.dev';

  return (
    <article style={{ maxWidth: 820 }}>
      <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 4 }}>{d.name}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
        {d.state ? `${d.state} · ` : ''}From resident reports on Fault Line · methodology v{d.methodology_version}
      </p>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Grade</h2>
        {met ? (
          <p>This city has cleared the minimum-data thresholds. Its letter grade is published with the weekly recompute.</p>
        ) : (
          <p>
            <strong>Insufficient data.</strong> A grade is published only once all four thresholds below are met; a
            below-threshold grade would be less useful than none.{' '}
            <a href="https://fault-line.dev/methodology">How grades work</a>
          </p>
        )}
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12, display: 'grid', gap: 6 }}>
          {(Object.keys(d.thresholds) as (keyof typeof d.thresholds)[]).map((k) => {
            const t = d.thresholds[k];
            return (
              <li key={k}>
                {t.have >= t.need ? '✓' : '○'} {THRESHOLD_LABELS[k]}: {t.have} of {t.need}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Backlog right now</h2>
        <p>
          <strong>{d.inputs.open_backlog}</strong> open reports, <strong>{d.inputs.open_dangerous}</strong> rated dangerous
          or worse. Fix rate on escalated issues (90 days):{' '}
          <strong>{d.inputs.fix_rate_pct === null ? 'no escalations yet' : `${d.inputs.fix_rate_pct}%`}</strong>.
        </p>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Response trend (12 months)</h2>
        {d.monthly.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No reports yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['Month', 'Reported', 'Resolved', 'Median days to resolve'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.monthly.map((m) => (
                <tr key={m.month}>
                  <td style={{ padding: 6 }}>{m.month}</td>
                  <td style={{ padding: 6 }}>{m.reported}</td>
                  <td style={{ padding: 6 }}>{m.resolved}</td>
                  <td style={{ padding: 6 }}>{m.median_days_to_resolve ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <details>
        <summary style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>Embed this page on a city website</summary>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 8 }}>
          {`<iframe src="${origin}/embed/city/${d.slug}" title="${d.name} on Fault Line" width="100%" height="420" style="border:0"></iframe>`}
        </pre>
      </details>
    </article>
  );
}
