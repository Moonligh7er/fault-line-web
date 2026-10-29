// City-side product: tiers, published prices and the terms a city accepts.
// Prices here must match the Stripe catalog (lookup keys town_annual, …) and
// the public /cities page. A city's price is locked at the published price on
// the day its owner accepts the terms (city_accounts.locked_price_cents).

import { getCategoryInfo } from '@/lib/categories';
import type { ReportCategory } from '@/lib/types';

export type CityTier = 'town' | 'city' | 'regional' | 'metro';
export type CityStatus = 'pilot' | 'active' | 'suspended' | 'ended';

export const TIERS: Record<CityTier, { label: string; population: string; lookupKey: string | null; cents: number | null }> = {
  town: { label: 'Town', population: 'under 50,000 residents', lookupKey: 'town_annual', cents: 600_000 },
  city: { label: 'City', population: '50,000–250,000 residents', lookupKey: 'city_annual', cents: 960_000 },
  regional: { label: 'Regional', population: '250,000–1 million residents', lookupKey: 'regional_annual', cents: 3_000_000 },
  metro: { label: 'Metro / State DOT', population: 'over 1 million residents, or a state agency', lookupKey: null, cents: null },
};

// Bump when the city terms change; owners re-accept on their next visit.
export const CITY_TERMS_VERSION = '2026-10-29';

export const FEEDBACK_URL = 'https://app.fault-line.dev/feedback';

export function formatUsd(cents: number | null | undefined): string {
  if (cents == null) return 'by quote';
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export interface CityAccount {
  id: string;
  authority_id: string;
  slug: string;
  display_name: string;
  tier: CityTier;
  population: number | null;
  status: CityStatus;
  pilot_ends_at: string | null;
  fee_waived: boolean;
  fee_waiver_note: string | null;
  auto_renew: boolean | null;
  auto_renew_set_at: string | null;
  terms_version: string | null;
  terms_accepted_at: string | null;
  locked_lookup_key: string | null;
  locked_price_id: string | null;
  locked_price_cents: number | null;
  quoted_price_cents: number | null;
  billing_email: string | null;
  po_number: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
}

/** The annual price this city pays: locked price, else quote, else the tier's published price. */
export function cityPriceCents(c: Pick<CityAccount, 'tier' | 'locked_price_cents' | 'quoted_price_cents'>): number | null {
  return c.locked_price_cents ?? c.quoted_price_cents ?? TIERS[c.tier].cents;
}

/** Plain-language summary of what happens at the end of the pilot or term. */
export function renewalSummary(c: CityAccount): string {
  const price = formatUsd(cityPriceCents(c));
  if (c.fee_waived) return 'Fault Line has waived your city’s fee. No invoice will be sent while the waiver stands.';
  const end = c.status === 'pilot' ? c.pilot_ends_at : c.current_period_end;
  const when = c.status === 'pilot' ? 'When the pilot ends' : 'At the end of the current term';
  if (c.auto_renew === true) {
    return `${when} (${formatDate(end)}), Fault Line sends an annual invoice for ${price}, due in 30 days. If it is not paid by the due date, dashboard access is suspended until it is paid.`;
  }
  if (c.auto_renew === false) {
    return `${when} (${formatDate(end)}), dashboard access ends and nothing is billed. You can subscribe again at any time at ${price} per year.`;
  }
  return 'You have not chosen whether the subscription renews.';
}

export function categoryLabel(key: string): string {
  return getCategoryInfo(key as ReportCategory)?.label ?? key.replace(/_/g, ' ');
}

export interface CityDashboardData {
  totals: { all: number; open: number; acknowledged: number; in_progress: number; resolved: number; last_30_days: number };
  by_category: { category: string; total: number; open: number }[];
  open_by_severity: Record<string, number>;
  weighted_backlog: number;
  median_days_to_resolve: number | null;
  escalations_90d: number;
  by_area: { zip: string; total: number; open: number }[];
  monthly: { month: string; reported: number; resolved: number }[];
  recent: {
    id: string;
    category: string;
    status: string;
    hazard_level: string;
    address: string | null;
    zip: string | null;
    confirm_count: number;
    created_at: string;
  }[];
}
