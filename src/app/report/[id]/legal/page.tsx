import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ReportRow, AuthorityRow } from '@/lib/types';
import { generateDemandLetter } from '@/lib/legal';
import LegalLetterView from './letter-view';

const idSchema = z.string().uuid();

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: 'Legal demand letter' };

export default async function LegalLetterPage({ params }: PageProps) {
  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/report/${id}/legal`);

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', parsed.data)
    .maybeSingle<ReportRow>();
  if (!report) notFound();

  let authorityName = 'Local Authority';
  if (report.authority_id) {
    const { data: authority } = await supabase
      .from('authorities')
      .select('name')
      .eq('id', report.authority_id)
      .maybeSingle<Pick<AuthorityRow, 'name'>>();
    if (authority) authorityName = authority.name;
  }

  const letter = generateDemandLetter({ report, authorityName });

  if (!letter) {
    return (
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <Link href={`/report/${id}`} style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          ← Back to report
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '12px 0 12px' }}>
          Legal Demand Letter
        </h1>
        <p className="card" style={{ color: 'var(--text-secondary)' }}>
          {report.state
            ? `Letter templates currently cover Massachusetts, Rhode Island, and New Hampshire. This report is in ${report.state}, so no letter can be generated yet — we won't cite another state's law.`
            : "We couldn't determine which state this report is in, so no letter can be generated. Letters depend on state law, and we won't guess."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <Link href={`/report/${id}`} style={{ fontSize: 14, color: 'var(--text-muted)' }}>
        ← Back to report
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '12px 0 4px' }}>
        Legal Demand Letter
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
        Formal notice-of-defect letter citing {letter.statute}
        {letter.isOverdue && (
          <span
            style={{
              marginLeft: 8,
              padding: '2px 10px',
              borderRadius: 100,
              background: 'var(--danger)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            OVERDUE
          </span>
        )}
      </p>
      <LegalLetterView letterText={letter.letterText} />
    </div>
  );
}
