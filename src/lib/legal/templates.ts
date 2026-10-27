// ═══════════════════════════════════════════════════════════════════════════
//  LEGAL FRAMING TEMPLATES — web mirror of the mobile dataset
//
//  MIRRORS (keep in sync by hand; no cross-repo imports):
//    Fault-Line/src/services/legal-templates/types.ts      → LegalFraming, LegalTemplate
//    Fault-Line/src/services/legal-templates/templates.ts  → TEMPLATES, CATEGORY_FRAMING,
//                                                             getFraming, getTemplate,
//                                                             templateDisclaimer
//    Fault-Line/src/constants/categories.ts                → MOBILE_CATEGORY_LABELS
//                                                             (labels for categories the
//                                                             web taxonomy does not list)
//  Mirrored from mobile template version 0.1.0 (all framings) on 2026-10-27.
//
//  Every category maps to one framing. The letter generator consults
//  getFraming(category) to pick the template, then cites that template's
//  statute + notice pathway. All templates are `pending-review`, so letters
//  generated from them carry the unreviewed-content banner.
// ═══════════════════════════════════════════════════════════════════════════

export type LegalFraming =
  | 'defective-highway' // Physical infrastructure defects — M.G.L. c. 84 / R.I. § 24-5-14 / RSA 231:90 path
  | 'ada-title-ii' // ADA Title II — public entities (state / local government access)
  | 'fair-housing-504' // Fair Housing Act + Section 504 — public housing
  | 'title-vi-language' // Title VI + EO 13166 — language access at federally-funded services
  | 'transit-ada'; // 49 CFR Part 37 — transit authority accessibility

export type TemplateVerificationStatus = 'verified' | 'pending-review' | 'stale' | 'draft';

export interface LegalTemplate {
  framing: LegalFraming;
  version: string;
  headline: string;
  statuteCitation: string;
  statuteUrl: string;
  statuteTitle: string;
  legalBasisText: string;
  noticePeriodDays: number;
  filingRequirements: string;
  federalComplaintPathway: string;
  demandLanguage: {
    inspectVerb: string;
    remedyClause: string;
  };
  verificationStatus: TemplateVerificationStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  nextReviewAt: string | null;
}

const TEMPLATES: Record<LegalFraming, LegalTemplate> = {
  'defective-highway': {
    framing: 'defective-highway',
    version: '0.1.0',
    headline: 'FORMAL NOTICE OF DEFECTIVE CONDITION',
    statuteCitation: 'State defective-highway statute (see per-state routing)',
    statuteUrl: 'https://fault-line.dev/claim-by-state.html',
    statuteTitle: 'State Defective-Highway Statute',
    legalBasisText:
      'State defective-highway statutes impose a duty on municipalities to maintain public ways in reasonably safe condition. Documented notice starts the statutory clock; failure to remediate within the statutory window creates tort exposure. This letter is that documented notice.',
    noticePeriodDays: 30, // Overridden by the state statute record for this framing.
    filingRequirements:
      'Written notice must be delivered to the municipal clerk of record within the applicable state statutory window.',
    federalComplaintPathway:
      'No federal complaint pathway for defective-highway claims — this is state-law only.',
    demandLanguage: {
      inspectVerb: 'inspect the reported location',
      remedyClause: 'Remedy the hazardous condition',
    },
    verificationStatus: 'pending-review',
    verifiedBy: null,
    verifiedAt: null,
    nextReviewAt: null,
  },

  'ada-title-ii': {
    framing: 'ada-title-ii',
    version: '0.1.0',
    headline: 'FORMAL ADA TITLE II NOTICE OF PROGRAM-ACCESS BARRIER',
    statuteCitation: '28 CFR Part 35 (ADA Title II)',
    statuteUrl: 'https://www.ada.gov/law-and-regs/regulations/title-ii-2010-regulations/',
    statuteTitle: 'Americans with Disabilities Act, Title II',
    legalBasisText:
      'Under Title II of the Americans with Disabilities Act (42 U.S.C. § 12132; 28 CFR Part 35), no qualified individual with a disability shall, by reason of such disability, be excluded from participation in or be denied the benefits of the services, programs, or activities of a public entity. Public entities have an affirmative duty to ensure program access; documented failure to remediate a known access barrier is an enforceable Title II violation.',
    noticePeriodDays: 30,
    filingRequirements:
      "Written notice to the public entity's designated ADA Coordinator (required by 28 CFR § 35.107 for entities with 50+ employees). Federal complaint may be filed with DOJ Civil Rights Division at any time.",
    federalComplaintPathway:
      'U.S. Department of Justice, Civil Rights Division — file at https://civilrights.justice.gov/report/',
    demandLanguage: {
      inspectVerb: 'evaluate the reported accessibility barrier',
      remedyClause: 'Provide accessible access to the program, service, or facility',
    },
    verificationStatus: 'pending-review',
    verifiedBy: null,
    verifiedAt: null,
    nextReviewAt: null,
  },

  'fair-housing-504': {
    framing: 'fair-housing-504',
    version: '0.1.0',
    headline:
      'FORMAL FAIR HOUSING ACT / SECTION 504 NOTICE OF HABITABILITY / ACCESSIBILITY VIOLATION',
    statuteCitation:
      'Fair Housing Act (42 U.S.C. § 3601 et seq.) + Section 504 of the Rehabilitation Act (29 U.S.C. § 794)',
    statuteUrl: 'https://www.hud.gov/program_offices/fair_housing_equal_opp',
    statuteTitle: 'Fair Housing Act + Section 504',
    legalBasisText:
      'The Fair Housing Act and Section 504 of the Rehabilitation Act prohibit discrimination in housing on the basis of disability and require public housing authorities to make reasonable accommodations, ensure accessibility of common areas and units, and maintain habitability standards under HUD Housing Quality Standards (HQS). Documented failure to remediate a known violation is enforceable through HUD FHEO complaint or private federal action.',
    noticePeriodDays: 30,
    filingRequirements:
      'Written notice to the responsible Public Housing Authority. HUD FHEO complaint may be filed within one year of the violation.',
    federalComplaintPathway:
      'U.S. Department of Housing and Urban Development, Fair Housing Enforcement Center — file at https://www.hud.gov/program_offices/fair_housing_equal_opp/online-complaint',
    demandLanguage: {
      inspectVerb: 'inspect the reported unit or facility',
      remedyClause:
        'Remedy the habitability or accessibility violation within HUD Housing Quality Standards',
    },
    verificationStatus: 'pending-review',
    verifiedBy: null,
    verifiedAt: null,
    nextReviewAt: null,
  },

  'title-vi-language': {
    framing: 'title-vi-language',
    version: '0.1.0',
    headline: 'FORMAL TITLE VI NOTICE OF LANGUAGE-ACCESS FAILURE',
    statuteCitation:
      'Title VI of the Civil Rights Act of 1964 (42 U.S.C. § 2000d) + Executive Order 13166',
    statuteUrl: 'https://www.justice.gov/crt/fcs/TitleVI',
    statuteTitle: 'Title VI + EO 13166 Language Access',
    legalBasisText:
      'Title VI of the Civil Rights Act prohibits federally-funded programs from discriminating on the basis of national origin, which courts have interpreted to include failure to provide meaningful access to Limited English Proficient (LEP) residents. Executive Order 13166 requires federal agencies and their grantees to develop plans for LEP language access. Documented English-only public services in demographically-diverse jurisdictions may violate Title VI when federal funds are involved.',
    noticePeriodDays: 60,
    filingRequirements:
      "Written notice to the responsible agency's Civil Rights office. Federal complaint may be filed with the applicable federal funding agency's Office of Civil Rights or with DOJ Federal Coordination and Compliance Section.",
    federalComplaintPathway:
      'U.S. Department of Justice, Civil Rights Division, Federal Coordination and Compliance Section — file at https://civilrights.justice.gov/report/',
    demandLanguage: {
      inspectVerb: 'evaluate the language-access failure at the reported service',
      remedyClause:
        "Provide meaningful language access consistent with Title VI and the entity's LEP plan",
    },
    verificationStatus: 'pending-review',
    verifiedBy: null,
    verifiedAt: null,
    nextReviewAt: null,
  },

  'transit-ada': {
    framing: 'transit-ada',
    version: '0.1.0',
    headline: 'FORMAL TRANSIT ADA NOTICE OF ACCESSIBILITY FAILURE',
    statuteCitation:
      '49 CFR Part 37 (DOT ADA transit rules) + 49 CFR Part 38 (vehicle accessibility)',
    statuteUrl: 'https://www.ecfr.gov/current/title-49/subtitle-A/part-37',
    statuteTitle: 'DOT ADA Transit Regulations',
    legalBasisText:
      "The U.S. Department of Transportation's ADA regulations at 49 CFR Part 37 require transit authorities to make services, facilities, and vehicles accessible to individuals with disabilities. 49 CFR Part 38 sets vehicle accessibility standards. Documented failure to remediate an accessibility barrier at a transit facility, platform, or on a vehicle is enforceable through FTA Office of Civil Rights complaint or private federal action.",
    noticePeriodDays: 30,
    filingRequirements:
      "Written notice to the transit authority's ADA Coordinator or Customer Service. FTA complaint may be filed within 180 days.",
    federalComplaintPathway:
      'Federal Transit Administration, Office of Civil Rights — file at https://www.transit.dot.gov/regulations-and-guidance/civil-rights-ada/file-complaint-fta',
    demandLanguage: {
      inspectVerb: 'evaluate the reported transit accessibility barrier',
      remedyClause:
        'Bring the facility, platform, or vehicle into compliance with 49 CFR Part 37 / 38',
    },
    verificationStatus: 'pending-review',
    verifiedBy: null,
    verifiedAt: null,
    nextReviewAt: null,
  },
};

// ── Category → framing lookup ──────────────────────────────────────────────
// Keyed by string, not the web ReportCategory union: the reports table is
// shared with the mobile app, which files the Access & Equity categories
// below. Anything unlisted (physical infrastructure) is 'defective-highway'.
export const CATEGORY_FRAMING: Readonly<Record<string, LegalFraming>> = {
  // Group A — Physical mobility / ADA (Title II)
  missing_curb_cut: 'ada-title-ii',
  broken_curb_cut: 'ada-title-ii',
  broken_accessibility_ramp: 'ada-title-ii',
  ada_blocked_path: 'ada-title-ii',
  sidewalk_dead_end: 'ada-title-ii',
  broken_aps: 'ada-title-ii',
  missing_aps: 'ada-title-ii',
  accessibility: 'ada-title-ii', // catch-all accessibility → Title II

  // Group B — Sensory & cognitive access
  missing_braille_signage: 'ada-title-ii',
  english_only_signage: 'title-vi-language',
  missing_large_print: 'ada-title-ii',
  illegible_signage: 'ada-title-ii',
  missing_audible_signage_transit: 'transit-ada',

  // Group C — Age & vulnerability (no strong federal statute)
  missing_bench_senior_route: 'defective-highway',
  missing_shade_heat_vulnerable: 'defective-highway',
  broken_drinking_fountain: 'defective-highway',
  missing_public_restroom: 'defective-highway',
  missing_crossing_guard: 'defective-highway',
  dangerous_school_walk_route: 'defective-highway',

  // Group D — Housing (Fair Housing + Section 504)
  broken_elevator_public_housing: 'fair-housing-504',
  broken_heat_ac_public_housing: 'fair-housing-504',
  mold_public_housing: 'fair-housing-504',
  missing_accessibility_public_housing: 'fair-housing-504',

  // Group E — Transit (49 CFR Part 37)
  missing_bus_shelter: 'transit-ada',
  broken_bus_shelter: 'transit-ada',
  missing_transit_bench: 'transit-ada',
  ada_inaccessible_platform: 'transit-ada',
  broken_wayfinding_transit: 'transit-ada',

  // Group F — Digital public infrastructure (Title II 2024 web rule)
  broken_city_website_form: 'ada-title-ii',
  screen_reader_inaccessible_pdf: 'ada-title-ii',
  missing_translation: 'title-vi-language',
  city_website_ada_violation: 'ada-title-ii',
  missing_plain_language_version: 'ada-title-ii',
  missing_captions_official_video: 'ada-title-ii',
  broken_mobile_app_accessibility: 'ada-title-ii',
  missing_digital_service_equivalent: 'ada-title-ii',
  broken_government_email: 'ada-title-ii',
  broken_phone_accessibility: 'ada-title-ii',
  missing_responsive_design: 'ada-title-ii',
  broken_subscription_mechanism: 'ada-title-ii',
};

// Display labels for mobile-only categories (web's src/lib/categories.ts
// covers the physical-infrastructure set). Used only for letter text.
export const MOBILE_CATEGORY_LABELS: Readonly<Record<string, string>> = {
  missing_curb_cut: 'Missing Curb Cut',
  broken_curb_cut: 'Broken Curb Cut',
  broken_accessibility_ramp: 'Broken Access Ramp',
  ada_blocked_path: 'ADA-Blocked Path',
  sidewalk_dead_end: 'Sidewalk Dead-End',
  broken_aps: 'Broken Accessible Signal',
  missing_aps: 'Missing Accessible Signal',
  missing_braille_signage: 'Missing Braille Signage',
  english_only_signage: 'English-Only Signage',
  missing_large_print: 'Missing Large-Print',
  illegible_signage: 'Illegible Signage',
  missing_audible_signage_transit: 'Missing Audible Signage',
  missing_bench_senior_route: 'Missing Bench (Senior Route)',
  missing_shade_heat_vulnerable: 'Missing Shade',
  broken_drinking_fountain: 'Broken Drinking Fountain',
  missing_public_restroom: 'Missing / Closed Restroom',
  missing_crossing_guard: 'Missing Crossing Guard',
  dangerous_school_walk_route: 'Dangerous School Route',
  broken_elevator_public_housing: 'Broken Elevator (Public Housing)',
  broken_heat_ac_public_housing: 'Broken Heat/AC (Public Housing)',
  mold_public_housing: 'Mold (Public Housing)',
  missing_accessibility_public_housing: 'Missing Accessibility (Public Housing)',
  missing_bus_shelter: 'Missing Bus Shelter',
  broken_bus_shelter: 'Broken Bus Shelter',
  missing_transit_bench: 'Missing Transit Bench',
  ada_inaccessible_platform: 'ADA-Inaccessible Platform',
  broken_wayfinding_transit: 'Broken Wayfinding (Transit)',
  broken_city_website_form: 'Broken City Form',
  screen_reader_inaccessible_pdf: 'Inaccessible PDF',
  missing_translation: 'Missing Translation',
  city_website_ada_violation: 'City Website ADA Violation',
  missing_plain_language_version: 'No Plain-Language Version',
  missing_captions_official_video: 'Missing Captions',
  broken_mobile_app_accessibility: 'Broken App Accessibility',
  missing_digital_service_equivalent: 'No Digital Equivalent',
  broken_government_email: 'Broken Gov Email',
  broken_phone_accessibility: 'Broken Phone Access',
  missing_responsive_design: 'Not Mobile-Accessible',
  broken_subscription_mechanism: 'Broken Notification System',
};

// ── Public accessors ───────────────────────────────────────────────────────

export function getFraming(categoryKey: string): LegalFraming {
  return CATEGORY_FRAMING[categoryKey] ?? 'defective-highway';
}

export function getTemplate(framing: LegalFraming): LegalTemplate {
  return TEMPLATES[framing];
}

export function templateDisclaimer(template: LegalTemplate): string {
  const versionLine = `Template: ${template.framing} v${template.version}`;
  switch (template.verificationStatus) {
    case 'verified':
      return `${versionLine} · reviewed: ${template.verifiedBy || 'unnamed reviewer'}, ${template.verifiedAt || 'date unknown'}. Not legal advice.`;
    case 'stale':
      return `${versionLine} · review OVERDUE (last reviewed ${template.verifiedAt || 'never'}). Verify statute and pathway before relying on this letter. Not legal advice.`;
    case 'pending-review':
      return `${versionLine} · NOT YET LEGALLY REVIEWED. Statute and complaint pathway are our best current reading. Verify before sending. Not legal advice.`;
    case 'draft':
      return `${versionLine} · draft entry, not for user delivery.`;
  }
}
