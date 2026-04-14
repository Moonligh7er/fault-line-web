'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { voteSchema } from '@/lib/zod-schemas';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

interface ActionResult {
  ok: boolean;
  message: string;
}

export async function submitVote(input: {
  reportId: string;
  voteType: 'upvote' | 'confirm';
}): Promise<ActionResult> {
  const parsed = voteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid request.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: 'You must be signed in.' };
  }

  const h = await headers();
  const rl = await checkRateLimit('vote', getRateLimitKey(user.id, h));
  if (!rl.success) {
    return { ok: false, message: 'Slow down — too many votes.' };
  }

  // Check owner (RLS/RPC also enforces this, but we fail fast)
  const { data: report } = await supabase
    .from('reports')
    .select('user_id')
    .eq('id', parsed.data.reportId)
    .maybeSingle();

  if (!report) return { ok: false, message: 'Report not found.' };
  if (report.user_id === user.id) {
    return { ok: false, message: "You can't vote on your own report." };
  }

  // Record vote (UNIQUE constraint prevents double-voting)
  const { error: insertErr } = await supabase.from('report_votes').insert({
    report_id: parsed.data.reportId,
    user_id: user.id,
    vote_type: parsed.data.voteType,
  });

  if (insertErr) {
    if (insertErr.code === '23505') {
      return { ok: false, message: 'You already voted on this report.' };
    }
    return { ok: false, message: 'Could not record vote.' };
  }

  // Increment counter via guarded RPC (migration 007)
  const rpcName =
    parsed.data.voteType === 'upvote' ? 'increment_upvote' : 'increment_confirm';
  await supabase.rpc(rpcName, { report_id: parsed.data.reportId });

  revalidatePath(`/report/${parsed.data.reportId}`);
  return {
    ok: true,
    message: parsed.data.voteType === 'upvote' ? 'Upvoted.' : 'Confirmed.',
  };
}
