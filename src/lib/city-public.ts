import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export interface CityPublicData {
  name: string;
  slug: string;
  state: string | null;
  methodology_version: string;
  thresholds: Record<'volume' | 'reporters' | 'categories' | 'escalations', { have: number; need: number }>;
  inputs: { fix_rate_pct: number | null; open_backlog: number; open_dangerous: number };
  monthly: { month: string; reported: number; resolved: number; median_days_to_resolve: number | null }[];
}

export const THRESHOLD_LABELS: Record<keyof CityPublicData['thresholds'], string> = {
  volume: 'Reports in the last 90 days',
  reporters: 'Distinct reporters',
  categories: 'Infrastructure categories',
  escalations: 'Escalated to the city',
};

/** Public page data. Never depends on whether the city pays. */
export async function getCityPublic(slug: string): Promise<CityPublicData | null> {
  if (!/^[a-z0-9][a-z0-9-]{1,59}$/.test(slug)) return null;
  // Anonymous client: no cookies, so the page can be cached.
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await supabase.rpc('city_public_page', { p_slug: slug });
  return (data as CityPublicData | null) ?? null;
}

export function thresholdsMet(d: CityPublicData): boolean {
  return Object.values(d.thresholds).every((t) => t.have >= t.need);
}
