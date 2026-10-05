'use client';

import { useState, useTransition } from 'react';
import { reviewInbound, setAutoApplyReplies, setReplyTo } from './actions';

type Status = 'acknowledged' | 'in_progress' | 'resolved';

export interface InboundRow {
  id: string;
  ref: string | null;
  from: string | null;
  subject: string | null;
  excerpt: string | null;
  suggested: Status | null;
  matched: boolean;
  receivedAt: string;
}

export function ReplySettings({ autoApply, replyTo }: { autoApply: boolean; replyTo: string }) {
  const [on, setOn] = useState(autoApply);
  const [address, setAddress] = useState(replyTo);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function toggle() {
    startTransition(async () => {
      const res = await setAutoApplyReplies(!on);
      if (res.ok) setOn(!on);
      setMsg(res.ok ? null : res.error);
    });
  }

  function saveReplyTo(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await setReplyTo(address);
      setMsg(res.ok ? 'Reply-To saved.' : res.error);
    });
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <strong>{on ? 'Replies auto-apply' : 'Replies need review'}</strong>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Auto-apply only acts on replies from the authority&apos;s own email domain.
          </div>
        </div>
        <button type="button" className="btn btn-outline" disabled={pending} onClick={toggle}>
          {on ? 'Require review' : 'Auto-apply replies'}
        </button>
      </div>
      <form style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} onSubmit={saveReplyTo}>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Reply-To for outbound email, e.g. replies@replies.fault-line.dev"
          style={{ flex: '1 1 280px' }}
          disabled={pending}
        />
        <button type="submit" className="btn btn-outline" disabled={pending}>
          Save
        </button>
      </form>
      {msg && <p style={{ fontSize: 13 }}>{msg}</p>}
    </div>
  );
}

export function InboundReviewList({ rows: initialRows }: { rows: InboundRow[] }) {
  const [rows, setRows] = useState(initialRows);
  if (rows.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32, fontStyle: 'italic', color: 'var(--text-muted)' }}>
        No replies awaiting review.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {rows.map((row) => (
        <InboundItem key={row.id} row={row} onDone={() => setRows((r) => r.filter((x) => x.id !== row.id))} />
      ))}
    </div>
  );
}

function InboundItem({ row, onDone }: { row: InboundRow; onDone: () => void }) {
  const [status, setStatus] = useState<Status>(row.suggested ?? 'acknowledged');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(apply: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await reviewInbound(row.id, apply, apply ? status : undefined);
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  return (
    <article className="card">
      <div className="mono" style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--steel-light)' }}>
        {row.ref ?? 'no tag'} · {row.matched ? 'matched' : 'UNMATCHED'} · from {row.from ?? '?'} ·{' '}
        {new Date(row.receivedAt).toLocaleString()}
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 800, margin: '6px 0' }}>{row.subject}</h3>
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--ff-body)', fontSize: 14 }}>{row.excerpt}</pre>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
        Suggested: <strong>{row.suggested ?? 'none'}</strong>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {row.matched && (
          <>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              disabled={pending}
              style={{ width: 'auto' }}
            >
              <option value="acknowledged">acknowledged</option>
              <option value="in_progress">in progress</option>
              <option value="resolved">resolved</option>
            </select>
            <button type="button" className="btn btn-primary" onClick={() => decide(true)} disabled={pending}>
              Apply status
            </button>
          </>
        )}
        <button type="button" className="btn btn-outline" onClick={() => decide(false)} disabled={pending}>
          Dismiss
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </article>
  );
}
