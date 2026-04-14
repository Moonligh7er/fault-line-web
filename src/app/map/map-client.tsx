'use client';

import dynamic from 'next/dynamic';
import type { ReportRow } from '@/lib/types';

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

export default function MapClient({
  initialReports,
  initialCenter,
  initialRadiusKm,
}: Props) {
  return (
    <LeafletMap
      reports={initialReports}
      center={initialCenter}
      radiusKm={initialRadiusKm}
    />
  );
}
