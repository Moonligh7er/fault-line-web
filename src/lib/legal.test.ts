import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  generateDemandLetter,
  getSupportedStates,
  isLetterSupported,
  getFraming,
  STATE_STATUTES,
  UNREVIEWED_BANNER,
} from './legal';
import { getStatuteRecord } from './legal/statutes';
import { getRouting } from './legal/routing';
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
  it('generates a letter with the MA statute for MA reports', () => {
    const result = generateDemandLetter({
      report: makeReport(),
      authorityName: 'City of Boston DPW',
    })!;
    expect(result.statute).toContain('M.G.L. c. 84');
    expect(result.letterText).toContain('City of Boston DPW');
    expect(result.letterText).toContain('Pothole');
  });

  it('marks as overdue when past notice period', () => {
    // MA notice period is 30 days; 60 days old = overdue
    const result = generateDemandLetter({
      report: makeReport(),
      authorityName: 'Boston',
    })!;
    expect(result.isOverdue).toBe(true);
    expect(result.letterText).toContain('EXPIRED');
  });

  it('not overdue when within notice period', () => {
    const fresh = makeReport({
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const result = generateDemandLetter({ report: fresh, authorityName: 'Boston' })!;
    expect(result.isOverdue).toBe(false);
  });

  it('uses RI statute for RI reports', () => {
    const result = generateDemandLetter({
      report: makeReport({ state: 'RI' }),
      authorityName: 'Providence',
    })!;
    expect(result.statute).toContain('R.I. Gen. Laws');
    expect(result.noticePeriodDays).toBe(60);
  });

  it('uses NH statute for NH reports', () => {
    const result = generateDemandLetter({
      report: makeReport({ state: 'NH' }),
      authorityName: 'Concord',
    })!;
    expect(result.statute).toContain('RSA 231');
  });

  it('returns null for an unsupported state instead of borrowing MA law', () => {
    expect(generateDemandLetter({ report: makeReport({ state: 'NY' }), authorityName: 'NYC' })).toBeNull();
  });

  it('returns null when the report has no state', () => {
    expect(generateDemandLetter({ report: makeReport({ state: null }), authorityName: 'Unknown' })).toBeNull();
  });

  it('opens every letter with the unreviewed-legal-content warning', () => {
    const result = generateDemandLetter({ report: makeReport(), authorityName: 'Boston' })!;
    expect(result.letterText.startsWith('━')).toBe(true);
    expect(result.letterText).toContain('UNREVIEWED LEGAL CONTENT');
  });

  it('uses correct verb agreement in the demand line', () => {
    const community = generateDemandLetter({ report: makeReport(), authorityName: 'Boston' })!;
    expect(community.letterText).toContain('The community hereby demands that');
    const claimant = generateDemandLetter({
      report: makeReport(),
      authorityName: 'Boston',
      claimantName: 'Jane Doe',
    })!;
    expect(claimant.letterText).toContain('I hereby demand that');
  });

  it('includes claimant name when provided', () => {
    const result = generateDemandLetter({
      report: makeReport(),
      authorityName: 'Boston',
      claimantName: 'Jane Doe',
    })!;
    expect(result.letterText).toContain('Jane Doe');
  });

  it('includes damages section when provided', () => {
    const result = generateDemandLetter({
      report: makeReport(),
      authorityName: 'Boston',
      damageDescription: 'Blew out front tire, $450 repair',
    })!;
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

// Mobile-only categories live in the shared reports table but not in the
// web ReportCategory union.
const asCategory = (key: string) => key as ReportRow['category'];

// Pinned text of the defective-highway letter as produced before framings
// were added (MA pothole, 87 days old, no claimant). Must stay byte-identical.
const HIGHWAY_GOLDEN = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠ UNREVIEWED LEGAL CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• The statutory citation and notice period in this letter have NOT yet been reviewed by a licensed attorney.

Before you send this letter for a live claim, verify the statute text, deadline, and recipient against your state's current law, or consult an attorney admitted in your state. Fault Line is a documentation aid, not a law firm.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

October 27, 2026

City of Boston DPW
Boston, MA

RE: FORMAL NOTICE OF DEFECTIVE CONDITION — POTHOLE
Location: 123 Main St, Boston, MA
GPS: 42.360100, -71.058900
Original Report Date: August 1, 2026
Days Since Notice: 87

Dear City of Boston DPW,

This letter serves as formal notice pursuant to M.G.L. c. 84, § 15 ("Massachusetts Defective Highway Statute") regarding a hazardous condition on a public way within your jurisdiction.

NATURE OF DEFECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: Pothole
Location: 123 Main St, Boston, MA
Hazard Level: Dangerous (as assessed by 1 independent community reporter)
Description: Deep pothole

NOTICE HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This condition was first reported to your office on August 1, 2026 — 87 days ago.

NOTICE: The statutory response period of 30 days under M.G.L. c. 84, § 15 has EXPIRED. Your office has had 87 days of notice — 57 days beyond the statutory period.

LEGAL BASIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Municipalities are liable for damages caused by defects in public ways if they had actual or constructive notice of the defect and failed to remedy it within a reasonable time.

Filing requirements: Written notice must be provided to the municipality within 30 days of the injury/damage. Claims must be filed within 3 years.

DEMAND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The community hereby demands that your office:

1. Immediately inspect the reported location;
2. Remedy the hazardous condition within the statutory timeframe;
3. Prevent further hazard to the public; and
4. Provide written confirmation of remedial action taken.

Failure to address this condition may result in individual damage claims from affected community members and public disclosure of the 87-day response record.

EVIDENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 1 independent community report with timestamps
- GPS-verified location data (42.360100, -71.058900)
- Community severity assessments
- Google Maps: https://maps.google.com/?q=42.3601,-71.0589

This notice is sent in good faith to ensure public safety and proper maintenance of public ways.

Sincerely,
Fault Line Community Platform

---
Report ID: 550e8400-e29b-41d4-a716-446655440000
Generated by Fault Line — Community Infrastructure Accountability Platform`;

describe('framings (parity with mobile legalGenerator)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('leaves the defective-highway letter unchanged', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T15:00:00Z'));
    const result = generateDemandLetter({
      report: makeReport({ created_at: '2026-08-01T12:00:00Z' }),
      authorityName: 'City of Boston DPW',
    })!;
    expect(result.letterText).toBe(HIGHWAY_GOLDEN);
    expect(result.framing).toBe('defective-highway');
    expect(result.statute).toBe('M.G.L. c. 84, § 15');
    expect(result.noticePeriodDays).toBe(30);
    expect(result.recipientAuthority).toBe('City of Boston DPW');
    expect(result.federalComplaintPathway).toBeNull();
    expect(result.banner).toBe(UNREVIEWED_BANNER);
    expect(result.letterText).not.toContain('FEDERAL COMPLAINT PATHWAY');
  });

  it('ADA category in MA uses the ADA Title II framing and the MA routing record', () => {
    const report = makeReport({ category: asCategory('missing_curb_cut') });
    const result = generateDemandLetter({ report, authorityName: 'City of Boston DPW' })!;

    expect(result.framing).toBe('ada-title-ii');
    expect(result.statute).toBe('28 CFR Part 35 (ADA Title II)');
    expect(result.statuteTitle).toBe('Americans with Disabilities Act, Title II');
    expect(result.noticePeriodDays).toBe(30);
    expect(result.letterText).toContain(
      'FORMAL ADA TITLE II NOTICE OF PROGRAM-ACCESS BARRIER — MISSING CURB CUT'
    );
    expect(result.letterText).toContain('42 U.S.C. § 12132');
    expect(result.letterText).not.toContain('M.G.L. c. 84');

    // MA-specific routing: addressed to the MA record's authority.
    expect(result.recipientAuthority).toBe('Municipal ADA Coordinator');
    expect(result.letterText).toContain('Dear Municipal ADA Coordinator,');
    expect(result.routingVersion).toBe('0.1.0');
    expect(result.letterText).toContain('Routing reference: missing_curb_cut / MA');

    // Not federal-only, so the pathway is the template's federal agency.
    expect(result.letterText).toContain('FEDERAL COMPLAINT PATHWAY');
    expect(result.federalComplaintPathway).toContain(
      'U.S. Department of Justice, Civil Rights Division'
    );

    expect(result.letterText.startsWith('━')).toBe(true);
    expect(result.letterText).toContain('UNREVIEWED LEGAL CONTENT');
    expect(result.letterText).toContain(
      'The addressee routing (Municipal ADA Coordinator) has NOT yet been reviewed'
    );
    expect(result.letterText).toContain('Template: ada-title-ii v0.1.0 · NOT YET LEGALLY REVIEWED');
  });

  it("maps web's own accessibility category to ADA Title II", () => {
    expect(getFraming('accessibility')).toBe('ada-title-ii');
    expect(getFraming('pothole')).toBe('defective-highway');
  });

  it('addresses an MA transit letter locally and names the FTA as the federal pathway', () => {
    // No MA record for this category → federal-fallback routing.
    expect(getRouting('missing_bus_shelter', 'MA', 'transit-ada')?.jurisdictionScope).toBe(
      'federal-fallback'
    );

    const result = generateDemandLetter({
      report: makeReport({ category: asCategory('missing_bus_shelter') }),
      authorityName: 'City of Boston DPW',
    })!;

    expect(result.framing).toBe('transit-ada');
    expect(result.statute).toContain('49 CFR Part 37');
    // Federal fallback names the agency, not the addressee.
    expect(result.recipientAuthority).toBe('City of Boston DPW');
    expect(result.letterText).toContain('Dear City of Boston DPW,');
    expect(result.letterText).not.toContain('Dear Federal Transit Administration');
    expect(result.federalComplaintPathway).toBe(
      'Federal Transit Administration, Office of Civil Rights — https://www.transit.dot.gov/regulations-and-guidance/civil-rights-ada/file-complaint-fta'
    );
    expect(result.letterText).toContain(
      'a federal complaint may be filed with: Federal Transit Administration, Office of Civil Rights'
    );
    expect(result.letterText).toContain(
      'No state-specific routing is on file; the federal complaint pathway (Federal Transit Administration, Office of Civil Rights) has NOT yet been legally reviewed'
    );
  });

  it('uses the template notice period for non-highway framings', () => {
    // Title VI template: 60-day notice. 45 days old → not overdue (MA highway would be).
    const result = generateDemandLetter({
      report: makeReport({
        category: asCategory('english_only_signage'),
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      authorityName: 'Boston',
    })!;
    expect(result.framing).toBe('title-vi-language');
    expect(result.noticePeriodDays).toBe(60);
    expect(result.isOverdue).toBe(false);
  });

  it('still returns null for an unsupported state, whatever the framing', () => {
    for (const category of ['pothole', 'missing_curb_cut', 'missing_bus_shelter', 'mold_public_housing']) {
      expect(
        generateDemandLetter({
          report: makeReport({ state: 'NY', category: asCategory(category) }),
          authorityName: 'NYC',
        })
      ).toBeNull();
      expect(
        generateDemandLetter({
          report: makeReport({ state: null, category: asCategory(category) }),
          authorityName: 'Unknown',
        })
      ).toBeNull();
    }
    expect(isLetterSupported('NY')).toBe(false);
    expect(isLetterSupported(null)).toBe(false);
  });

  it('never lets the draft FL statute reach a letter', () => {
    expect(getStatuteRecord('FL')).toBeNull();
    expect(isLetterSupported('FL')).toBe(false);
    expect(STATE_STATUTES).not.toHaveProperty('FL');
    expect(getSupportedStates()).not.toContain('FL');
    for (const category of ['pothole', 'missing_curb_cut']) {
      expect(
        generateDemandLetter({
          report: makeReport({ state: 'FL', category: asCategory(category) }),
          authorityName: 'Inverness',
        })
      ).toBeNull();
    }
  });
});
