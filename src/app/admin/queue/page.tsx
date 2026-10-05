import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import QueueList, { type QueueRow } from './queue-list';
import { AutoSendToggle, OutboundReviewList, type OutboundRow } from './outbound-review';
import { InboundReviewList, ReplySettings, type InboundRow } from './inbound-review';

export const metadata = {
  title: 'Outbound Queue',
  description: 'Admin review of outbound messages to authorities',
  robots: { index: false, follow: false },
};

export default async function EscalationQueuePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin/queue');
  if (!(await isAdmin(supabase))) redirect('/');

  // Outbound review queue (migration 025). RLS lets only admins read these.
  const [{ data: settingsRows }, { data: pendingRaw }, { data: recentRaw }, { data: inboundRaw }] = await Promise.all([
    supabase.from('app_settings').select('key, value'),
    supabase
      .from('outbound_messages')
      .select('id, ref, kind, methods, subject, body, created_at, authorities ( name )')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true })
      .limit(100),
    supabase
      .from('outbound_messages')
      .select('ref, kind, status, sent_method, sent_recipient, error, reviewed_by, updated_at')
      .in('status', ['sent', 'failed', 'rejected', 'sending', 'approved'])
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('inbound_messages')
      .select('id, ref, from_address, subject, reply_excerpt, suggested_status, outbound_id, received_at')
      .in('status', ['pending_review', 'unmatched'])
      .order('received_at', { ascending: false })
      .limit(100),
  ]);
  const setting = (key: string) => (settingsRows ?? []).find((r) => r.key === key)?.value;
  const autoSend = setting('auto_send') === true;
  const autoApply = setting('auto_apply_replies') === true;
  const replyToValue = setting('reply_to');
  const replyTo = typeof replyToValue === 'string' ? replyToValue : '';
  const inbound: InboundRow[] = (inboundRaw ?? []).map((r) => ({
    id: r.id,
    ref: r.ref,
    from: r.from_address,
    subject: r.subject,
    excerpt: r.reply_excerpt,
    suggested: r.suggested_status,
    matched: !!r.outbound_id,
    receivedAt: r.received_at,
  }));
  const pending: OutboundRow[] = (pendingRaw ?? []).map((r) => {
    const authority = Array.isArray(r.authorities) ? r.authorities[0] : r.authorities;
    return {
      id: r.id,
      ref: r.ref,
      kind: r.kind,
      authorityName: authority?.name ?? '(unknown authority)',
      methods: ((r.methods ?? []) as { method?: string; endpoint?: string }[]).map(
        (m) => `${m.method}: ${m.endpoint}`,
      ),
      subject: r.subject,
      body: r.body,
      createdAt: r.created_at,
    };
  });

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
      <p style={{ textAlign: 'right', marginBottom: 8 }}>
        <a href="/admin/api-keys">API keys →</a>
      </p>
      <AutoSendToggle enabled={autoSend} />

      <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>
        Awaiting review <span className="mono" style={{ fontSize: 14, color: 'var(--steel-light)' }}>({pending.length})</span>
      </h2>
      <OutboundReviewList rows={pending} />

      <h2 style={{ fontSize: 26, fontWeight: 900, margin: '32px 0 12px' }}>
        Replies from authorities{' '}
        <span className="mono" style={{ fontSize: 14, color: 'var(--steel-light)' }}>({inbound.length})</span>
      </h2>
      <ReplySettings autoApply={autoApply} replyTo={replyTo} />
      <InboundReviewList rows={inbound} />

      <h2 style={{ fontSize: 22, fontWeight: 800, margin: '32px 0 12px' }}>Recent outbound</h2>
      {(recentRaw ?? []).length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nothing sent yet.</p>
      ) : (
        <div className="card mono" style={{ fontSize: 12, overflowX: 'auto' }}>
          {(recentRaw ?? []).map((r) => (
            <div key={r.ref} style={{ padding: '6px 0', borderBottom: '1px dashed var(--rail)' }}>
              <strong>{r.ref}</strong> · {r.status}
              {r.sent_method ? ` · ${r.sent_method} → ${r.sent_recipient}` : ''}
              {r.error ? ` · ${r.error}` : ''}
              {r.reviewed_by ? ` · reviewed by ${r.reviewed_by}` : ''} · {new Date(r.updated_at).toLocaleString()}
            </div>
          ))}
        </div>
      )}

      <header
        style={{
          marginTop: 40,
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
