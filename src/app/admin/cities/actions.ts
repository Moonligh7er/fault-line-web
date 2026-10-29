'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { logCityEvent } from '@/lib/stripe';

type Result = { ok: true } | { ok: false; error: string };

async function adminActor(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(supabase))) return null;
  return user.email ?? 'admin';
}

export async function searchAuthorities(q: string): Promise<{ id: string; name: string; state: string | null; city: string | null }[]> {
  if (!(await adminActor()) || q.trim().length < 2) return [];
  const { data } = await createSupabaseServiceClient()
    .from('authorities')
    .select('id, name, state, city')
    .ilike('name', `%${q.trim().replace(/[%_]/g, '')}%`)
    .eq('is_active', true)
    .order('name')
    .limit(15);
  return data ?? [];
}

const CreateSchema = z.object({
  authorityId: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,59}$/, 'slug: lowercase letters, numbers and dashes'),
  displayName: z.string().trim().min(2).max(120),
  tier: z.enum(['town', 'city', 'regional', 'metro']),
  population: z.coerce.number().int().min(0).optional(),
  pilotEndsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  feeWaived: z.boolean(),
  waiverNote: z.string().max(500).optional(),
  quotedUsd: z.coerce.number().min(0).optional(),
  ownerEmail: z.string().trim().toLowerCase().email(),
});

export async function createCityAccount(input: z.input<typeof CreateSchema>): Promise<Result> {
  const actor = await adminActor();
  if (!actor) return { ok: false, error: 'not authorized' };
  const p = CreateSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues.map((i) => i.message).join('; ') };
  const v = p.data;
  if (v.tier === 'metro' && !v.quotedUsd) return { ok: false, error: 'Metro accounts need a quoted annual price.' };
  const admin = createSupabaseServiceClient();
  const { data, error } = await admin
    .from('city_accounts')
    .insert({
      authority_id: v.authorityId,
      slug: v.slug,
      display_name: v.displayName,
      tier: v.tier,
      population: v.population ?? null,
      pilot_ends_at: `${v.pilotEndsAt}T23:59:59Z`,
      fee_waived: v.feeWaived,
      fee_waiver_note: v.feeWaived ? v.waiverNote ?? null : null,
      quoted_price_cents: v.tier === 'metro' && v.quotedUsd ? Math.round(v.quotedUsd * 100) : null,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  await admin.from('city_invites').insert({ city_account_id: data.id, email: v.ownerEmail, role: 'owner', invited_by: actor });
  await logCityEvent(admin, data.id, 'created', { tier: v.tier, pilot_ends_at: v.pilotEndsAt, fee_waived: v.feeWaived }, undefined, actor);
  if (v.feeWaived) await logCityEvent(admin, data.id, 'fee_waived', { note: v.waiverNote ?? null }, undefined, actor);
  revalidatePath('/admin/cities');
  return { ok: true };
}

export async function inviteCityMember(cityId: string, email: string, role: 'owner' | 'staff'): Promise<Result> {
  const actor = await adminActor();
  if (!actor) return { ok: false, error: 'not authorized' };
  const e = z.string().trim().toLowerCase().email().safeParse(email);
  if (!e.success) return { ok: false, error: 'invalid email' };
  const { error } = await createSupabaseServiceClient()
    .from('city_invites')
    .upsert({ city_account_id: cityId, email: e.data, role, invited_by: actor, accepted_at: null }, { onConflict: 'city_account_id,email' });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/cities');
  return { ok: true };
}

/** Waivers can be granted any time; removing one never bills by itself (renewal stays off until the owner turns it on). */
export async function setFeeWaiver(cityId: string, waived: boolean, note: string): Promise<Result> {
  const actor = await adminActor();
  if (!actor) return { ok: false, error: 'not authorized' };
  const admin = createSupabaseServiceClient();
  const patch: Record<string, unknown> = { fee_waived: waived, fee_waiver_note: waived ? note || null : null };
  if (!waived) patch.auto_renew = false;
  const { error } = await admin.from('city_accounts').update(patch).eq('id', cityId);
  if (error) return { ok: false, error: error.message };
  await logCityEvent(admin, cityId, waived ? 'fee_waived' : 'fee_waiver_removed', { note: note || null }, undefined, actor);
  revalidatePath('/admin/cities');
  return { ok: true };
}

export async function extendPilot(cityId: string, date: string): Promise<Result> {
  const actor = await adminActor();
  if (!actor) return { ok: false, error: 'not authorized' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'date must be YYYY-MM-DD' };
  const admin = createSupabaseServiceClient();
  const { data: c } = await admin.from('city_accounts').select('status').eq('id', cityId).single();
  const patch: Record<string, unknown> = { pilot_ends_at: `${date}T23:59:59Z` };
  if (c?.status === 'ended') patch.status = 'pilot';
  const { error } = await admin.from('city_accounts').update(patch).eq('id', cityId);
  if (error) return { ok: false, error: error.message };
  await logCityEvent(admin, cityId, 'pilot_extended', { pilot_ends_at: date }, undefined, actor);
  revalidatePath('/admin/cities');
  return { ok: true };
}
