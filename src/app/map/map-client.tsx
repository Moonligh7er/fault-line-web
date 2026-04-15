'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ReportRow } from '@/lib/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 560,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      Loading map…
    </div>
  ),
});

interface Props {
  initialReports: ReportRow[];
  initialCenter: [number, number];
  initialRadiusKm: number;
}

function kmBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function MapClient({
  initialReports,
  initialCenter,
  initialRadiusKm,
}: Props) {
  const [reports, setReports] = useState<ReportRow[]>(initialReports);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel('reports-realtime-map')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          const r = payload.new as ReportRow;
          // Only show reports within the visible radius
          const dist = kmBetween(
            initialCenter[0],
            initialCenter[1],
            r.latitude,
            r.longitude
          );
          if (dist > initialRadiusKm) return;
          setReports((prev) => {
            if (prev.some((p) => p.id === r.id)) return prev;
            return [r, ...prev];
          });
          setLiveCount((c) => c + 1);
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
  }, [initialCenter, initialRadiusKm]);

  return (
    <>
      {liveCount > 0 && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: 'var(--success)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 12,
            display: 'inline-block',
          }}
        >
          ● Live · {liveCount} new report{liveCount === 1 ? '' : 's'}
        </div>
      )}
      <LeafletMap
        reports={reports}
        center={initialCenter}
        radiusKm={initialRadiusKm}
      />
    </>
  );
}
