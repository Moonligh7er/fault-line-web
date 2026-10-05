'use client';

import { useState, useTransition } from 'react';
import { createKey, revokeKey } from './actions';

export interface KeyRow {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  dailyLimit: number;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export default function KeyManager({ keys }: { keys: KeyRow[] }) {
  const [name, setName] = useState('');
  const [internal, setInternal] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNewKey(null);
    startTransition(async () => {
      const res = await createKey(name, internal);
      if (res.ok) {
        setNewKey(res.key);
        setName('');
        setInternal(false);
      } else setError(res.error);
    });
  }

  function revoke(id: string, label: string) {
    if (!confirm(`Revoke "${label}"? Anything using it stops working immediately.`)) return;
    startTransition(async () => {
      const res = await revokeKey(id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <form className="card" onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label htmlFor="key-name">New key — who or what is it for?</label>
        <input id="key-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Claude analysis agent" disabled={pending} required />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', textTransform: 'none', letterSpacing: 0, color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} style={{ width: 'auto' }} disabled={pending} />
          Include internal data (outbound queue, replies, escalation bodies)
        </label>
        <button type="submit" className="btn btn-primary" disabled={pending || !name.trim()} style={{ alignSelf: 'flex-start' }}>
          Create key
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      {newKey && (
        <div className="card" style={{ borderColor: 'var(--amber)' }}>
          <strong>Copy this key now — it won&apos;t be shown again.</strong>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <input readOnly value={newKey} style={{ flex: '1 1 320px', fontFamily: 'var(--ff-mono)' }} onFocus={(e) => e.target.select()} />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigator.clipboard.writeText(newKey).then(() => setCopied(true))}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p style={{ fontSize: 13, marginTop: 8, color: 'var(--text-secondary)' }}>
            Use as <code>Authorization: Bearer {newKey.slice(0, 12)}…</code> against <code>/api/v1</code>. Spec: <code>/api/v1/openapi.json</code>.
          </p>
        </div>
      )}

      <div className="card mono" style={{ fontSize: 12, overflowX: 'auto' }}>
        {keys.length === 0 && <p style={{ fontStyle: 'italic' }}>No keys yet.</p>}
        {keys.map((k) => (
          <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px dashed var(--rail)', flexWrap: 'wrap', opacity: k.revokedAt ? 0.5 : 1 }}>
            <span>
              <strong>{k.name}</strong> · {k.prefix}… · {k.scopes.join(', ')} · {k.dailyLimit}/day · last used{' '}
              {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'never'}
              {k.revokedAt ? ` · revoked ${new Date(k.revokedAt).toLocaleDateString()}` : ''}
            </span>
            {!k.revokedAt && (
              <button type="button" className="btn btn-outline" style={{ padding: '4px 12px' }} disabled={pending} onClick={() => revoke(k.id, k.name)}>
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
