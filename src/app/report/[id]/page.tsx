import { notFound } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCategoryInfo, HAZARD_LEVELS } from '@/lib/categories';
import { env } from '@/lib/env';
import type { ReportRow } from '@/lib/types';
import VoteButtons from './vote-buttons';
import ShareButton from '@/components/ShareButton';

const idSchema = z.string().uuid();

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { title: 'Report not found' };

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('reports')
    .select('category, address, city, state')
    .eq('id', parsed.data)
    .maybeSingle();

  if (!data) return { title: 'Report not found' };
  const info = getCategoryInfo(data.category);
  return {
    title: `${info?.label ?? data.category} report${data.city ? ` in ${data.city}` : ''}`,
  };
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', parsed.data)
    .maybeSingle<ReportRow>();

  if (error || !report) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const info = getCategoryInfo(report.category);
  const hazard = HAZARD_LEVELS.find((h) => h.key === report.hazard_level);
  const isOwner = user?.id === report.user_id;

  return (
    <article style={{ maxWidth: 720, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <Link
          href="/map"
          style={{ fontSize: 14, color: 'var(--text-muted)' }}
        >
          ← Back to map
        </Link>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: '12px 0 8px' }}>
          {info?.label ?? report.category}
        </h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 100,
              background: hazard?.color ?? '#555',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {report.hazard_level.replace('_', ' ')}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Status: {report.status}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {new Date(report.created_at).toLocaleDateString()}
          </span>
        </div>
      </header>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Location</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          {report.address ?? 'Address not provided'}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
        </p>
      </section>

      {report.description && (
        <section className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Description</h2>
          <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
            {report.description}
          </p>
        </section>
      )}

      {report.media && report.media.length > 0 && (
        <section className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Photos</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            {report.media.map((m, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={idx}
                src={m.url}
                alt={`Report photo ${idx + 1}`}
                style={{
                  width: '100%',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                }}
                loading="lazy"
              />
            ))}
          </div>
        </section>
      )}

      <section
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{report.upvote_count}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Upvotes</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{report.confirm_count}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Confirms</div>
            </div>
          </div>
        </div>
        <VoteButtons
          reportId={report.id}
          isSignedIn={Boolean(user)}
          isOwner={isOwner}
        />
      </section>

      <section style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <ShareButton
          url={`${env.NEXT_PUBLIC_APP_ORIGIN}/report/${report.id}`}
          title={`${info?.label ?? report.category} report on Fault Line`}
        />
        {user && (
          <>
            <Link href={`/report/${report.id}/legal`} className="btn btn-outline">
              Legal demand letter
            </Link>
            <Link href={`/report/${report.id}/insurance`} className="btn btn-outline">
              Insurance claim package
            </Link>
          </>
        )}
      </section>
    </article>
  );
}
