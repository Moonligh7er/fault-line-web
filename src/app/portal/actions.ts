'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { CITY_TERMS_VERSION, TIERS, type CityAccount } from '@/lib/city';
import { userError } from '@/lib/errors';
import { billingPortalUrl, logCityEvent, startCitySubscription, syncAutoRenew, syncCityCustomer } from '@/lib/stripe';

type Result = { ok: true } | { ok: false; error: string };

// Membership and role are re-checked in the database by every RPC; the
// service client is used only after that check, for Stripe bookkeeping.
// Ids arrive from the browser, so they are checked as UUIDs first.

const isUuid = (v: unknown): v is string => z.string().uuid().safeParse(v).success;
const BAD_ID: Result = { ok: false, error: 'City account not found' };
const BILLING_NOT_UPDATED = 'Saved, but the billing system did not update. We have been notified.';

async function loadCity(cityId: string): Promise<CityAccount | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('city_accounts').select('*').eq('id', cityId).maybeSingle<CityAccount>();
  return data ?? null;
}

export async function acceptCityTerms(cityId: string, autoRenew: boolean | null): Promise<Result> {
  if (!isUuid(cityId)) return BAD_ID;
  if (autoRenew !== null && typeof autoRenew !== 'boolean') return { ok: false, error: 'Choose whether the subscription renews.' };
  const supabase = await createSupabaseServerClient();
  const city = await loadCity(cityId);
  if (!city) return { ok: false, error: 'City account not found' };
  if (!city.fee_waived && autoRenew === null) return { ok: false, error: 'Choose whether the subscription renews.' };
  const { data: role } = await supabase.rpc('city_role', { p_city: cityId });
  if (role !== 'owner') return { ok: false, error: 'Only the account owner can accept the terms.' };

  // Lock today's published price before recording acceptance (only once).
  if (city.locked_price_cents == null) {
    const tier = TIERS[city.tier];
    const cents = city.quoted_price_cents ?? tier.cents;
    if (cents != null) {
      await createSupabaseServiceClient()
        .from('city_accounts')
        .update({ locked_price_cents: cents, locked_lookup_key: tier.lookupKey })
        .eq('id', cityId);
    }
  }
  const { error } = await supabase.rpc('city_accept_terms', {
    p_city: cityId,
    p_terms_version: CITY_TERMS_VERSION,
    p_auto_renew: autoRenew,
  });
  if (error) return { ok: false, error: userError('portal.acceptCityTerms', error, 'Could not record your acceptance. Please try again.') };
  revalidatePath(`/portal/${cityId}`);
  return { ok: true };
}

export async function setCityAutoRenew(cityId: string, on: boolean): Promise<Result> {
  if (!isUuid(cityId)) return BAD_ID;
  if (typeof on !== 'boolean') return { ok: false, error: 'Invalid request.' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('city_set_auto_renew', { p_city: cityId, p_on: on });
  if (error) return { ok: false, error: userError('portal.setCityAutoRenew', error, 'Could not change renewal. Please try again.') };
  const city = await loadCity(cityId);
  if (city?.stripe_subscription_id) {
    try {
      await syncAutoRenew(city, on);
    } catch (e) {
      return { ok: false, error: userError('portal.setCityAutoRenew.stripe', e, BILLING_NOT_UPDATED) };
    }
  }
  revalidatePath(`/portal/${cityId}/billing`);
  return { ok: true };
}

export async function setCityBilling(cityId: string, email: string, po: string): Promise<Result> {
  if (!isUuid(cityId)) return BAD_ID;
  if (typeof email !== 'string' || typeof po !== 'string') return { ok: false, error: 'Invalid request.' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('city_set_billing', {
    p_city: cityId,
    p_billing_email: email.trim() || null,
    p_po_number: po.trim() || null,
  });
  if (error) return { ok: false, error: userError('portal.setCityBilling', error, 'Could not save billing details. Check the email address and try again.') };
  const city = await loadCity(cityId);
  if (city?.stripe_customer_id) {
    try {
      await syncCityCustomer(createSupabaseServiceClient(), city);
    } catch (e) {
      return { ok: false, error: userError('portal.setCityBilling.stripe', e, BILLING_NOT_UPDATED) };
    }
  }
  revalidatePath(`/portal/${cityId}/billing`);
  return { ok: true };
}

/** After the pilot (or after access ended): turn renewal on and send the first invoice now. */
export async function subscribeCityNow(cityId: string): Promise<Result> {
  if (!isUuid(cityId)) return BAD_ID;
  const supabase = await createSupabaseServerClient();
  const { data: role } = await supabase.rpc('city_role', { p_city: cityId });
  if (role !== 'owner') return { ok: false, error: 'Only the account owner can subscribe.' };
  const current = await loadCity(cityId);
  if (!current) return { ok: false, error: 'City account not found' };
  if (!current.terms_accepted_at || current.terms_version !== CITY_TERMS_VERSION) {
    return { ok: false, error: 'Accept the current City Terms before subscribing.' };
  }
  const { error } = await supabase.rpc('city_set_auto_renew', { p_city: cityId, p_on: true });
  if (error) return { ok: false, error: userError('portal.subscribeCityNow', error, 'Could not turn on renewal. Please try again.') };
  const city = await loadCity(cityId);
  if (!city) return { ok: false, error: 'City account not found' };
  if (city.status === 'pilot' && city.pilot_ends_at && new Date(city.pilot_ends_at) > new Date()) {
    revalidatePath(`/portal/${cityId}/billing`);
    return { ok: true }; // the first invoice goes out when the pilot ends
  }
  const admin = createSupabaseServiceClient();
  try {
    await startCitySubscription(admin, { ...city, auto_renew: true, stripe_subscription_id: city.status === 'ended' ? null : city.stripe_subscription_id });
  } catch (e) {
    await logCityEvent(admin, cityId, 'subscribe_failed', { error: 'billing provider error (see server logs)' });
    return { ok: false, error: userError('portal.subscribeCityNow.stripe', e, 'Could not start billing. We have been notified and will follow up.') };
  }
  revalidatePath(`/portal/${cityId}`);
  return { ok: true };
}

export async function openCityBillingPortal(cityId: string): Promise<void> {
  if (!isUuid(cityId)) redirect('/portal');
  const city = await loadCity(cityId);
  if (!city) redirect('/portal');
  const supabase = await createSupabaseServerClient();
  const { data: role } = await supabase.rpc('city_role', { p_city: cityId });
  if (role !== 'owner') redirect(`/portal/${cityId}/billing`);
  const url = await billingPortalUrl(city);
  redirect(url ?? `/portal/${cityId}/billing`);
}

export async function setClusterContractor(cityId: string, clusterId: string, name: string): Promise<Result> {
  if (!isUuid(cityId) || !isUuid(clusterId)) return { ok: false, error: 'Not found' };
  if (typeof name !== 'string') return { ok: false, error: 'Invalid request.' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('city_set_contractor', { p_cluster: clusterId, p_name: name });
  if (error) return { ok: false, error: userError('portal.setClusterContractor', error, 'Could not save the contractor. Please try again.') };
  revalidatePath(`/portal/${cityId}/scorecard`);
  return { ok: true };
}
