'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Result = { ok: true } | { ok: false; error: string };

// Every action goes through a SECURITY DEFINER RPC that re-checks is_admin()
// in the database, so a non-admin calling these gets "not authorized".

export async function reviewOutbound(id: string, approve: boolean, note?: string): Promise<Result> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('review_outbound', {
    p_id: id,
    p_approve: approve,
    p_note: note?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/queue');
  return { ok: true };
}

export async function setAutoSend(enabled: boolean): Promise<Result> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('set_setting', { p_key: 'auto_send', p_value: enabled });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/queue');
  return { ok: true };
}

/** Web-form escalations a human submitted by hand (or gave up on). */
export async function markSubmitted(logId: string, newStatus: 'sent' | 'failed'): Promise<Result> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('mark_escalation_handled', { p_log_id: logId, p_status: newStatus });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/queue');
  return { ok: true };
}
