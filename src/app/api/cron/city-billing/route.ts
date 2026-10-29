import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { logCityEvent, startCitySubscription, stripe } from '@/lib/stripe';
import type { CityAccount } from '@/lib/city';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get('authorization') ?? '';
  if (!secret) return false;
  const want = `Bearer ${secret}`;
  return got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

/**
 * Daily (vercel.json crons). Pilot ends:
 *   fee waived            → nothing happens
 *   renewal on            → annual subscription starts, invoice emailed (net 30)
 *   renewal off / unset   → access ends, nothing billed
 * Active accounts with an invoice past its due date are suspended (backs up
 * the webhook in case an event was missed). Reminder emails are sent by the
 * Supabase city-notices function from the event log.
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) return new NextResponse('Unauthorized', { status: 401 });
  const admin = createSupabaseServiceClient();
  const now = new Date().toISOString();
  const out = { started: 0, ended: 0, suspended: 0, errors: [] as string[] };

  const { data: due } = await admin
    .from('city_accounts')
    .select('*')
    .eq('status', 'pilot')
    .eq('fee_waived', false)
    .lte('pilot_ends_at', now)
    .returns<CityAccount[]>();

  for (const city of due ?? []) {
    if (city.auto_renew === true && city.terms_accepted_at) {
      try {
        await startCitySubscription(admin, city);
        out.started++;
      } catch (e) {
        out.errors.push(`${city.slug}: ${String(e)}`);
        await logCityEvent(admin, city.id, 'subscribe_failed', { error: String(e) }, `subfail:${now.slice(0, 10)}`);
      }
    } else {
      await admin.from('city_accounts').update({ status: 'ended' }).eq('id', city.id).eq('status', 'pilot');
      await logCityEvent(admin, city.id, 'ended', { reason: 'pilot ended without renewal' }, `pilot-end:${city.pilot_ends_at}`);
      out.ended++;
    }
  }

  const s = stripe();
  if (s) {
    const { data: active } = await admin
      .from('city_accounts')
      .select('id, slug, stripe_customer_id')
      .eq('status', 'active')
      .eq('fee_waived', false)
      .not('stripe_customer_id', 'is', null);
    for (const c of active ?? []) {
      const { data: open } = await s.invoices.list({ customer: c.stripe_customer_id!, status: 'open', limit: 10 });
      const overdue = open.find((i) => i.due_date && i.due_date * 1000 < Date.now());
      if (overdue) {
        await admin
          .from('city_accounts')
          .update({ status: 'suspended', suspended_at: now, suspended_reason: 'invoice past due' })
          .eq('id', c.id);
        await logCityEvent(admin, c.id, 'suspended', { invoice: overdue.id }, `overdue:${overdue.id}`);
        out.suspended++;
      }
    }
  }

  return NextResponse.json(out);
}
