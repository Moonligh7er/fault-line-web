import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
              });
            }
          } catch {
            // Server Components cannot set cookies; middleware handles refresh.
          }
        },
      },
      auth: {
        flowType: 'pkce',
      },
    }
  );
}

/**
 * Service-role client. Use ONLY in server routes that legitimately need to
 * bypass RLS (admin tasks, scheduled jobs). Never expose to the client.
 */
export function createSupabaseServiceClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Service client must never run in the browser');
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  }
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        /* service client has no cookie surface */
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
