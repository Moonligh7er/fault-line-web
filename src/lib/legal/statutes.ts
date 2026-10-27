// ═══════════════════════════════════════════════════════════════════════════
//  DEFECTIVE-HIGHWAY / MUNICIPAL-LIABILITY STATUTE DATASET — web mirror
//
//  MIRRORS (keep in sync by hand; no cross-repo imports):
//    Fault-Line/src/services/statutes/types.ts    → StateStatuteRecord & friends
//    Fault-Line/src/services/statutes/dataset.ts  → RECORDS, getStatuteRecord,
//                                                   getSupportedStates, statuteDisclaimer
//  Mirrored from mobile dataset v0.1.0 (lastUpdatedAt 2026-08-29, FL draft
//  added 2026-10-19) on 2026-10-27.
//
//  A wrong noticePeriodDays or mis-cited section can cost a user their claim.
//  Edit the mobile dataset first (review protocol in its README), then copy.
//
//  Draft records (FL) are kept here so the two files diff cleanly, but every
//  accessor filters them out: a draft never reaches a letter.
// ═══════════════════════════════════════════════════════════════════════════

export type VerificationStatus = 'verified' | 'pending-review' | 'stale' | 'draft';

export interface SourceCitation {
  label: string;
  url: string;
  accessedAt: string;
}

export interface KnownAmbiguity {
  concern: string;
  detail: string;
}

export interface StateStatuteRecord {
  stateCode: string;
  version: string;
  statute: string;
  title: string;
  noticePeriodDays: number;
  description: string;
  filingRequirements: string;
  knownAmbiguities: KnownAmbiguity[];
  verificationStatus: VerificationStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  nextReviewAt: string | null;
  sources: SourceCitation[];
}

const RECORDS: readonly StateStatuteRecord[] = [
  {
    // DRAFT — never shown to users. Florida has no "notice of defect, then
    // N days to repair" rule; noticePeriodDays is the claim-presentment
    // window, which the letter's "days to remedy" framing does NOT fit.
    stateCode: 'FL',
    version: '0.0.1',
    statute: 'Fla. Stat. § 768.28',
    title: 'Florida Waiver of Sovereign Immunity in Tort Actions',
    noticePeriodDays: 1095,
    description:
      'The state, counties and municipalities are liable in tort (including for negligent road maintenance) to the extent of the statutory waiver, subject to per-person and per-occurrence damages caps.',
    filingRequirements:
      'Present the claim in writing to the responsible agency within 3 years of accrual (§ 768.28(6)(a)); claims against state agencies must also be presented to the Department of Financial Services (not required for counties/municipalities). Suit may follow written denial or 6 months without final disposition (§ 768.28(6)(d)). Caps per § 768.28(5)(a): $200,000 per person / $300,000 per occurrence as read on 2026-10-19.',
    knownAmbiguities: [
      {
        concern: 'No repair-deadline rule',
        detail:
          'Unlike MA/RI/NH, Florida sets no statutory days-to-repair after notice. The current letter template sentence "your office has N days to remedy" would be wrong for Florida.',
      },
      {
        concern: 'Recent amendments',
        detail:
          'The Legislature has repeatedly considered raising the caps and shortening the presentment period. Confirm the in-force text and effective dates before relying on any number here.',
      },
      {
        concern: 'Who owns the road',
        detail:
          'State Highway System roads are FDOT (state agency, so DFS presentment is required); county roads are the county; city streets are the city. Routing uses the FDOT State Highway System layer plus city/county boundaries (supabase migration 030).',
      },
    ],
    verificationStatus: 'draft',
    verifiedBy: null,
    verifiedAt: null,
    nextReviewAt: null,
    sources: [
      {
        label: 'Fla. Stat. § 768.28 (Florida Senate)',
        url: 'https://www.flsenate.gov/Laws/Statutes/2025/768.28',
        accessedAt: '2026-10-19',
      },
    ],
  },
  {
    stateCode: 'MA',
    version: '0.1.0',
    statute: 'M.G.L. c. 84, § 15',
    title: 'Massachusetts Defective Highway Statute',
    noticePeriodDays: 30,
    description:
      'Municipalities are liable for damages caused by defects in public ways if they had actual or constructive notice of the defect and failed to remedy it within a reasonable time.',
    filingRequirements:
      'Written notice must be provided to the municipality within 30 days of the injury/damage. Claims must be filed within 3 years.',
    knownAmbiguities: [
      {
        concern: 'State highways vs. municipal ways',
        detail:
          'Defects on state-numbered routes may be MassDOT responsibility rather than the municipality, changing both the recipient and the applicable statute (M.G.L. c. 81, § 18). The letter generator should route by road ownership, not just GPS-in-city.',
      },
      {
        concern: 'Personal injury vs. property damage',
        detail:
          'The 30-day notice rule is well-settled for personal injury; property-damage-only claims (e.g., tire damage) have been treated differently in some appellate decisions. Users pursuing property-only damages should consult counsel.',
      },
      {
        concern: 'Notice content requirements',
        detail:
          'Notice must state the time, place, and cause. Vague notice has been held insufficient. Fault Line letters include GPS + date + hazard type to satisfy this, but a reviewer should confirm the specific wording still passes.',
      },
    ],
    verificationStatus: 'pending-review',
    verifiedBy: null,
    verifiedAt: null,
    nextReviewAt: null,
    sources: [
      {
        label: 'M.G.L. c. 84, § 15 — Notice of injury on defective way',
        url: 'https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXIV/Chapter84/Section15',
        accessedAt: '2026-08-29',
      },
    ],
  },
  {
    stateCode: 'RI',
    version: '0.1.0',
    statute: 'R.I. Gen. Laws § 24-5-14',
    title: 'Rhode Island Highway Defect Liability',
    noticePeriodDays: 60,
    description:
      'Towns and cities are liable for damages from defective highways, bridges, and sidewalks when they had notice of the condition.',
    filingRequirements: 'Written notice to the town/city clerk within 60 days of the incident.',
    knownAmbiguities: [
      {
        concern: 'Clerk-of-record delivery',
        detail:
          'Rhode Island courts have been strict about notice being delivered to the correct town/city clerk, not to public works. Fault Line letters should default to the clerk, with a fallback to the escalation recipient.',
      },
      {
        concern: 'State-maintained roads (RIDOT)',
        detail:
          'RIDOT liability for state highways follows a different framework and different notice rules. Route by road ownership.',
      },
    ],
    verificationStatus: 'pending-review',
    verifiedBy: null,
    verifiedAt: null,
    nextReviewAt: null,
    sources: [
      {
        label: 'R.I. Gen. Laws § 24-5-14',
        url: 'http://webserver.rilin.state.ri.us/Statutes/TITLE24/24-5/24-5-14.HTM',
        accessedAt: '2026-08-29',
      },
    ],
  },
  {
    stateCode: 'NH',
    version: '0.1.0',
    statute: 'RSA 231:90-92',
    title: 'New Hampshire Highway Liability',
    noticePeriodDays: 60,
    description:
      'Municipalities may be liable for damages caused by insufficiency of a highway or bridge if they had actual notice or the defect was so obvious it constituted constructive notice.',
    filingRequirements: 'Written notice within 60 days. Claim limit of $50,000 per occurrence.',
    knownAmbiguities: [
      {
        concern: 'Statutory cap',
        detail:
          'The $50,000 per-occurrence cap is a hard limit and should be surfaced to users before they invest effort in a claim. Confirm current cap against RSA at each review — legislative amendments have adjusted municipal-liability caps in other states in recent years.',
      },
      {
        concern: '"Insufficiency" threshold',
        detail:
          'Not every defect is an "insufficiency" under NH case law. Cosmetic or minor issues typically do not qualify. The letter should describe the hazard in terms that meet the insufficiency standard.',
      },
    ],
    verificationStatus: 'pending-review',
    verifiedBy: null,
    verifiedAt: null,
    nextReviewAt: null,
    sources: [
      {
        label: 'RSA 231:90 — Liability of municipalities',
        url: 'https://www.gencourt.state.nh.us/rsa/html/xx/231/231-90.htm',
        accessedAt: '2026-08-29',
      },
      {
        label: 'RSA 231:91 — Notice requirements',
        url: 'https://www.gencourt.state.nh.us/rsa/html/xx/231/231-91.htm',
        accessedAt: '2026-08-29',
      },
      {
        label: 'RSA 231:92 — Limitations on recovery',
        url: 'https://www.gencourt.state.nh.us/rsa/html/xx/231/231-92.htm',
        accessedAt: '2026-08-29',
      },
    ],
  },
];

// ── Public accessors ───────────────────────────────────────────────────────

/** Non-draft record for a state, with 'verified' downgraded to 'stale' once
 *  its review window lapses. Draft records return null. */
export function getStatuteRecord(stateCode: string | null | undefined): StateStatuteRecord | null {
  if (!stateCode) return null;
  const normalized = stateCode.toUpperCase();
  const record = RECORDS.find((r) => r.stateCode === normalized);
  if (!record || record.verificationStatus === 'draft') return null;
  return effectiveRecord(record);
}

/** States usable by the letter generator (pending-review included; drafts excluded),
 *  in the mobile dataset's order minus drafts. */
export function getSupportedStatuteStates(): string[] {
  return RECORDS.filter((r) => r.verificationStatus !== 'draft').map((r) => r.stateCode);
}

function effectiveRecord(record: StateStatuteRecord): StateStatuteRecord {
  const status = effectiveVerificationStatus(record);
  if (status === record.verificationStatus) return record;
  return { ...record, verificationStatus: status };
}

function effectiveVerificationStatus(record: StateStatuteRecord): VerificationStatus {
  if (record.verificationStatus !== 'verified') return record.verificationStatus;
  if (!record.nextReviewAt) return 'stale';
  const dueDate = Date.parse(record.nextReviewAt);
  if (Number.isNaN(dueDate)) return 'stale';
  return Date.now() > dueDate ? 'stale' : 'verified';
}

export function statuteDisclaimer(record: StateStatuteRecord): string {
  const status = effectiveVerificationStatus(record);
  const versionLine = `Statute reference: ${record.statute} · dataset ${record.stateCode} v${record.version}`;
  switch (status) {
    case 'verified':
      return `${versionLine} · legal review: ${record.verifiedBy || 'unnamed reviewer'}, ${record.verifiedAt || 'date unknown'}. Not legal advice.`;
    case 'stale':
      return `${versionLine} · legal review OVERDUE (last reviewed ${record.verifiedAt || 'never'}). Verify against current law before relying on this letter. Not legal advice.`;
    case 'pending-review':
      return `${versionLine} · NOT YET LEGALLY REVIEWED. This letter is a documentation aid, not verified legal notice. Consult a licensed attorney in ${record.stateCode} before relying on statutory deadlines. Not legal advice.`;
    case 'draft':
      return `${versionLine} · draft entry, not for user delivery.`;
  }
}
