'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

export async function markSubmitted(
  logId: string,
  newStatus: 'sent' | 'failed',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('escalation_log')
    .update({
      status: newStatus,
      sent_at: newStatus === 'sent' ? new Date().toISOString() : null,
      error_message: newStatus === 'failed' ? 'Admin marked failed from queue' : null,
    })
    .eq('id', logId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/queue');
  return { ok: true };
}
