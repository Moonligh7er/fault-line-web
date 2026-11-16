'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { userError } from '@/lib/errors';

// Both RPCs re-check is_admin() in the database (FaultLine migration 027).

export async function createKey(
  name: string,
  internal: boolean,
): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('create_api_key', { p_name: name, p_internal: internal });
  if (error || typeof data !== 'string') return { ok: false, error: error ? userError('admin.apiKeys.create', error, 'Could not create key') : 'Could not create key' };
  revalidatePath('/admin/api-keys');
  return { ok: true, key: data };
}

export async function revokeKey(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('revoke_api_key', { p_id: id });
  if (error) return { ok: false, error: userError('admin.apiKeys', error, 'Could not save. Please try again.') };
  revalidatePath('/admin/api-keys');
  return { ok: true };
}
