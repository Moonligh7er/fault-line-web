import Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TIERS, CITY_TERMS_VERSION, formatDate, type CityAccount } from '@/lib/city';

// City billing runs on Stripe Invoicing: annual subscriptions with
// collection_method=send_invoice, net 30, payable by bank transfer, ACH or card.
// Nothing here runs unless STRIPE_SECRET_KEY is set.

let client: Stripe | null = null;
export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

export async function logCityEvent(
  admin: SupabaseClient,
  cityId: string,
  kind: string,
  detail: Record<string, unknown>,
  dedupeKey?: string,
  actor = 'system',
): Promise<void> {
  await admin
    .from('city_account_events')
    .upsert({ city_account_id: cityId, kind, detail, actor, dedupe_key: dedupeKey ?? null }, {
      onConflict: 'city_account_id,dedupe_key',
      ignoreDuplicates: true,
    });
}

async function ownerEmail(admin: SupabaseClient, cityId: string): Promise<string | null> {
  const { data } = await admin.from('city_members').select('user_id').eq('city_account_id', cityId).eq('role', 'owner').limit(1);
  const uid = data?.[0]?.user_id;
  if (!uid) return null;
  const { data: u } = await admin.auth.admin.getUserById(uid);
  return u.user?.email ?? null;
}

async function ensureCustomer(s: Stripe, admin: SupabaseClient, city: CityAccount): Promise<string> {
  const footer =
    `Fault Line city dashboard, billed annually under the City Terms (version ${city.terms_version ?? CITY_TERMS_VERSION}) ` +
    `accepted on ${formatDate(city.terms_accepted_at)}. Renewal can be turned off at any time at ` +
    `app.fault-line.dev/portal. Questions: reports@fault-line.dev.`;
  const email = city.billing_email ?? (await ownerEmail(admin, city.id)) ?? undefined;
  const fields = city.po_number ? [{ name: 'PO Number', value: city.po_number }] : [];
  if (city.stripe_customer_id) {
    await s.customers.update(city.stripe_customer_id, {
      email,
      tax_exempt: 'exempt',
      invoice_settings: { footer, custom_fields: fields.length ? fields : '' },
    });
    return city.stripe_customer_id;
  }
  const customer = await s.customers.create({
    name: city.display_name,
    email,
    tax_exempt: 'exempt',
    invoice_settings: { footer, custom_fields: fields.length ? fields : undefined },
    metadata: { app: 'fault-line', city_account_id: city.id },
  });
  await admin.from('city_accounts').update({ stripe_customer_id: customer.id }).eq('id', city.id);
  return customer.id;
}

/** Price for this city: the locked price (or quote), never a newer published one. */
async function subscriptionItem(s: Stripe, city: CityAccount): Promise<Stripe.SubscriptionCreateParams.Item> {
  if (city.locked_price_id) return { price: city.locked_price_id };
  const tier = TIERS[city.tier];
  const cents = city.locked_price_cents ?? city.quoted_price_cents ?? tier.cents;
  if (cents == null) throw new Error('Metro accounts need a quoted price before billing');
  if (tier.lookupKey) {
    const { data } = await s.prices.list({ lookup_keys: [tier.lookupKey], active: true, limit: 1 });
    const p = data[0];
    if (p && p.unit_amount === cents) return { price: p.id };
    if (p) {
      const product = typeof p.product === 'string' ? p.product : p.product.id;
      return { price_data: { currency: 'usd', product, unit_amount: cents, recurring: { interval: 'year' } } };
    }
  }
  const { data: products } = await s.products.search({ query: `metadata['tier']:'${city.tier}' AND metadata['app']:'fault-line'` });
  if (!products[0]) throw new Error(`No Stripe product for tier ${city.tier}`);
  return { price_data: { currency: 'usd', product: products[0].id, unit_amount: cents, recurring: { interval: 'year' } } };
}

/**
 * Start the annual subscription. The first invoice is emailed by Stripe,
 * due in 30 days. Access stays open while it is unpaid and not yet due.
 */
export async function startCitySubscription(admin: SupabaseClient, city: CityAccount): Promise<string> {
  const s = stripe();
  if (!s) throw new Error('Billing is not configured (STRIPE_SECRET_KEY)');
  if (city.stripe_subscription_id) return city.stripe_subscription_id;
  const customer = await ensureCustomer(s, admin, city);
  const sub = await s.subscriptions.create(
    {
      customer,
      items: [await subscriptionItem(s, city)],
      collection_method: 'send_invoice',
      days_until_due: 30,
      cancel_at_period_end: city.auto_renew !== true,
      payment_settings: {
        payment_method_types: ['us_bank_account', 'customer_balance', 'card'],
        payment_method_options: {
          customer_balance: { funding_type: 'bank_transfer', bank_transfer: { type: 'us_bank_transfer' } },
        },
      },
      metadata: { app: 'fault-line', city_account_id: city.id },
    },
    // One start per city per day, so a retry never creates a second subscription.
    { idempotencyKey: `city-sub-${city.id}-${new Date().toISOString().slice(0, 10)}` },
  );
  const periodEnd = sub.items.data[0]?.current_period_end;
  await admin
    .from('city_accounts')
    .update({
      stripe_subscription_id: sub.id,
      status: 'active',
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      suspended_at: null,
      suspended_reason: null,
    })
    .eq('id', city.id);
  await logCityEvent(admin, city.id, 'subscription_started', { subscription: sub.id }, `sub-start:${sub.id}`);
  return sub.id;
}

/** Push billing email / PO number changes to the Stripe customer, if one exists. */
export async function syncCityCustomer(admin: SupabaseClient, city: CityAccount): Promise<void> {
  const s = stripe();
  if (!s || !city.stripe_customer_id) return;
  await ensureCustomer(s, admin, city);
}

/** Mirror the city's auto-renew choice onto an existing subscription. */
export async function syncAutoRenew(city: Pick<CityAccount, 'stripe_subscription_id'>, autoRenew: boolean): Promise<void> {
  const s = stripe();
  if (!s || !city.stripe_subscription_id) return;
  await s.subscriptions.update(city.stripe_subscription_id, { cancel_at_period_end: !autoRenew });
}

export async function billingPortalUrl(city: Pick<CityAccount, 'stripe_customer_id' | 'id'>): Promise<string | null> {
  const s = stripe();
  if (!s || !city.stripe_customer_id) return null;
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'https://app.fault-line.dev';
  const session = await s.billingPortal.sessions.create({
    customer: city.stripe_customer_id,
    return_url: `${origin}/portal/${city.id}/billing`,
  });
  return session.url;
}
