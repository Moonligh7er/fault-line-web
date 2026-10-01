import type { SupabaseClient } from '@supabase/supabase-js';

// Resolves the responsible authority and a street address for a GPS point.
// The mobile app does this on-device (expo-location + findAuthorityByLocation);
// the web client only has coordinates, so the submit action does it here.
// Without an authority_id a report's cluster can never escalate.

export interface ResolvedLocation {
  authorityId: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

interface GeocodeResult {
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
// Nominatim's usage policy requires an identifying User-Agent.
const USER_AGENT = 'FaultLine/1.0 (+https://fault-line.dev; reports@fault-line.dev)';
const GEOCODE_TIMEOUT_MS = 4000;

/** Best-effort reverse geocode via OSM Nominatim. Never throws. */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const empty: GeocodeResult = { address: null, city: null, state: null, zip: null };
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('zoom', '18');
  url.searchParams.set('addressdetails', '1');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), GEOCODE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: ctrl.signal,
      cache: 'no-store',
    });
    if (!res.ok) return empty;
    return parseNominatimAddress(await res.json());
  } catch {
    return empty;
  } finally {
    clearTimeout(timer);
  }
}

export function parseNominatimAddress(body: unknown): GeocodeResult {
  const a = (body as { address?: Record<string, string> } | null)?.address ?? {};
  const street = [a.house_number, a.road].filter(Boolean).join(' ') || null;
  const city = a.city ?? a.town ?? a.village ?? a.hamlet ?? a.municipality ?? null;
  const iso = a['ISO3166-2-lvl4'] ?? '';
  const state = /^US-[A-Z]{2}$/.test(iso) ? iso.slice(3) : null;
  const zip = a.postcode && /^\d{5}(-\d{4})?$/.test(a.postcode) ? a.postcode : null;
  return { address: street, city, state, zip };
}

/** Authority by boundary polygon, falling back to a city/state match. */
export async function resolveLocation(
  supabase: SupabaseClient,
  lat: number,
  lng: number,
): Promise<ResolvedLocation> {
  const [geo, polygon] = await Promise.all([
    reverseGeocode(lat, lng),
    supabase.rpc('find_authority_by_point', { lat, lng }),
  ]);

  type AuthorityHit = { id: string; city: string | null; state: string | null };
  let authority = ((polygon.data as AuthorityHit[] | null) ?? [])[0] ?? null;

  if (!authority && geo.city && geo.state) {
    const { data } = await supabase
      .from('authorities')
      .select('id, city, state')
      .eq('state', geo.state)
      .eq('city', geo.city)
      .eq('is_active', true)
      .limit(1);
    authority = (data as AuthorityHit[] | null)?.[0] ?? null;
  }

  return {
    authorityId: authority?.id ?? null,
    address: geo.address,
    city: geo.city ?? authority?.city ?? null,
    state: geo.state ?? authority?.state ?? null,
    zip: geo.zip,
  };
}
