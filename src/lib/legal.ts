// ============================================================
// Legal Demand Letter Generator (web)
//
// Mirrors the mobile generator, Fault-Line/src/services/legalGenerator.ts:
//   - the report category picks a legal framing (./legal/templates.ts);
//   - 'defective-highway' cites the state statute record (./legal/statutes.ts);
//     every other framing cites its template's statute, notice period and
//     legal basis, and adds a FEDERAL COMPLAINT PATHWAY section;
//   - routing (./legal/routing.ts) names the addressee. A federal-fallback
//     record names the federal complaint agency, NOT the addressee: the
//     letter stays addressed to the local authority.
// Letters exist only for states with a non-draft statute record (MA/RI/NH);
// another state's law is never borrowed, and draft records (FL) never reach
// a letter.
//
// Web difference kept on purpose: defective-highway letters are addressed to
// the caller's authority (resolved from the authorities table) and their text
// is unchanged from the pre-framing web generator.
//
// The letter is generated FOR THE USER TO SEND — Fault Line does not
// transmit letters on behalf of users.
// ============================================================

import { getCategoryInfo, HAZARD_LEVELS } from './categories';
import type { ReportRow } from './types';
import {
  getStatuteRecord,
  getSupportedStatuteStates,
  statuteDisclaimer,
  type StateStatuteRecord,
  type VerificationStatus,
} from './legal/statutes';
import {
  FEDERAL_FALLBACK_SCOPE,
  getRouting,
  routingDisclaimer,
  type CategoryRouting,
  type RoutingVerificationStatus,
} from './legal/routing';
import {
  getFraming,
  getTemplate,
  MOBILE_CATEGORY_LABELS,
  templateDisclaimer,
  type LegalFraming,
  type LegalTemplate,
} from './legal/templates';

export { getFraming, getTemplate, CATEGORY_FRAMING } from './legal/templates';
export type { LegalFraming, LegalTemplate } from './legal/templates';
export { getRouting } from './legal/routing';
export type { CategoryRouting } from './legal/routing';
export { getStatuteRecord } from './legal/statutes';
export type { StateStatuteRecord, VerificationStatus } from './legal/statutes';

export interface StateStatute {
  statute: string;
  title: string;
  noticePeriodDays: number;
  description: string;
  filingRequirements: string;
}

/** Citation strings for every letter-supported state, derived from the
 *  statute dataset with drafts excluded. */
export const STATE_STATUTES: Record<string, StateStatute> = Object.fromEntries(
  getSupportedStatuteStates().flatMap((code) => {
    const r = getStatuteRecord(code);
    return r
      ? [
          [
            code,
            {
              statute: r.statute,
              title: r.title,
              noticePeriodDays: r.noticePeriodDays,
              description: r.description,
              filingRequirements: r.filingRequirements,
            },
          ],
        ]
      : [];
  })
);

export interface DemandLetterInput {
  report: ReportRow;
  authorityName: string;
  claimantName?: string;
  damageDescription?: string;
  clusterReportCount?: number;
}

export interface DemandLetterResult {
  letterText: string;
  statute: string;
  statuteTitle: string;
  noticePeriodDays: number;
  daysSinceReport: number;
  isOverdue: boolean;
  // Which legal framework the letter is anchored in.
  framing: LegalFraming;
  recipientAuthority: string;
  /** Agency (and web form) named in the FEDERAL COMPLAINT PATHWAY section;
   *  null for defective-highway letters, which are state-law only. */
  federalComplaintPathway: string | null;
  // Verification chain of custody — same fields as mobile DemandLetterData.
  verificationStatus: VerificationStatus;
  statuteVersion: string;
  /** The ⚠ UNREVIEWED block at the top of letterText ('' once reviewed). */
  banner: string;
  disclaimer: string;
  routingVersion?: string;
  routingVerificationStatus?: RoutingVerificationStatus;
  routingDisclaimer?: string;
  templateVersion: string;
  templateDisclaimer: string;
}

const HR = '━'.repeat(50);
const BANNER_RULE = '━'.repeat(60);
const BANNER_CLOSING =
  "Before you send this letter for a live claim, verify the statute text, deadline, and recipient against your state's current law, or consult an attorney admitted in your state. Fault Line is a documentation aid, not a law firm.";

// Banner for defective-highway letters while the state statute record is
// unreviewed (all of MA/RI/NH today: mobile 'pending-review', DEFERRED #22).
export const UNREVIEWED_BANNER = [
  BANNER_RULE,
  '⚠ UNREVIEWED LEGAL CONTENT',
  BANNER_RULE,
  '• The statutory citation and notice period in this letter have NOT yet been reviewed by a licensed attorney.',
  '',
  BANNER_CLOSING,
  BANNER_RULE,
].join('\n');

/** Banner for non-highway framings: one bullet per unreviewed source the
 *  letter relies on (template, routing), worded as in the mobile generator. */
function frameworkBanner(template: LegalTemplate, routing: CategoryRouting | null): string {
  const concerns: string[] = [];
  if (template.verificationStatus !== 'verified') {
    concerns.push(
      `The statutory citation and notice period (${template.statuteCitation}, ${template.noticePeriodDays}-day notice) come from a legal-framing template that has NOT yet been reviewed by a licensed attorney.`
    );
  }
  if (routing && routing.verificationStatus !== 'verified') {
    concerns.push(
      routing.jurisdictionScope === FEDERAL_FALLBACK_SCOPE
        ? `No state-specific routing is on file; the federal complaint pathway (${routing.primaryAuthority.name}) has NOT yet been legally reviewed — verify before relying on it.`
        : `The addressee routing (${routing.primaryAuthority.name}) has NOT yet been reviewed against current municipal contact information — verify the recipient office and mailing address before sending.`
    );
  }
  if (concerns.length === 0) return '';
  return [
    BANNER_RULE,
    '⚠ UNREVIEWED LEGAL CONTENT',
    BANNER_RULE,
    ...concerns.map((c) => `• ${c}`),
    '',
    BANNER_CLOSING,
    BANNER_RULE,
  ].join('\n');
}

export function isLetterSupported(state: string | null | undefined): boolean {
  return getStatuteRecord(state) !== null;
}

function categoryLabel(category: string): string {
  return (
    getCategoryInfo(category as ReportRow['category'])?.label ??
    MOBILE_CATEGORY_LABELS[category] ??
    category
  );
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

/** Returns null when the report's state has no (non-draft) statute record —
 *  never falls back to another state's law. */
export function generateDemandLetter(input: DemandLetterInput): DemandLetterResult | null {
  const { report, authorityName, claimantName, damageDescription } = input;
  const clusterReportCount = input.clusterReportCount ?? 1;

  const state = report.state;
  const record = getStatuteRecord(state);
  if (!state || !record) return null;

  const framing = getFraming(report.category);
  const template = getTemplate(framing);
  const routing = getRouting(report.category, state, framing);
  const highway = framing === 'defective-highway';

  const noticePeriodDays = highway ? record.noticePeriodDays : template.noticePeriodDays;
  const reportDate = new Date(report.created_at);
  const now = new Date();
  const daysSinceReport = Math.floor((now.getTime() - reportDate.getTime()) / 86_400_000);
  const isOverdue = daysSinceReport > noticePeriodDays;

  const ctx: LetterContext = {
    report,
    authorityName,
    claimantName,
    damageDescription,
    clusterReportCount,
    daysSinceReport,
    isOverdue,
    locationStr: [report.address, report.city, report.state].filter(Boolean).join(', '),
    dateStr: reportDate.toLocaleDateString('en-US', DATE_FORMAT),
    todayStr: now.toLocaleDateString('en-US', DATE_FORMAT),
    label: categoryLabel(report.category),
    hazardLabel: HAZARD_LEVELS.find((h) => h.key === report.hazard_level)?.label ?? report.hazard_level,
  };

  const routingFooter = routing ? routingDisclaimer(routing) : undefined;
  const templateFooter = templateDisclaimer(template);
  const common = {
    daysSinceReport,
    isOverdue,
    framing,
    verificationStatus: record.verificationStatus,
    statuteVersion: record.version,
    disclaimer: statuteDisclaimer(record),
    routingVersion: routing?.version,
    routingVerificationStatus: routing?.verificationStatus,
    routingDisclaimer: routingFooter,
    templateVersion: template.version,
    templateDisclaimer: templateFooter,
  };

  if (highway) {
    const banner = record.verificationStatus !== 'verified' ? UNREVIEWED_BANNER : '';
    return {
      ...common,
      letterText: highwayLetter(ctx, record, banner),
      statute: record.statute,
      statuteTitle: record.title,
      noticePeriodDays,
      recipientAuthority: authorityName,
      federalComplaintPathway: null,
      banner,
    };
  }

  // Federal-fallback routing names the federal complaint agency, not the
  // addressee: the demand letter still goes to the responsible local entity.
  const federalOnly = routing?.jurisdictionScope === FEDERAL_FALLBACK_SCOPE;
  const recipient = (!federalOnly && routing?.primaryAuthority.name) || authorityName;
  const recipientAddress = !federalOnly ? routing?.primaryAuthority.address : undefined;
  const federalComplaintPathway =
    federalOnly && routing
      ? `${routing.primaryAuthority.name}${routing.primaryAuthority.webForm ? ` — ${routing.primaryAuthority.webForm}` : ''}`
      : template.federalComplaintPathway;
  const banner = frameworkBanner(template, routing);
  const footer = [routingFooter, templateFooter].filter(Boolean).join('\n');

  return {
    ...common,
    letterText: frameworkLetter(ctx, {
      template,
      recipient,
      recipientAddress,
      federalComplaintPathway,
      banner,
      footer,
    }),
    statute: template.statuteCitation,
    statuteTitle: template.statuteTitle,
    noticePeriodDays,
    recipientAuthority: recipient,
    federalComplaintPathway,
    banner,
  };
}

interface LetterContext {
  report: ReportRow;
  authorityName: string;
  claimantName?: string;
  damageDescription?: string;
  clusterReportCount: number;
  daysSinceReport: number;
  isOverdue: boolean;
  locationStr: string;
  dateStr: string;
  todayStr: string;
  label: string;
  hazardLabel: string;
}

// Text unchanged from the pre-framing web generator.
function highwayLetter(ctx: LetterContext, stateLaw: StateStatuteRecord, banner: string): string {
  const { report, authorityName, claimantName, damageDescription, clusterReportCount } = ctx;
  const { daysSinceReport, isOverdue, locationStr, dateStr, todayStr, label, hazardLabel } = ctx;
  return `
${banner}

${todayStr}

${authorityName}
${report.city ?? ''}${report.state ? `, ${report.state}` : ''}

RE: FORMAL NOTICE OF DEFECTIVE CONDITION — ${label.toUpperCase()}
Location: ${locationStr}
GPS: ${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}
Original Report Date: ${dateStr}
Days Since Notice: ${daysSinceReport}

Dear ${authorityName},

${claimantName ? `I, ${claimantName}, hereby give` : 'This letter serves as'} formal notice pursuant to ${stateLaw.statute} ("${stateLaw.title}") regarding a hazardous condition on a public way within your jurisdiction.

NATURE OF DEFECT
${HR}
Type: ${label}
Location: ${locationStr}
Hazard Level: ${hazardLabel} (as assessed by ${clusterReportCount} independent community reporter${clusterReportCount === 1 ? '' : 's'})
${report.description ? `Description: ${report.description}` : ''}

NOTICE HISTORY
${HR}
This condition was first reported to your office on ${dateStr} — ${daysSinceReport} days ago.

${
  isOverdue
    ? `NOTICE: The statutory response period of ${stateLaw.noticePeriodDays} days under ${stateLaw.statute} has EXPIRED. Your office has had ${daysSinceReport} days of notice — ${daysSinceReport - stateLaw.noticePeriodDays} days beyond the statutory period.`
    : `Under ${stateLaw.statute}, your office has ${stateLaw.noticePeriodDays} days from the date of notice to remedy the condition. ${stateLaw.noticePeriodDays - daysSinceReport} days remain.`
}

LEGAL BASIS
${HR}
${stateLaw.description}

Filing requirements: ${stateLaw.filingRequirements}

${
  damageDescription
    ? `DAMAGES CLAIMED
${HR}
${damageDescription}

`
    : ''
}DEMAND
${HR}
${claimantName ? 'I hereby demand' : 'The community hereby demands'} that your office:

1. Immediately inspect the reported location;
2. Remedy the hazardous condition within the statutory timeframe;
3. ${damageDescription ? 'Compensate for damages incurred as a result of the defect; and' : 'Prevent further hazard to the public; and'}
4. Provide written confirmation of remedial action taken.

Failure to address this condition may result in ${claimantName ? 'a formal claim for damages' : 'individual damage claims from affected community members'} and public disclosure of the ${daysSinceReport}-day response record.

EVIDENCE
${HR}
- ${clusterReportCount} independent community report${clusterReportCount === 1 ? '' : 's'} with timestamps
- GPS-verified location data (${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)})
- ${report.media.length > 0 ? `${report.media.length} photographic file(s)` : 'Community severity assessments'}
- Google Maps: https://maps.google.com/?q=${report.latitude},${report.longitude}

This notice is sent in good faith to ensure public safety and proper maintenance of public ways.

${claimantName ? `Sincerely,\n${claimantName}` : 'Sincerely,\nFault Line Community Platform'}

---
Report ID: ${report.id}
Generated by Fault Line — Community Infrastructure Accountability Platform
`.trim();
}

interface FrameworkParts {
  template: LegalTemplate;
  recipient: string;
  recipientAddress?: string;
  federalComplaintPathway: string;
  banner: string;
  footer: string;
}

// ADA Title II / Fair Housing + 504 / Title VI / transit ADA letters. Section
// order and wording follow the mobile generator; layout follows the web letter.
function frameworkLetter(ctx: LetterContext, parts: FrameworkParts): string {
  const { report, claimantName, damageDescription, clusterReportCount } = ctx;
  const { daysSinceReport, isOverdue, locationStr, dateStr, todayStr, label, hazardLabel } = ctx;
  const { template, recipient, recipientAddress, federalComplaintPathway, banner, footer } = parts;
  const statute = template.statuteCitation;
  const days = template.noticePeriodDays;
  return `
${banner}

${todayStr}

${recipient}${recipientAddress ? `\n${recipientAddress}` : ''}
${report.city ?? ''}${report.state ? `, ${report.state}` : ''}

RE: ${template.headline} — ${label.toUpperCase()}
Location: ${locationStr}
GPS: ${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}
Original Report Date: ${dateStr}
Days Since Notice: ${daysSinceReport}

Dear ${recipient},

${claimantName ? `I, ${claimantName}, hereby give` : 'This letter serves as'} formal notice pursuant to ${statute} ("${template.statuteTitle}") regarding the condition described below within your jurisdiction.

NATURE OF THE CONDITION
${HR}
Type: ${label}
Location: ${locationStr}
Hazard Level: ${hazardLabel} (as assessed by ${clusterReportCount} independent community reporter${clusterReportCount === 1 ? '' : 's'})
${report.description ? `Description: ${report.description}` : ''}

NOTICE HISTORY
${HR}
This condition was first reported to your office on ${dateStr} — ${daysSinceReport} days ago.

${
  isOverdue
    ? `NOTICE: The response period of ${days} days under ${statute} has EXPIRED. Your office has had ${daysSinceReport} days of notice — ${daysSinceReport - days} days beyond the applicable period.`
    : `Under ${statute}, your office has ${days} days from the date of notice to remedy the condition. ${days - daysSinceReport} days remain.`
}

LEGAL BASIS
${HR}
${template.legalBasisText}

Filing requirements: ${template.filingRequirements}

FEDERAL COMPLAINT PATHWAY
${HR}
If this notice does not receive an adequate response, a federal complaint may be filed with: ${federalComplaintPathway}

${
  damageDescription
    ? `DAMAGES CLAIMED
${HR}
${damageDescription}

`
    : ''
}DEMAND
${HR}
${claimantName ? 'I hereby demand' : 'The community hereby demands'} that your office:

1. Immediately ${template.demandLanguage.inspectVerb};
2. ${template.demandLanguage.remedyClause} within the applicable timeframe;
3. ${damageDescription ? 'Compensate for damages incurred as a result of the condition; and' : 'Prevent further harm to the public; and'}
4. Provide written confirmation of remedial action taken.

Failure to address this condition may result in ${claimantName ? 'a formal claim for damages' : 'individual claims from affected community members'} and public disclosure of the ${daysSinceReport}-day response record.

EVIDENCE
${HR}
- ${clusterReportCount} independent community report${clusterReportCount === 1 ? '' : 's'} with timestamps
- GPS-verified location data (${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)})
- ${report.media.length > 0 ? `${report.media.length} photographic file(s)` : 'Community severity assessments'}
- Google Maps: https://maps.google.com/?q=${report.latitude},${report.longitude}

This notice is sent in good faith to ensure public safety and equal access to public services.

${claimantName ? `Sincerely,\n${claimantName}` : 'Sincerely,\nFault Line Community Platform'}

---
Report ID: ${report.id}
${footer}
Generated by Fault Line — Community Infrastructure Accountability Platform
`.trim();
}

export function getSupportedStates(): string[] {
  return getSupportedStatuteStates();
}
