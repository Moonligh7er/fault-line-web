import type { SupabaseClient } from '@supabase/supabase-js';

// Admin = a row in public.admin_users (FaultLine migration 025), checked by
// the is_admin() RPC under the caller's own session. The same check guards
// the DB side (RLS on outbound_messages / app_settings, review RPCs), so the
// UI and the data can't disagree — and no service-role key is needed here.
export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}
