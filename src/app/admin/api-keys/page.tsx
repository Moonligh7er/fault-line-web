import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import KeyManager, { type KeyRow } from './key-manager';

export const metadata = {
  title: 'API Keys',
  robots: { index: false, follow: false },
};

export default async function ApiKeysPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/api-keys');
  if (!(await isAdmin(supabase))) redirect('/');

  // Column-level grant: the key hash is never readable, even by admins.
  const { data } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, scopes, daily_limit, created_at, last_used_at, revoked_at')
    .order('created_at', { ascending: false });

  const keys: KeyRow[] = (data ?? []).map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.key_prefix,
    scopes: k.scopes,
    dailyLimit: k.daily_limit,
    createdAt: k.created_at,
    lastUsedAt: k.last_used_at,
    revokedAt: k.revoked_at,
  }));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Link href="/admin/queue" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
        ← Outbound queue
      </Link>
      <h1 style={{ fontSize: 34, fontWeight: 900, margin: '12px 0 8px' }}>API keys</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Read access to Fault Line data for AI agents, tools and partners. Endpoints and schemas:{' '}
        <a href="/api/v1/openapi.json">/api/v1/openapi.json</a>. Keys are stored hashed and shown once.
      </p>
      <KeyManager keys={keys} />
    </div>
  );
}
