import { getCategoryInfo, HAZARD_LEVELS } from './categories';
import type { ReportRow } from './types';

export interface StateStatute {
  statute: string;
  title: string;
  noticePeriodDays: number;
  description: string;
  filingRequirements: string;
}

export const STATE_STATUTES: Record<string, StateStatute> = {
  MA: {
    statute: 'M.G.L. c. 84, § 15',
    title: 'Massachusetts Defective Highway Statute',
    noticePeriodDays: 30,
    description:
      'Municipalities are liable for damages caused by defects in public ways if they had actual or constructive notice of the defect and failed to remedy it within a reasonable time.',
    filingRequirements:
      'Written notice must be provided to the municipality within 30 days of the injury/damage. Claims must be filed within 3 years.',
  },
  RI: {
    statute: 'R.I. Gen. Laws § 24-5-14',
    title: 'Rhode Island Highway Defect Liability',
    noticePeriodDays: 60,
    description:
      'Towns and cities are liable for damages from defective highways, bridges, and sidewalks when they had notice of the condition.',
    filingRequirements: 'Written notice to the town/city clerk within 60 days of the incident.',
  },
  NH: {
    statute: 'RSA 231:90-92',
    title: 'New Hampshire Highway Liability',
    noticePeriodDays: 60,
    description:
      'Municipalities may be liable for damages caused by insufficiency of a highway or bridge if they had actual notice or the defect was so obvious it constituted constructive notice.',
    filingRequirements: 'Written notice within 60 days. Claim limit of $50,000 per occurrence.',
  },
};

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
}

const HR = '━'.repeat(50);

export function generateDemandLetter(input: DemandLetterInput): DemandLetterResult {
  const { report, authorityName, claimantName, damageDescription } = input;
  const clusterReportCount = input.clusterReportCount ?? 1;

  const state = report.state ?? 'MA';
  const stateLaw = STATE_STATUTES[state] ?? STATE_STATUTES.MA!;
  const category = getCategoryInfo(report.category);
  const hazard = HAZARD_LEVELS.find((h) => h.key === report.hazard_level);

  const reportDate = new Date(report.created_at);
  const now = new Date();
  const daysSinceReport = Math.floor(
    (now.getTime() - reportDate.getTime()) / 86_400_000
  );
  const isOverdue = daysSinceReport > stateLaw.noticePeriodDays;

  const locationStr = [report.address, report.city, report.state]
    .filter(Boolean)
    .join(', ');
  const dateStr = reportDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const todayStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const letterText = `
${todayStr}

${authorityName}
${report.city ?? ''}${report.state ? `, ${report.state}` : ''}

RE: FORMAL NOTICE OF DEFECTIVE CONDITION — ${(category?.label ?? report.category).toUpperCase()}
Location: ${locationStr}
GPS: ${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}
Original Report Date: ${dateStr}
Days Since Notice: ${daysSinceReport}

Dear ${authorityName},

${claimantName ? `I, ${claimantName}, am` : 'This letter serves as'} formal notice pursuant to ${stateLaw.statute} ("${stateLaw.title}") regarding a hazardous condition on a public way within your jurisdiction.

NATURE OF DEFECT
${HR}
Type: ${category?.label ?? report.category}
Location: ${locationStr}
Hazard Level: ${hazard?.label ?? report.hazard_level} (as assessed by ${clusterReportCount} independent community reporter${clusterReportCount === 1 ? '' : 's'})
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
${claimantName ? 'I' : 'The community'} hereby demand${claimantName ? 's' : ''} that your office:

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

  return {
    letterText,
    statute: stateLaw.statute,
    statuteTitle: stateLaw.title,
    noticePeriodDays: stateLaw.noticePeriodDays,
    daysSinceReport,
    isOverdue,
  };
}

export function getSupportedStates(): string[] {
  return Object.keys(STATE_STATUTES);
}
