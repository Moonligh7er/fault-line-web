'use client';

import { useState, useTransition } from 'react';
import { setClusterContractor } from '../../actions';

export default function ContractorField({ cityId, clusterId, initial }: { cityId: string; clusterId: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await setClusterContractor(cityId, clusterId, value);
          if (r.ok) {
            setSaved(value);
            setError(null);
          } else setError(r.error);
        });
      }}
      style={{ display: 'flex', gap: 6 }}
    >
      <input
        aria-label="Contractor"
        value={value}
        maxLength={120}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Unassigned"
        style={{ minWidth: 140 }}
      />
      {value !== saved && (
        <button type="submit" className="btn btn-outline" disabled={pending}>
          Save
        </button>
      )}
      {error && <span role="alert" style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</span>}
    </form>
  );
}
