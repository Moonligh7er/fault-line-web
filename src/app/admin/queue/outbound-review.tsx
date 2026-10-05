'use client';

import { useState, useTransition } from 'react';
import { reviewOutbound, setAutoSend } from './actions';

export interface OutboundRow {
  id: string;
  ref: string;
  kind: 'cluster_escalation' | 'report_submission';
  authorityName: string;
  methods: string[];
  subject: string;
  body: string;
  createdAt: string;
}

export function AutoSendToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !on;
    if (next && !confirm('Turn on auto-send? New escalations and report submissions will go to authorities without review.')) return;
    setError(null);
    startTransition(async () => {
      const res = await setAutoSend(next);
      if (res.ok) setOn(next);
      else setError(res.error);
    });
  }

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
      <div>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--steel-light)' }}>
          Outbound review
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
          {on ? 'Auto-send is ON — messages go out without review.' : 'Review required — nothing is sent until you approve it.'}
        </div>
        {error && <p className="error">{error}</p>}
      </div>
      <button type="button" className={on ? 'btn btn-outline' : 'btn btn-primary'} onClick={toggle} disabled={pending}>
        {pending ? 'Saving…' : on ? 'Require review' : 'Turn on auto-send'}
      </button>
    </div>
  );
}

export function OutboundReviewList({ rows: initialRows }: { rows: OutboundRow[] }) {
  const [rows, setRows] = useState(initialRows);
  if (rows.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32, fontStyle: 'italic', color: 'var(--text-muted)' }}>
        Nothing awaiting review.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {rows.map((row) => (
        <OutboundItem key={row.id} row={row} onDone={() => setRows((r) => r.filter((x) => x.id !== row.id))} />
      ))}
    </div>
  );
}

function OutboundItem({ row, onDone }: { row: OutboundRow; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');

  function decide(approve: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await reviewOutbound(row.id, approve, note);
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  return (
    <article className="card">
      <div className="mono" style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--steel-light)' }}>
        {row.ref} · {row.kind === 'cluster_escalation' ? 'Cluster escalation' : 'Single report'} · {row.authorityName}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, margin: '6px 0' }}>[{row.ref}] {row.subject}</h3>
      <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        Will try, in order: {row.methods.join(' → ') || '—'} · queued {new Date(row.createdAt).toLocaleString()}
      </div>
      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--amber)' }}>Message body</summary>
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--ff-mono)', fontSize: 12, marginTop: 8 }}>{row.body}</pre>
      </details>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Optional note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ flex: '1 1 220px' }}
          disabled={pending}
        />
        <button type="button" className="btn btn-primary" onClick={() => decide(true)} disabled={pending}>
          Approve &amp; send
        </button>
        <button type="button" className="btn btn-outline" onClick={() => decide(false)} disabled={pending}>
          Reject
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </article>
  );
}
