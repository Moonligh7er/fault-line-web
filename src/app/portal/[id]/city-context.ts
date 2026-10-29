import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CITY_TERMS_VERSION, type CityAccount } from '@/lib/city';

export interface CityContext {
  city: CityAccount;
  role: 'owner' | 'staff' | 'admin';
  accessOpen: boolean;
  termsCurrent: boolean;
}

/** Loads the city for a portal page; RLS returns nothing to non-members. */
export async function getCityContext(id: string, next: string): Promise<CityContext> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  const [{ data: city }, { data: role }, { data: open }, { data: admin }] = await Promise.all([
    supabase.from('city_accounts').select('*').eq('id', id).maybeSingle<CityAccount>(),
    supabase.rpc('city_role', { p_city: id }),
    supabase.rpc('city_access_open', { p_city: id }),
    supabase.rpc('is_admin'),
  ]);
  if (!city) notFound();
  return {
    city,
    role: (role as 'owner' | 'staff' | null) ?? (admin === true ? 'admin' : 'staff'),
    accessOpen: open === true,
    termsCurrent: !!city.terms_accepted_at && city.terms_version === CITY_TERMS_VERSION,
  };
}
