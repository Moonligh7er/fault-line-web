'use client';

import { useState, useTransition } from 'react';
import { markSubmitted } from './actions';

export interface QueueRow {
  id: string;
  clusterId: string;
  authorityName: string;
  authorityLocation: string;
  category: string;
  address: string;
  city: string;
  state: string;
  reportCount: number;
  uniqueReporters: number;
  maxHazard: string;
  firstReportedAt: string;
  lastReportedAt: string;
  latitude: number;
  longitude: number;
  webFormUrl: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string | null;
}

export default function QueueList({ rows: initialRows }: { rows: QueueRow[] }) {
  const [rows, setRows] = useState(initialRows);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {rows.map((row) => (
        <QueueItem
          key={row.id}
          row={row}
          onResolved={() => setRows((r) => r.filter((x) => x.id !== row.id))}
        />
      ))}
    </div>
  );
}

function QueueItem({ row, onResolved }: { row: QueueRow; onResolved: () => void }) {
  const [bodyCopied, setBodyCopied] = useState(false);
  const [subjectCopied, setSubjectCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function copy(text: string, setter: (b: boolean) => void) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setter(true);
        setTimeout(() => setter(false), 1500);
      })
      .catch(() => setError('Clipboard write failed — copy manually'));
  }

  function handleMarkSubmitted(resolvedStatus: 'sent' | 'failed') {
    setError(null);
    startTransition(async () => {
      const res = await markSubmitted(row.id, resolvedStatus);
      if (res.ok) onResolved();
      else setError(res.error);
    });
  }

  const firstDate = new Date(row.firstReportedAt);
  const daysOpen = Math.floor(
    (Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <article className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Hazard-stripe top bar */}
      <div
        style={{
          height: 4,
          background:
            'repeating-linear-gradient(-45deg, var(--amber) 0 10px, var(--tunnel-deep) 10px 20px)',
        }}
      />
      <div style={{ padding: 28 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: 'var(--steel-light)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {row.authorityName} · {row.authorityLocation || '—'}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              {row.category.replace('_', ' ')} <em style={{ color: 'var(--amber)' }}>at</em>{' '}
              {row.address || `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}`}
            </h2>
          </div>
          <span
            style={{
              background: 'var(--signal-red)',
              color: 'var(--tile)',
              fontFamily: 'var(--ff-ui)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              padding: '6px 12px',
              whiteSpace: 'nowrap',
            }}
          >
            {row.status}
          </span>
        </header>

        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '18px 28px',
            fontFamily: 'var(--ff-mono)',
            fontSize: 12,
            padding: '20px 0',
            borderBottom: '1px dashed var(--rail)',
            marginTop: 18,
          }}
        >
          <Field label="Reports" value={`${row.reportCount} / ${row.uniqueReporters} unique`} />
          <Field label="Hazard" value={row.maxHazard || '—'} />
          <Field label="Days open" value={`${daysOpen}d`} />
          <Field label="GPS" value={`${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}`} />
        </dl>

        <div style={{ marginTop: 20 }}>
          <label style={{ color: 'var(--amber)' }}>Subject</label>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 4,
            }}
          >
            <input readOnly value={row.subject} style={{ flex: 1 }} />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => copy(row.subject, setSubjectCopied)}
              style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
            >
              {subjectCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <label style={{ color: 'var(--amber)' }}>Body</label>
          <textarea
            readOnly
            value={row.body}
            rows={10}
            style={{ marginTop: 4, fontFamily: 'var(--ff-mono)', fontSize: 13, lineHeight: 1.55 }}
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => copy(row.body, setBodyCopied)}
            style={{ marginTop: 8, padding: '10px 20px' }}
          >
            {bodyCopied ? 'Copied' : 'Copy body'}
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px dashed var(--rail)',
            alignItems: 'center',
          }}
        >
          <a
            href={row.webFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Open web form ↗
          </a>
          <button
            type="button"
            className="btn btn-outline"
            disabled={pending}
            onClick={() => handleMarkSubmitted('sent')}
          >
            {pending ? 'Saving…' : 'Mark submitted'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={pending}
            onClick={() => handleMarkSubmitted('failed')}
            style={{ borderColor: 'var(--signal-red)', color: 'var(--signal-red)' }}
          >
            Mark failed
          </button>
          {error && <span className="error">{error}</span>}
        </div>
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt
        style={{
          fontSize: 10,
          color: 'var(--steel-light)',
          letterSpacing: '1.8px',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </dt>
      <dd style={{ color: 'var(--tile)', fontSize: 13 }}>{value}</dd>
    </div>
  );
}
