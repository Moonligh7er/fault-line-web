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
    await handle(event, admin);
  } catch (e) {
    // Let Stripe retry: forget the event so the retry is processed.
    await admin.from('stripe_events').delete().eq('id', event.id);
    console.error('stripe webhook', event.type, e);
    return new NextResponse('Handler failed', { status: 500 });
  }
  return NextResponse.json({ received: true });
}

type Admin = ReturnType<typeof createSupabaseServiceClient>;

async function cityFor(admin: Admin, opts: { cityId?: string | null; subscription?: string | null; customer?: string | null }) {
  if (opts.cityId) {
    const { data } = await admin.from('city_accounts').select('id, status').eq('id', opts.cityId).maybeSingle();
    if (data) return data as { id: string; status: string };
  }
  if (opts.subscription) {
    const { data } = await admin.from('city_accounts').select('id, status').eq('stripe_subscription_id', opts.subscription).maybeSingle();
    if (data) return data as { id: string; status: string };
  }
  if (opts.customer) {
    const { data } = await admin.from('city_accounts').select('id, status').eq('stripe_customer_id', opts.customer).maybeSingle();
    if (data) return data as { id: string; status: string };
  }
  return null;
}

const idOf = (x: string | { id: string } | null | undefined) => (typeof x === 'string' ? x : x?.id ?? null);

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
  await admin.from('city_accounts').update(patch).eq('id', city.id);
  if (city.status !== status) {
    const kind = status === 'suspended' ? 'suspended' : status === 'ended' ? 'ended' : city.status === 'suspended' ? 'reactivated' : 'active';
    await logCityEvent(admin, city.id, kind, { stripe_event: eventId }, `stripe:${eventId}`);
  }
}

async function handle(event: Stripe.Event, admin: Admin) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const city = await cityFor(admin, { cityId: sub.metadata?.city_account_id, subscription: sub.id, customer: idOf(sub.customer) });
      if (!city) return;
      const periodEnd = sub.items.data[0]?.current_period_end;
      const extra = {
        stripe_subscription_id: sub.status === 'canceled' ? null : sub.id,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      };
      const status =
        sub.status === 'active' || sub.status === 'trialing'
          ? 'active'
          : sub.status === 'past_due' || sub.status === 'unpaid'
            ? 'suspended'
            : sub.status === 'canceled' || sub.status === 'incomplete_expired'
              ? 'ended'
              : null;
      if (status) await setStatus(admin, city, status, event.id, extra);
      else await admin.from('city_accounts').update(extra).eq('id', city.id);
      return;
    }
    case 'invoice.overdue':
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      if (event.type === 'invoice.payment_failed' && inv.due_date && inv.due_date * 1000 > Date.now()) return; // not due yet
      const subId = idOf(inv.parent?.subscription_details?.subscription ?? null);
      const city = await cityFor(admin, { subscription: subId, customer: idOf(inv.customer) });
      if (city && city.status === 'active') await setStatus(admin, city, 'suspended', event.id);
      return;
    }
    case 'invoice.paid': {
      const inv = event.data.object as Stripe.Invoice;
      const subId = idOf(inv.parent?.subscription_details?.subscription ?? null);
      const city = await cityFor(admin, { subscription: subId, customer: idOf(inv.customer) });
      if (!city) return;
      await logCityEvent(admin, city.id, 'invoice_paid', { invoice: inv.id, amount_paid: inv.amount_paid }, `paid:${inv.id}`);
      if (city.status === 'suspended') await setStatus(admin, city, 'active', event.id);
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
