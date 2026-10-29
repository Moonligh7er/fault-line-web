'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptCityTerms } from '../actions';

/** Owner sign-up: an explicit renewal choice (nothing pre-selected) plus agreement. */
export default function AcceptTerms({ cityId, feeWaived }: { cityId: string; feeWaived: boolean }) {
  const [renew, setRenew] = useState<'yes' | 'no' | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const ready = agreed && (feeWaived || renew !== null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await acceptCityTerms(cityId, feeWaived ? false : renew === 'yes');
          if (!r.ok) setError(r.error);
          else router.refresh();
        });
      }}
      style={{ marginTop: 16 }}
    >
      {!feeWaived && (
        <fieldset style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 12 }}>
          <legend style={{ padding: '0 6px', fontWeight: 700 }}>When the pilot ends</legend>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <input type="radio" name="renew" checked={renew === 'yes'} onChange={() => setRenew('yes')} /> Renew
            automatically: send our city the annual invoice when the pilot ends.
          </label>
          <label style={{ display: 'block' }}>
            <input type="radio" name="renew" checked={renew === 'no'} onChange={() => setRenew('no')} /> Don&apos;t renew:
            end dashboard access when the pilot ends. We can subscribe later.
          </label>
        </fieldset>
      )}
      <label style={{ display: 'block', marginBottom: 12 }}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> I am authorized to
        accept these terms for my city, and I accept them.
      </label>
      <button type="submit" className="btn btn-primary" disabled={!ready || pending}>
        {pending ? 'Saving…' : 'Accept and open the dashboard'}
      </button>
      {error && (
        <p role="alert" style={{ color: 'var(--danger)', marginTop: 8 }}>
          {error}
        </p>
      )}
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
        A copy of what you accepted is emailed to you and kept on the account.
      </p>
    </form>
  );
}
