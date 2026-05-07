import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import QueueList, { type QueueRow } from './queue-list';

export const metadata = {
  title: 'Escalation Queue',
  description: 'Admin view of escalations awaiting manual web-form submission',
  robots: { index: false, follow: false },
};

export default async function EscalationQueuePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin/queue');
  if (!isAdminEmail(user.email)) redirect('/');

  // Pull escalation_log rows that need manual handling, newest first.
  // Joins in the cluster + authority so we can render a complete card per row.
  const { data: rawRows } = await supabase
    .from('escalation_log')
    .select(
      `
      id, cluster_id, authority_id, method, recipient, subject, body, status, sent_at,
      authorities ( name, state, city ),
      report_clusters ( category, address, report_count, unique_reporters,
                        first_reported_at, last_reported_at, max_hazard_level,
                        centroid_latitude, centroid_longitude, city, state )
      `,
    )
    .eq('method', 'web_form_manual')
    .in('status', ['pending', 'sent'])
    .order('created_at', { ascending: false })
    .limit(50);

  const rows: QueueRow[] = (rawRows ?? []).map((r) => {
    // Supabase types the related objects as possibly-array — narrow to single.
    const authority = Array.isArray(r.authorities) ? r.authorities[0] : r.authorities;
    const cluster = Array.isArray(r.report_clusters) ? r.report_clusters[0] : r.report_clusters;
    return {
      id: r.id,
      clusterId: r.cluster_id,
      authorityName: authority?.name ?? '(unknown authority)',
      authorityLocation: [authority?.city, authority?.state].filter(Boolean).join(', '),
      category: cluster?.category ?? '',
      address: cluster?.address ?? '',
      city: cluster?.city ?? '',
      state: cluster?.state ?? '',
      reportCount: cluster?.report_count ?? 0,
      uniqueReporters: cluster?.unique_reporters ?? 0,
      maxHazard: cluster?.max_hazard_level ?? '',
      firstReportedAt: cluster?.first_reported_at ?? '',
      lastReportedAt: cluster?.last_reported_at ?? '',
      latitude: cluster?.centroid_latitude ?? 0,
      longitude: cluster?.centroid_longitude ?? 0,
      webFormUrl: r.recipient, // for method=web_form_manual, recipient holds the URL
      subject: r.subject,
      body: r.body,
      status: r.status,
      sentAt: r.sent_at,
    };
  });

  return (
    <div>
      <header
        style={{
          paddingBottom: 16,
          marginBottom: 24,
          borderBottom: '1px solid var(--rail)',
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: 'var(--amber)',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Admin · Escalation Queue
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1px' }}>
          Clusters awaiting <em style={{ color: 'var(--amber)' }}>manual</em> submission.
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            marginTop: 8,
            fontStyle: 'italic',
            fontSize: 16,
          }}
        >
          These authorities don&apos;t publish an email or API endpoint for escalation —
          only a web form. Copy the prepared body, submit to the form, then mark the row
          resolved.
        </p>
      </header>

      {rows.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: 'center', padding: 48, fontStyle: 'italic', color: 'var(--text-muted)' }}
        >
          Nothing in the queue. All escalations are either sent via email/API or there
          are no ready clusters yet.
        </div>
      ) : (
        <QueueList rows={rows} />
      )}
    </div>
  );
}
