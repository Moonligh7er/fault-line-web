import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { logCityEvent, stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * City billing webhook. Verifies the signature on the raw body, records each
 * event once (stripe_events), and maps Stripe state onto city_accounts:
 *   subscription active            → active
 *   subscription past_due / unpaid → suspended (access paused until paid)
 *   subscription canceled / ended  → ended
 *   invoice.overdue                → suspended
 *   invoice.paid                   → active again if it was suspended
 * Events can arrive out of order or late, so subscription and invoice events
 * re-fetch the subscription (and invoice) from Stripe and act on its state
 * now, never on the snapshot in the event.
 */
export async function POST(req: NextRequest) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!s || !secret) return new NextResponse('Billing not configured', { status: 503 });

  const sig = req.headers.get('stripe-signature');
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(raw, sig ?? '', secret);
  } catch {
    return new NextResponse('Bad signature', { status: 400 });
  }

  const admin = createSupabaseServiceClient();
  const { error: dupErr } = await admin.from('stripe_events').insert({ id: event.id, type: event.type });
  if (dupErr) {
    if (dupErr.code === '23505') return NextResponse.json({ received: true, duplicate: true });
    return new NextResponse('Store failed', { status: 500 });
  }

  try {
    await handle(event, admin, s);
  } catch (e) {
    // Let Stripe retry: forget the event so the retry is processed.
    await admin.from('stripe_events').delete().eq('id', event.id);
    console.error('stripe webhook', event.type, e);
    return new NextResponse('Handler failed', { status: 500 });
  }
  return NextResponse.json({ received: true });
}

type Admin = ReturnType<typeof createSupabaseServiceClient>;
type CityRow = { id: string; status: string; stripe_subscription_id: string | null };

async function cityFor(admin: Admin, opts: { cityId?: string | null; subscription?: string | null; customer?: string | null }) {
  const cols = 'id, status, stripe_subscription_id';
  if (opts.cityId) {
    const { data } = await admin.from('city_accounts').select(cols).eq('id', opts.cityId).maybeSingle();
    if (data) return data as CityRow;
  }
  if (opts.subscription) {
    const { data } = await admin.from('city_accounts').select(cols).eq('stripe_subscription_id', opts.subscription).maybeSingle();
    if (data) return data as CityRow;
  }
  if (opts.customer) {
    const { data } = await admin.from('city_accounts').select(cols).eq('stripe_customer_id', opts.customer).maybeSingle();
    if (data) return data as CityRow;
  }
  return null;
}

const idOf = (x: string | { id: string } | null | undefined) => (typeof x === 'string' ? x : x?.id ?? null);

/** City status implied by a subscription's current Stripe status (null = leave as is). */
function statusFor(sub: Stripe.Subscription): 'active' | 'suspended' | 'ended' | null {
  if (sub.status === 'active' || sub.status === 'trialing') return 'active';
  if (sub.status === 'past_due' || sub.status === 'unpaid') return 'suspended';
  if (sub.status === 'canceled' || sub.status === 'incomplete_expired') return 'ended';
  return null;
}

async function setStatus(admin: Admin, city: { id: string; status: string }, status: 'active' | 'suspended' | 'ended', eventId: string, extra: Record<string, unknown> = {}) {
  if (city.status === status && Object.keys(extra).length === 0) return;
  const patch: Record<string, unknown> = { status, ...extra };
  if (status === 'suspended' && city.status !== 'suspended') {
    patch.suspended_at = new Date().toISOString();
    patch.suspended_reason = 'invoice past due';
  }
  if (status !== 'suspended') {
    patch.suspended_at = null;
    patch.suspended_reason = null;
  }
  // Conditional on the status we read, so two events racing (invoice.paid and
  // subscription.updated arrive together) log and notify the change once.
  const { data: changed } = await admin.from('city_accounts').update(patch).eq('id', city.id).eq('status', city.status).select('id');
  if (city.status !== status && changed?.length) {
    const kind = status === 'suspended' ? 'suspended' : status === 'ended' ? 'ended' : city.status === 'suspended' ? 'reactivated' : 'active';
    await logCityEvent(admin, city.id, kind, { stripe_event: eventId }, `stripe:${eventId}`);
  }
}

async function handle(event: Stripe.Event, admin: Admin, s: Stripe) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = await s.subscriptions.retrieve((event.data.object as Stripe.Subscription).id);
      const city = await cityFor(admin, { cityId: sub.metadata?.city_account_id, subscription: sub.id, customer: idOf(sub.customer) });
      if (!city) return;
      // A late event about a subscription the city has since replaced.
      if (city.stripe_subscription_id && city.stripe_subscription_id !== sub.id) return;
      const periodEnd = sub.items.data[0]?.current_period_end;
      const extra = {
        stripe_subscription_id: sub.status === 'canceled' ? null : sub.id,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      };
      const status = statusFor(sub);
      if (status) await setStatus(admin, city, status, event.id, extra);
      else await admin.from('city_accounts').update(extra).eq('id', city.id);
      return;
    }
    case 'invoice.overdue':
    case 'invoice.payment_failed': {
      const inv = await s.invoices.retrieve((event.data.object as Stripe.Invoice).id);
      if (inv.status !== 'open') return; // paid, voided or written off since
      if (event.type === 'invoice.payment_failed' && inv.due_date && inv.due_date * 1000 > Date.now()) return; // not due yet
      const subId = idOf(inv.parent?.subscription_details?.subscription ?? null);
      const sub = subId ? await s.subscriptions.retrieve(subId) : null;
      if (sub && statusFor(sub) === 'ended') return; // the subscription event ends access
      const city = await cityFor(admin, { subscription: subId, customer: idOf(inv.customer) });
      if (city && city.status === 'active') await setStatus(admin, city, 'suspended', event.id);
      return;
    }
    case 'invoice.paid': {
      const inv = event.data.object as Stripe.Invoice;
      const subId = idOf(inv.parent?.subscription_details?.subscription ?? null);
      const sub = subId ? await s.subscriptions.retrieve(subId) : null;
      const city = await cityFor(admin, { subscription: subId, customer: idOf(inv.customer) });
      if (!city) return;
      await logCityEvent(admin, city.id, 'invoice_paid', { invoice: inv.id, amount_paid: inv.amount_paid }, `paid:${inv.id}`);
      // Reactivate only if the subscription is in good standing now (another
      // invoice may still be overdue, or it may have been canceled).
      if (city.status === 'suspended' && (!sub || statusFor(sub) === 'active')) await setStatus(admin, city, 'active', event.id);
      return;
    }
    case 'invoice.finalized': {
      const inv = event.data.object as Stripe.Invoice;
      const city = await cityFor(admin, { subscription: idOf(inv.parent?.subscription_details?.subscription ?? null), customer: idOf(inv.customer) });
      if (city) await logCityEvent(admin, city.id, 'invoice_sent', { invoice: inv.id, amount_due: inv.amount_due, due_date: inv.due_date }, `inv:${inv.id}`);
      return;
    }
    case 'charge.refunded': {
      const ch = event.data.object as Stripe.Charge;
      const city = await cityFor(admin, { customer: idOf(ch.customer) });
      if (city) await logCityEvent(admin, city.id, 'refunded', { charge: ch.id, amount_refunded: ch.amount_refunded }, `refund:${ch.id}`);
      return;
    }
  }
}
