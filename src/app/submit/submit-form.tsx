'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, HAZARD_LEVELS, SIZE_RATINGS } from '@/lib/categories';
import { submitReport } from './actions';

type GeoState =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'located'; lat: number; lng: number }
  | { kind: 'error'; message: string };

export default function SubmitForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [geo, setGeo] = useState<GeoState>({ kind: 'idle' });
  const [category, setCategory] = useState<string>('pothole');
  const [description, setDescription] = useState('');
  const [sizeRating, setSizeRating] = useState<string>('medium');
  const [hazardLevel, setHazardLevel] = useState<string>('moderate');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function requestLocation() {
    if (!('geolocation' in navigator)) {
      setGeo({ kind: 'error', message: 'Geolocation not supported.' });
      return;
    }
    setGeo({ kind: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGeo({
          kind: 'located',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => setGeo({ kind: 'error', message: err.message }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5 MB.');
      setFile(null);
      return;
    }
    if (
      f &&
      !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type)
    ) {
      setError('Photo must be JPEG, PNG, GIF, or WebP.');
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (geo.kind !== 'located') {
      setError('Please allow location to continue.');
      return;
    }
    const data = new FormData();
    data.set('category', category);
    data.set('latitude', String(geo.lat));
    data.set('longitude', String(geo.lng));
    data.set('description', description);
    data.set('sizeRating', sizeRating);
    data.set('hazardLevel', hazardLevel);
    data.set('isAnonymous', String(isAnonymous));
    if (file) data.set('photo', file);

    startTransition(async () => {
      const res = await submitReport(data);
      if (res.ok && res.reportId) {
        router.push(`/report/${res.reportId}`);
      } else {
        setError(res.error ?? 'Could not submit report.');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card" noValidate encType="multipart/form-data">
      <div className="form-row">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={pending}
        >
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>Location</label>
        {geo.kind === 'idle' && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={requestLocation}
          >
            Use my current location
          </button>
        )}
        {geo.kind === 'locating' && <p>Getting your location…</p>}
        {geo.kind === 'located' && (
          <p style={{ color: 'var(--success)' }}>
            ✓ {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
          </p>
        )}
        {geo.kind === 'error' && <p className="error">{geo.message}</p>}
      </div>

      <div className="form-row">
        <label htmlFor="size">Size</label>
        <select
          id="size"
          value={sizeRating}
          onChange={(e) => setSizeRating(e.target.value)}
          disabled={pending}
        >
          {SIZE_RATINGS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label} — {s.description}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label htmlFor="hazard">Hazard Level</label>
        <select
          id="hazard"
          value={hazardLevel}
          onChange={(e) => setHazardLevel(e.target.value)}
          disabled={pending}
        >
          {HAZARD_LEVELS.map((h) => (
            <option key={h.key} value={h.key}>
              {h.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          rows={4}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="form-row">
        <label htmlFor="photo">Photo (optional, max 5 MB)</label>
        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={onFileChange}
          disabled={pending}
        />
      </div>

      <div className="form-row">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none' }}>
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            style={{ width: 'auto' }}
            disabled={pending}
          />
          Submit anonymously
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={pending || geo.kind !== 'located'}
      >
        {pending ? 'Submitting…' : 'Submit Report'}
      </button>
    </form>
  );
}
