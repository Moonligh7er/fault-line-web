'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getCategoryInfo } from '@/lib/categories';
import type { ReportRow } from '@/lib/types';

interface Props {
  initial: ReportRow[];
}

export default function RecentReportsLive({ initial }: Props) {
  const [reports, setReports] = useState<ReportRow[]>(initial);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel('reports-realtime-dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          const r = payload.new as ReportRow;
          setReports((prev) => {
            if (prev.some((p) => p.id === r.id)) return prev;
            return [r, ...prev].slice(0, 10);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports' },
        (payload) => {
          const r = payload.new as ReportRow;
          setReports((prev) => prev.map((p) => (p.id === r.id ? r : p)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ul
      style={{
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {reports.slice(0, 10).map((r) => {
        const info = getCategoryInfo(r.category);
        return (
          <li key={r.id}>
            <Link
              href={`/report/${r.id}`}
              style={{
                color: 'var(--text)',
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              <strong>{info?.label ?? r.category}</strong>{' '}
              <span style={{ color: 'var(--text-muted)' }}>
                — {r.city ?? 'Unknown'} · {r.status}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
