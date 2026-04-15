'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Icon } from 'leaflet';
import Link from 'next/link';
import { getCategoryInfo } from '@/lib/categories';
import type { ReportRow } from '@/lib/types';

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Props {
  reports: ReportRow[];
  center: [number, number];
  radiusKm: number;
}

export default function LeafletMap({ reports, center, radiusKm }: Props) {
  return (
    <div
      style={{
        height: 560,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}
    >
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={center}
          radius={radiusKm * 1000}
          pathOptions={{ color: '#1e88e5', fillOpacity: 0.05 }}
        />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
        >
          {reports.map((r) => {
            const info = getCategoryInfo(r.category);
            return (
              <Marker key={r.id} position={[r.latitude, r.longitude]} icon={defaultIcon}>
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <strong>{info?.label ?? r.category}</strong>
                    <br />
                    <small>
                      {r.address ?? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`}
                    </small>
                    <br />
                    <small>Hazard: {r.hazard_level.replace('_', ' ')}</small>
                    <br />
                    <Link href={`/report/${r.id}`}>View report →</Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
