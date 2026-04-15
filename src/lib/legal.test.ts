import { describe, it, expect } from 'vitest';
import { generateDemandLetter, getSupportedStates } from './legal';
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
    media: [],
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
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    resolved_at: null,
    ...overrides,
  };
}

describe('generateDemandLetter', () => {
  it('generates a letter with MA statute by default', () => {
    const result = generateDemandLetter({
      report: makeReport(),
      authorityName: 'City of Boston DPW',
    });
    expect(result.statute).toContain('M.G.L. c. 84');
    expect(result.letterText).toContain('City of Boston DPW');
    expect(result.letterText).toContain('Pothole');
  });

  it('marks as overdue when past notice period', () => {
    // MA notice period is 30 days; 60 days old = overdue
    const result = generateDemandLetter({
      report: makeReport(),
      authorityName: 'Boston',
    });
    expect(result.isOverdue).toBe(true);
    expect(result.letterText).toContain('EXPIRED');
  });

  it('not overdue when within notice period', () => {
    const fresh = makeReport({
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const result = generateDemandLetter({ report: fresh, authorityName: 'Boston' });
    expect(result.isOverdue).toBe(false);
  });

  it('uses RI statute for RI reports', () => {
    const result = generateDemandLetter({
      report: makeReport({ state: 'RI' }),
      authorityName: 'Providence',
    });
    expect(result.statute).toContain('R.I. Gen. Laws');
    expect(result.noticePeriodDays).toBe(60);
  });

  it('uses NH statute for NH reports', () => {
    const result = generateDemandLetter({
      report: makeReport({ state: 'NH' }),
      authorityName: 'Concord',
    });
    expect(result.statute).toContain('RSA 231');
  });

  it('falls back to MA for unknown state', () => {
    const result = generateDemandLetter({
      report: makeReport({ state: 'XX' }),
      authorityName: 'Unknown',
    });
    expect(result.statute).toContain('M.G.L.');
  });

  it('includes claimant name when provided', () => {
    const result = generateDemandLetter({
      report: makeReport(),
      authorityName: 'Boston',
      claimantName: 'Jane Doe',
    });
    expect(result.letterText).toContain('Jane Doe');
  });

  it('includes damages section when provided', () => {
    const result = generateDemandLetter({
      report: makeReport(),
      authorityName: 'Boston',
      damageDescription: 'Blew out front tire, $450 repair',
    });
    expect(result.letterText).toContain('DAMAGES CLAIMED');
    expect(result.letterText).toContain('Blew out front tire');
  });
});

describe('getSupportedStates', () => {
  it('returns all three states', () => {
    const states = getSupportedStates();
    expect(states).toContain('MA');
    expect(states).toContain('RI');
    expect(states).toContain('NH');
    expect(states).toHaveLength(3);
  });
});
