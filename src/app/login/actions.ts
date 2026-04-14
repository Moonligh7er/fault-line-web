'use server';

import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { magicLinkSchema } from '@/lib/zod-schemas';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { env } from '@/lib/env';

interface ActionResult {
  ok: boolean;
  error: string;
}

export async function sendMagicLink(input: {
  email: string;
  next: string;
}): Promise<ActionResult> {
  const parsed = magicLinkSchema.safeParse({ email: input.email });
  if (!parsed.success) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  const h = await headers();
  const rl = await checkRateLimit('auth', getRateLimitKey(null, h));
  if (!rl.success) {
    return {
      ok: false,
      error: 'Too many attempts. Try again in a few minutes.',
    };
  }

  // Validate `next` is a same-origin relative path (open-redirect guard)
  let nextPath = '/';
  if (typeof input.next === 'string' && input.next.startsWith('/') && !input.next.startsWith('//')) {
    nextPath = input.next;
  }

  const supabase = await createSupabaseServerClient();
  const redirectTo = `${env.NEXT_PUBLIC_APP_ORIGIN}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    // Don't leak whether the email exists
    return { ok: false, error: 'Could not send link. Please try again.' };
  }

  return { ok: true, error: '' };
}
