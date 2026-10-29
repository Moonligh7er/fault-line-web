import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TIERS, cityPriceCents, formatDate, formatUsd, renewalSummary } from '@/lib/city';
import { getCityContext } from '../city-context';
import Table from '../table';
import { openCityBillingPortal } from '../../actions';
import BillingControls from './billing-controls';

export const metadata = { title: 'Plan & billing' };
export const dynamic = 'force-dynamic';

const EVENT_LABELS: Record<string, string> = {
  terms_accepted: 'Terms accepted',
  auto_renew_changed: 'Renewal choice changed',
  member_joined: 'Staff member joined',
  reminder_sent: 'Reminder emailed',
  subscription_started: 'Subscription started, first invoice sent',
  invoice_paid: 'Invoice paid',
  suspended: 'Access suspended (invoice past due)',
  reactivated: 'Access restored',
  ended: 'Access ended',
  fee_waived: 'Fee waived',
  fee_waiver_removed: 'Fee waiver removed',
  notice_sent: 'Notice emailed',
};

export default async function BillingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { city, role } = await getCityContext(id, `/portal/${id}/billing`);
  const supabase = await createSupabaseServerClient();
  const { data: events } = await supabase
    .from('city_account_events')
    .select('kind, detail, actor, created_at')
    .eq('city_account_id', id)
    .order('created_at', { ascending: false })
    .limit(50);
  const tier = TIERS[city.tier];
  const isOwner = role === 'owner' || role === 'admin';
  const canSubscribeNow = !city.fee_waived && (city.status === 'ended' || (city.status === 'pilot' && city.auto_renew !== true));

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 760 }}>
      <section className="card">
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Your plan</h2>
        <Table
          head={['', '']}
          rows={[
            ['Plan', `${tier.label} (${tier.population})`],
            ['Price', city.fee_waived ? 'Fee waived' : `${formatUsd(cityPriceCents(city))} per year${city.locked_price_cents != null ? ', locked' : ''}`],
            ['Status', city.status],
            ...(city.status === 'pilot' ? [['Pilot ends', formatDate(city.pilot_ends_at)]] : []),
            ...(city.current_period_end ? [['Current term ends', formatDate(city.current_period_end)]] : []),
            ['Renews automatically', city.fee_waived ? '—' : city.auto_renew === null ? 'not chosen' : city.auto_renew ? 'yes' : 'no'],
            ['Billing contact', city.billing_email ?? 'account owner'],
            ['PO number', city.po_number ?? '—'],
          ]}
        />
        <p style={{ marginTop: 12 }}>{renewalSummary(city)}</p>
      </section>

      {isOwner && !city.fee_waived && (
        <BillingControls
          cityId={id}
          autoRenew={city.auto_renew}
          billingEmail={city.billing_email ?? ''}
          po={city.po_number ?? ''}
          canSubscribeNow={canSubscribeNow}
          priceLabel={formatUsd(cityPriceCents(city))}
        />
      )}

      {isOwner && city.stripe_customer_id && (
        <section className="card">
          <h2 style={{ fontSize: 18, marginBottom: 6 }}>Invoices &amp; payment</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
            View and download invoices, pay by bank transfer, ACH or card, and update the payment method.
          </p>
          <form action={openCityBillingPortal.bind(null, id)}>
            <button type="submit" className="btn btn-outline">
              Open invoices
            </button>
          </form>
        </section>
      )}

      {isOwner && (
        <section className="card">
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Account history</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
            Every acceptance, renewal choice, reminder and billing change, kept as the record of what was agreed and when.
          </p>
          <Table
            head={['When', 'What', 'By']}
            rows={(events ?? []).map((e) => [
              new Date(e.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
              EVENT_LABELS[e.kind] ?? e.kind,
              e.actor ?? '—',
            ])}
          />
        </section>
      )}
    </div>
  );
}
