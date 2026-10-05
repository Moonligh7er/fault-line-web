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

export async function reviewInbound(
  id: string,
  apply: boolean,
  status?: 'acknowledged' | 'in_progress' | 'resolved',
): Promise<Result> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('review_inbound', { p_id: id, p_apply: apply, p_status: status ?? null });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/queue');
  return { ok: true };
}

export async function setAutoApplyReplies(enabled: boolean): Promise<Result> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('set_setting', { p_key: 'auto_apply_replies', p_value: enabled });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/queue');
  return { ok: true };
}

/** Reply-To for outbound email (e.g. replies@replies.fault-line.dev); empty clears it. */
export async function setReplyTo(address: string): Promise<Result> {
  const value = address.trim().toLowerCase();
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { ok: false, error: 'Not an email address' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('set_setting', { p_key: 'reply_to', p_value: value || null });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/queue');
  return { ok: true };
}
