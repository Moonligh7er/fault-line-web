'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { sendMagicLink } from './actions';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const [email, setEmail] = useState('');
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<
    { kind: 'idle' } | { kind: 'sent' } | { kind: 'error'; message: string }
  >({ kind: 'idle' });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await sendMagicLink({ email, next });
      if (result.ok) {
        setState({ kind: 'sent' });
      } else {
        setState({ kind: 'error', message: result.error });
      }
    });
  }

  if (state.kind === 'sent') {
    return (
      <div className="card">
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          We sent a secure sign-in link to <strong>{email}</strong>. It expires in
          15 minutes. You can close this tab.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card" noValidate>
      <div className="form-row">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={pending}
        />
      </div>
      {state.kind === 'error' && <p className="error">{state.message}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending || !email}>
        {pending ? 'Sending…' : 'Send magic link'}
      </button>
    </form>
  );
}
