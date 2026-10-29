'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCityAccount, extendPilot, inviteCityMember, searchAuthorities, setFeeWaiver } from './actions';

type Res = { ok: true } | { ok: false; error: string };

function useAction() {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<Res>, done: string) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? done : r.error);
      if (r.ok) router.refresh();
    });
  return { msg, pending, run };
}

export function CreateCityForm() {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<{ id: string; name: string; state: string | null }[]>([]);
  const [authority, setAuthority] = useState<{ id: string; name: string } | null>(null);
  const [f, setF] = useState({ slug: '', displayName: '', tier: 'town', population: '', pilotEndsAt: '2027-03-31', feeWaived: false, waiverNote: '', quotedUsd: '', ownerEmail: '' });
  const { msg, pending, run } = useAction();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  return (
    <div style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
      <label>
        Authority
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" style={{ flex: 1 }} />
          <button type="button" className="btn btn-outline" onClick={async () => setHits(await searchAuthorities(q))}>
            Search
          </button>
        </div>
      </label>
      {hits.length > 0 && !authority && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {hits.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ margin: 2 }}
                onClick={() => {
                  setAuthority(h);
                  const base = h.name.replace(/\(.*?\)/g, '').trim();
                  setF({ ...f, displayName: base, slug: base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + (h.state ? `-${h.state.toLowerCase()}` : '') });
                }}
              >
                {h.name} {h.state ? `(${h.state})` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
      {authority && (
        <p>
          Selected: <strong>{authority.name}</strong>{' '}
          <button type="button" className="btn btn-outline" onClick={() => setAuthority(null)}>
            change
          </button>
        </p>
      )}
      <label>Display name <input value={f.displayName} onChange={set('displayName')} style={{ width: '100%' }} /></label>
      <label>Public page slug <input value={f.slug} onChange={set('slug')} style={{ width: '100%' }} /></label>
      <label>
        Tier{' '}
        <select value={f.tier} onChange={set('tier')}>
          <option value="town">Town (&lt;50k) $6,000/yr</option>
          <option value="city">City (50k–250k) $9,600/yr</option>
          <option value="regional">Regional (250k–1M) $30,000/yr</option>
          <option value="metro">Metro / State DOT (quote)</option>
        </select>
      </label>
      {f.tier === 'metro' && <label>Quoted price, USD per year <input inputMode="decimal" value={f.quotedUsd} onChange={set('quotedUsd')} /></label>}
      <label>Population <input inputMode="numeric" value={f.population} onChange={set('population')} /></label>
      <label>Pilot ends <input type="date" value={f.pilotEndsAt} onChange={set('pilotEndsAt')} /></label>
      <label><input type="checkbox" checked={f.feeWaived} onChange={set('feeWaived')} /> Waive the fee (preselected free city)</label>
      {f.feeWaived && <label>Waiver note <input value={f.waiverNote} onChange={set('waiverNote')} style={{ width: '100%' }} /></label>}
      <label>Owner email (signs in with this address) <input type="email" value={f.ownerEmail} onChange={set('ownerEmail')} style={{ width: '100%' }} /></label>
      <button
        type="button"
        className="btn btn-primary"
        disabled={pending || !authority}
        onClick={() =>
          run(
            () =>
              createCityAccount({
                authorityId: authority!.id,
                slug: f.slug,
                displayName: f.displayName,
                tier: f.tier as 'town',
                population: f.population ? Number(f.population) : undefined,
                pilotEndsAt: f.pilotEndsAt,
                feeWaived: f.feeWaived,
                waiverNote: f.waiverNote || undefined,
                quotedUsd: f.quotedUsd ? Number(f.quotedUsd) : undefined,
                ownerEmail: f.ownerEmail,
              }),
            'Created. The owner is linked when they sign in with that email.',
          )
        }
      >
        Create city account
      </button>
      {msg && <p role="status">{msg}</p>}
    </div>
  );
}

export function CityRowControls({ cityId, feeWaived, waiverNote }: { cityId: string; feeWaived: boolean; waiverNote: string }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'staff' | 'owner'>('staff');
  const [date, setDate] = useState('');
  const [note, setNote] = useState(waiverNote);
  const { msg, pending, run } = useAction();
  return (
    <div style={{ display: 'grid', gap: 6, fontSize: 14 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <input type="email" placeholder="staff@city.gov" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value as 'staff' | 'owner')}>
          <option value="staff">staff</option>
          <option value="owner">owner</option>
        </select>
        <button className="btn btn-outline" disabled={pending} onClick={() => run(() => inviteCityMember(cityId, email, role), 'Invited.')}>
          Add member
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn btn-outline" disabled={pending || !date} onClick={() => run(() => extendPilot(cityId, date), 'Pilot end date changed.')}>
          Set pilot end
        </button>
        <input placeholder="Waiver note" value={note} onChange={(e) => setNote(e.target.value)} />
        <button
          className="btn btn-outline"
          disabled={pending}
          onClick={() => run(() => setFeeWaiver(cityId, !feeWaived, note), feeWaived ? 'Waiver removed; renewal is off until the owner turns it on.' : 'Fee waived.')}
        >
          {feeWaived ? 'Remove fee waiver' : 'Waive fee'}
        </button>
      </div>
      {msg && <p role="status">{msg}</p>}
    </div>
  );
}
