import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ReportRow, AuthorityRow } from '@/lib/types';
import { generateClaimEvidence } from '@/lib/insurance';
import ClaimView from './claim-view';

const idSchema = z.string().uuid();

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: 'Insurance claim package' };

export default async function InsurancePage({ params }: PageProps) {
  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/report/${id}/insurance`);

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', parsed.data)
    .maybeSingle<ReportRow>();
  if (!report) notFound();

  let authorityName: string | undefined;
  if (report.authority_id) {
    const { data: authority } = await supabase
      .from('authorities')
      .select('name')
      .eq('id', report.authority_id)
      .maybeSingle<Pick<AuthorityRow, 'name'>>();
    authorityName = authority?.name;
  }

  const claim = generateClaimEvidence({ report, authorityName });

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <Link href={`/report/${id}`} style={{ fontSize: 14, color: 'var(--text-muted)' }}>
        ← Back to report
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '12px 0 4px' }}>
        Insurance Claim Package
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
        Evidence-ready claim document with timeline, GPS data, and authority notification
        history.
      </p>
      <ClaimView claim={claim} />
    </div>
  );
}
