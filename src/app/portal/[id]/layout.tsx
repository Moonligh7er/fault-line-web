import Link from 'next/link';
import type { ReactNode } from 'react';
import { getCityContext } from './city-context';
import { formatDate, renewalSummary } from '@/lib/city';

export const metadata = { robots: { index: false, follow: false } };

export default async function CityPortalLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { city, role, accessOpen } = await getCityContext(id, `/portal/${id}`);
  const tabs = [
    ['', 'Dashboard'],
    ['/scorecard', 'Contractor scorecard'],
    ['/predeployment', 'Pre-deployment'],
    ['/exports', 'Exports'],
    ['/billing', 'Plan & billing'],
  ] as const;
  const pilotDaysLeft =
    city.status === 'pilot' && city.pilot_ends_at
      ? Math.ceil((new Date(city.pilot_ends_at).getTime() - Date.now()) / 86_400_000)
      : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>{city.display_name}</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {role} · <Link href={`/city/${city.slug}`}>public page</Link>
        </span>
      </div>
      <nav aria-label="City portal" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '12px 0 20px', fontSize: 14 }}>
        {tabs.map(([path, label]) => (
          <Link key={path} href={`/portal/${id}${path}`}>
            {label}
          </Link>
        ))}
      </nav>
      {!city.fee_waived && pilotDaysLeft !== null && pilotDaysLeft <= 60 && pilotDaysLeft > 0 && (
        <div className="card" role="status" style={{ borderColor: 'var(--accent)', marginBottom: 20 }}>
          <strong>Pilot ends {formatDate(city.pilot_ends_at)} ({pilotDaysLeft} days).</strong> {renewalSummary(city)}{' '}
          <Link href={`/portal/${id}/billing`}>Review your plan</Link> ·{' '}
          <Link href="/feedback">Tell us what&apos;s working and what isn&apos;t</Link>
        </div>
      )}
      {!accessOpen && city.terms_accepted_at && (
        <div className="card" role="alert" style={{ borderColor: 'var(--danger)', marginBottom: 20 }}>
          {city.status === 'suspended' ? (
            <>
              <strong>Dashboard access is suspended</strong> because an invoice is past due. It reopens as soon as the
              invoice is paid. <Link href={`/portal/${id}/billing`}>View invoices</Link>
            </>
          ) : (
            <>
              <strong>Dashboard access has ended.</strong> Your city&apos;s public page and every resident report stay
              public. <Link href={`/portal/${id}/billing`}>Subscribe to restore access</Link>
            </>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
