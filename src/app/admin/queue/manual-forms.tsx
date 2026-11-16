'use client';

import { useState, useTransition } from 'react';
import { markOutboundManual } from './actions';

export interface ManualFormRow {
  id: string;
  ref: string;
  authorityName: string;
  formUrl: string | null;
  subject: string;
  body: string;
  createdAt: string;
}

/**
 * Single-report submissions whose only channel is a web form. Nothing is
 * recorded as delivered until you submit the form by hand and mark it here.
 */
export function ManualFormList({ rows }: { rows: ManualFormRow[] }) {
  if (rows.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 24 }}>No web forms waiting.</p>;
  }
  return (
    <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
      {rows.map((r) => (
        <ManualFormCard key={r.id} row={r} />
      ))}
    </div>
  );
}

function ManualFormCard({ row }: { row: ManualFormRow }) {
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const mark = (status: 'sent' | 'failed') =>
    start(async () => {
      const res = await markOutboundManual(row.id, status);
      if (res.ok) setDone(status === 'sent' ? 'Marked submitted.' : 'Marked failed.');
      else setError(res.error);
    });

  return (
    <div className="card">
      <div className="mono" style={{ fontSize: 12, color: 'var(--steel-light)' }}>
        {row.ref} · {row.authorityName} · {new Date(row.createdAt).toLocaleString()}
      </div>
      <div style={{ fontWeight: 700, margin: '6px 0' }}>{row.subject}</div>
      {row.formUrl && /^https:\/\//.test(row.formUrl) && (
        <p style={{ marginBottom: 6 }}>
          <a href={row.formUrl} target="_blank" rel="noopener noreferrer">
            Open the city&apos;s form
          </a>
        </p>
      )}
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginBottom: 8 }}>{row.body}</pre>
      {done ? (
        <p role="status">{done}</p>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" disabled={pending} onClick={() => mark('sent')}>
            I submitted it
          </button>
          <button className="btn btn-outline" disabled={pending} onClick={() => mark('failed')}>
            Couldn&apos;t submit
          </button>
        </div>
      )}
      {error && (
        <p role="alert" style={{ color: 'var(--danger)', marginTop: 6 }}>
          {error}
        </p>
      )}
    </div>
  );
}
