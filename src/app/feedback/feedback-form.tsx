'use client';

import { useState } from 'react';

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mlgojojg';

type Tab = 'feedback' | 'feature' | 'bug';
type SubmitState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

export default function FeedbackForm() {
  const [tab, setTab] = useState<Tab>('feedback');
  const [state, setState] = useState<SubmitState>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: 'sending' });
    const fd = new FormData(e.currentTarget);
    const payload = {
      _subject: `[Fault Line ${tab}] ${fd.get('subject')}`,
      type: tab,
      name: fd.get('name') || '(anonymous)',
      email: fd.get('email') || '',
      subject: fd.get('subject'),
      message: fd.get('message'),
    };
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setState({ kind: 'sent' });
      } else {
        const data = await res.json().catch(() => null);
        setState({ kind: 'error', message: data?.error ?? 'Submission failed. Try again.' });
      }
    } catch {
      setState({ kind: 'error', message: 'Network error. Check your connection.' });
    }
  }

  if (state.kind === 'sent') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {tab === 'feature' ? '💡' : tab === 'bug' ? '🐛' : '✅'}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--success)' }}>
          {tab === 'feature' ? 'Feature request received!' : tab === 'bug' ? 'Bug report filed!' : 'Thank you!'}
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          We&apos;ve got it. Real human will read it. Popular requests get built first.
        </p>
        <button
          type="button"
          className="btn btn-outline"
          style={{ marginTop: 20 }}
          onClick={() => setState({ kind: 'idle' })}
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <>
      <div role="tablist" aria-label="Feedback type" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        {(
          [
            ['feedback', '💬 Feedback'],
            ['feature', '💡 Feature Request'],
            ['bug', '🐛 Bug Report'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className="btn"
            style={{
              padding: '10px 22px',
              background: tab === id ? 'var(--primary)' : 'var(--bg-card)',
              color: tab === id ? '#fff' : 'var(--text-secondary)',
              border: '1px solid ' + (tab === id ? 'var(--primary)' : 'var(--border)'),
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="card" key={tab}>
        <div className="form-row">
          <label htmlFor="fb-name">Name (optional)</label>
          <input id="fb-name" name="name" type="text" placeholder="Your name" maxLength={80} />
        </div>
        <div className="form-row">
          <label htmlFor="fb-email">Email (optional — for follow-up)</label>
          <input id="fb-email" name="email" type="email" placeholder="you@email.com" maxLength={254} />
        </div>
        <div className="form-row">
          <label htmlFor="fb-subject">
            {tab === 'feature' ? 'Feature title' : tab === 'bug' ? 'Bug summary' : 'Subject'}
          </label>
          <input
            id="fb-subject"
            name="subject"
            type="text"
            required
            maxLength={120}
            placeholder={
              tab === 'feature'
                ? 'e.g., Dark mode for the map'
                : tab === 'bug'
                  ? 'e.g., App crashes when taking photo'
                  : "What's on your mind?"
            }
          />
        </div>
        <div className="form-row">
          <label htmlFor="fb-message">
            {tab === 'bug' ? 'Steps to reproduce' : tab === 'feature' ? 'Description' : 'Message'}
          </label>
          <textarea
            id="fb-message"
            name="message"
            rows={6}
            required
            maxLength={4000}
            placeholder={
              tab === 'bug'
                ? '1. Open the app\n2. Tap Report\n3. Take a photo\n4. App crashes'
                : tab === 'feature'
                  ? 'Describe the feature, why it matters, and how you would use it...'
                  : 'Tell us more...'
            }
          />
        </div>
        {state.kind === 'error' && <p className="error">{state.message}</p>}
        <button type="submit" className="btn btn-primary" disabled={state.kind === 'sending'}>
          {state.kind === 'sending' ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </>
  );
}
