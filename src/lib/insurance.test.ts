import { describe, it, expect } from 'vitest';
import { generateClaimEvidence } from './insurance';
import type { ReportRow } from './types';

function makeReport(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: null,
    category: 'pothole',
    latitude: 42.3601,
    longitude: -71.0589,
    address: '123 Main St',
    city: 'Boston',
    state: 'MA',
    zip: '02139',
    description: 'Deep pothole',
    size_rating: 'large',
    hazard_level: 'dangerous',
    media: [{ url: 'https://example.com/a.jpg', type: 'photo' }],
    vehicle_damage: null,
    status: 'submitted',
    authority_id: null,
    submission_method: null,
    submission_reference: null,
    upvote_count: 5,
    confirm_count: 3,
    is_anonymous: false,
    sensor_detected: false,
    offline_queued: false,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
    resolved_at: null,
    ...overrides,
  };
}

describe('generateClaimEvidence', () => {
  it('produces a claim with GPS and mapsUrl', () => {
    const result = generateClaimEvidence({ report: makeReport() });
    expect(result.gps).toBe('42.360100, -71.058900');
    expect(result.mapsUrl).toContain('maps.google.com');
  });

  it('includes authority name when provided', () => {
    const result = generateClaimEvidence({
      report: makeReport(),
      authorityName: 'Boston DPW',
    });
    expect(result.fullText).toContain('Boston DPW');
  });

  it('includes vehicle damage section when provided', () => {
    const result = generateClaimEvidence({
      report: makeReport(),
      vehicleDamageDescription: 'Tire blown',
      estimatedCost: 450,
    });
    expect(result.fullText).toContain('VEHICLE DAMAGE');
    expect(result.fullText).toContain('Tire blown');
    expect(result.fullText).toContain('$450.00');
  });

  it('reports correct media count', () => {
    const result = generateClaimEvidence({ report: makeReport() });
    expect(result.mediaCount).toBe(1);
  });

  it('handles reports with no media', () => {
    const result = generateClaimEvidence({ report: makeReport({ media: [] }) });
    expect(result.mediaCount).toBe(0);
  });
});
