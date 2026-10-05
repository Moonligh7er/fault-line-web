import { describe, it, expect } from 'vitest';
import { services, toServiceRequest, isUuid, type PublicReport } from './open311';

function row(overrides: Partial<PublicReport> = {}): PublicReport {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    category: 'pothole',
    latitude: 42.36,
    longitude: -71.06,
    address: '1 Cornhill',
    zip: '02201',
    description: 'Deep pothole',
    hazard_level: 'dangerous',
    media: [],
    status: 'submitted',
    authority_id: null,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-02T00:00:00Z',
    resolved_at: null,
    ...overrides,
  };
}

describe('toServiceRequest', () => {
  it('maps open and closed statuses to Open311 values', () => {
    expect(toServiceRequest(row({ status: 'in_progress' }), null).status).toBe('open');
    expect(toServiceRequest(row({ status: 'resolved' }), null).status).toBe('closed');
    expect(toServiceRequest(row({ status: 'rejected' }), null).status).toBe('closed');
  });

  it('uses hosted photo URLs from web or mobile rows, never device paths', () => {
    const web = row({ media: [{ url: 'https://x.supabase.co/a.jpg', type: 'photo' }] });
    expect(toServiceRequest(web, null).media_url).toBe('https://x.supabase.co/a.jpg');
    const mobile = row({
      media: [{ uri: 'file:///data/user/0/photo.jpg', uploadedUrl: 'https://x.supabase.co/b.jpg' } as never],
    });
    expect(toServiceRequest(mobile, null).media_url).toBe('https://x.supabase.co/b.jpg');
    const localOnly = row({ media: [{ uri: 'file:///data/photo.jpg' } as never] });
    expect(toServiceRequest(localOnly, null).media_url).toBeNull();
  });

  it('carries the agency name and Open311 field names', () => {
    const sr = toServiceRequest(row(), 'Boston 311');
    expect(sr.agency_responsible).toBe('Boston 311');
    expect(sr.service_code).toBe('pothole');
    expect(sr.lat).toBe(42.36);
    expect(sr.long).toBe(-71.06);
  });
});

describe('services / isUuid', () => {
  it('lists every category as a service', () => {
    expect(services().find((s) => s.service_code === 'pothole')?.service_name).toBe('Pothole');
  });
  it('validates UUIDs', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isUuid('nope')).toBe(false);
  });
});
