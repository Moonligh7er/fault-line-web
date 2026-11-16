import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CATEGORIES, getCategoryInfo } from '@/lib/categories';
import type { ReportRow } from '@/lib/types';
import { REPORT_COLUMNS } from '@/lib/report-columns';

export const metadata = {
  title: 'Search reports',
  description: 'Search infrastructure reports by category, city, or state.',
};

interface SearchParams {
  q?: string;
  category?: string;
  state?: string;
  city?: string;
  status?: string;
}

const ALLOWED_STATUSES = new Set([
  'submitted',
  'acknowledged',
  'in_progress',
  'resolved',
  'closed',
  'rejected',
]);
const CATEGORY_SET = new Set(CATEGORIES.map((c) => c.key));

// The keyword goes into a PostgREST .or() filter, where commas, parentheses
// and quotes are syntax. Keep only letters, numbers, spaces, hyphens,
// apostrophes and periods; at most 100 characters.
function keyword(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .replace(/[^\p{L}\p{N} '.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
    .trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function safe(value: string | undefined, max = 100): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : undefined;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = keyword(params.q);
  const rawCategory = safe(params.category);
  const rawState = safe(params.state, 2);
  const rawCity = safe(params.city);
  const rawStatus = safe(params.status, 32);

  // Whitelist filters — never let the client inject arbitrary column values
  const category =
    rawCategory && CATEGORY_SET.has(rawCategory as (typeof CATEGORIES)[number]['key'])
      ? rawCategory
      : undefined;
  const status = rawStatus && ALLOWED_STATUSES.has(rawStatus) ? rawStatus : undefined;
  const state = rawState && /^[A-Z]{2}$/.test(rawState.toUpperCase()) ? rawState.toUpperCase() : undefined;

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('reports')
    .select(REPORT_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);
  if (state) query = query.eq('state', state);
  if (rawCity) query = query.ilike('city', `%${rawCity.replace(/[%_]/g, '\\$&')}%`);
  if (q) {
    // keyword() already removed %, _ and every .or() delimiter.
    query = query.or(`description.ilike.%${q}%,address.ilike.%${q}%`);
  }

  const { data: reports, count } = await query.returns<ReportRow[]>();

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>Search Reports</h1>

      <form method="get" className="card" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          <input
            type="search"
            name="q"
            placeholder="Keyword"
            defaultValue={q ?? ''}
            maxLength={100}
          />
          <select name="category" defaultValue={category ?? ''}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={status ?? ''}>
            <option value="">Any status</option>
            {[...ALLOWED_STATUSES].map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="state"
            placeholder="State (e.g. MA)"
            defaultValue={state ?? ''}
            maxLength={2}
          />
          <input
            type="text"
            name="city"
            placeholder="City"
            defaultValue={rawCity ?? ''}
            maxLength={100}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }}>
          Search
        </button>
      </form>

      <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
        {count ?? 0} result{count === 1 ? '' : 's'}
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        {(reports ?? []).map((r) => {
          const info = getCategoryInfo(r.category);
          return (
            <Link
              key={r.id}
              href={`/report/${r.id}`}
              className="card"
              style={{ color: 'var(--text)', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{info?.label ?? r.category}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {r.address ?? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`}
                {' · '}
                {r.city ?? ''}
                {' · '}
                {r.status}
              </div>
            </Link>
          );
        })}
        {(!reports || reports.length === 0) && (
          <p style={{ color: 'var(--text-muted)' }}>No reports match your search.</p>
        )}
      </div>
    </div>
  );
}
