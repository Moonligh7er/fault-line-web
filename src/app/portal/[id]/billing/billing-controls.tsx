'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setCityAutoRenew, setCityBilling, subscribeCityNow } from '../../actions';

interface Props {
  cityId: string;
  autoRenew: boolean | null;
  billingEmail: string;
  po: string;
  canSubscribeNow: boolean;
  priceLabel: string;
}

export default function BillingControls({ cityId, autoRenew, billingEmail, po, canSubscribeNow, priceLabel }: Props) {
  const [email, setEmail] = useState(billingEmail);
  const [poNumber, setPo] = useState(po);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: done } : { ok: false, text: r.error });
      if (r.ok) router.refresh();
    });

  return (
    <section className="card">
      <h2 style={{ fontSize: 18, marginBottom: 10 }}>Renewal</h2>
      <p style={{ marginBottom: 12 }}>
        Automatic renewal is <strong>{autoRenew === null ? 'not chosen' : autoRenew ? 'on' : 'off'}</strong>. You can change
        this at any time; it applies to the next renewal.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {autoRenew !== true && (
          <button className="btn btn-outline" disabled={pending} onClick={() => run(() => setCityAutoRenew(cityId, true), 'Automatic renewal is on.')}>
            Turn automatic renewal on
          </button>
        )}
        {autoRenew !== false && (
          <button className="btn btn-outline" disabled={pending} onClick={() => run(() => setCityAutoRenew(cityId, false), 'Automatic renewal is off. Access ends at the end of the pilot or term.')}>
            Turn automatic renewal off
          </button>
        )}
        {canSubscribeNow && (
          <button
            className="btn btn-primary"
            disabled={pending}
            onClick={() => {
              if (window.confirm(`Subscribe at ${priceLabel} per year? An invoice due in 30 days is emailed to your billing contact (after the pilot, if it is still running).`))
                run(() => subscribeCityNow(cityId), 'Subscribed. The invoice is emailed to your billing contact.');
            }}
          >
            Subscribe ({priceLabel}/year)
          </button>
        )}
      </div>

      <h3 style={{ fontSize: 16, marginBottom: 8 }}>Invoice details</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => setCityBilling(cityId, email, poNumber), 'Invoice details saved.');
        }}
        style={{ display: 'grid', gap: 8, maxWidth: 420 }}
      >
        <label>
          Billing contact email (invoices go here)
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="accounts.payable@city.gov" style={{ width: '100%' }} />
        </label>
        <label>
          Purchase order number (printed on the invoice)
          <input value={poNumber} maxLength={60} onChange={(e) => setPo(e.target.value)} style={{ width: '100%' }} />
        </label>
        <button type="submit" className="btn btn-outline" disabled={pending} style={{ justifySelf: 'start' }}>
          Save invoice details
        </button>
      </form>
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} style={{ marginTop: 10, color: msg.ok ? 'var(--success)' : 'var(--danger)' }}>
          {msg.text}
        </p>
      )}
    </section>
  );
}
