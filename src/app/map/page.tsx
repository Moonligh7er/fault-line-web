import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ReportRow } from '@/lib/types';
import MapClient from './map-client';

export const metadata = {
  title: 'Map',
  description: 'Browse infrastructure reports on the map.',
};

interface SearchParams {
  lat?: string;
  lng?: string;
  radius?: string;
}

async function fetchNearby(lat: number, lng: number, radiusKm: number) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('get_nearby_reports', {
    lat,
    lng,
    radius_km: radiusKm,
  });
  if (error) return [];
  return (data ?? []) as ReportRow[];
}

function parseNumber(s: string | undefined, fallback: number, min: number, max: number): number {
  if (!s) return fallback;
  const n = Number(s);
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return n;
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const lat = parseNumber(params.lat, 42.3601, -90, 90);
  const lng = parseNumber(params.lng, -71.0589, -180, 180);
  const radius = parseNumber(params.radius, 5, 0.1, 50);

  const reports = await fetchNearby(lat, lng, radius);

  return (
    <div>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Reports Near You</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {reports.length} {reports.length === 1 ? 'report' : 'reports'} within{' '}
          {radius} km
        </p>
      </header>
      <MapClient
        initialReports={reports}
        initialCenter={[lat, lng]}
        initialRadiusKm={radius}
      />
    </div>
  );
}
