import type { AppLegalSlug } from './appLegalPolicies';

export type ExperienceThemeSlug =
  | 'coosjoint'
  | 'twosecondwitness'
  | 'barn-road-chronicles'
  | 'profivue'
  | 'rideside';

export type ExperiencePersonality =
  | 'speakeasy'
  | 'casefile'
  | 'journal'
  | 'cockpit'
  | 'logbook';

export interface ExperienceCockpitMetric {
  code: string;
  label: string;
  detail: string;
}

export interface ExperienceFieldDatum {
  label: string;
  value: string;
}

export interface ExperienceThemeMeta {
  slug: ExperienceThemeSlug;
  personality: ExperiencePersonality;
  themeName: string;
  motifBadge: string;
  categoryBadge: 'Game' | 'Productivity';
  platformBadge: string;
  headerStamp: string;
  mastheadBadge: string;
  publisher: string;
  supportEmail: string;
  appLegalSlug?: AppLegalSlug;
  trailerStageEyebrow?: string;
  trailerStageHeading?: string;
  trailerNote?: string;
  sectionEyebrows: {
    intro: string;
    overview: string;
    features: string;
    availability: string;
    faq: string;
    workflows?: string;
    useCases?: string;
    gallery?: string;
  };
  featureBoardLabel?: string;
  featureItemPrefixes?: readonly string[];
  cockpitMetrics?: readonly ExperienceCockpitMetric[];
  logbookCoordinates?: readonly string[];
  fieldLedger?: readonly ExperienceFieldDatum[];
}

export const experienceThemes: Readonly<Record<ExperienceThemeSlug, ExperienceThemeMeta>> = {
  coosjoint: {
    slug: 'coosjoint',
    personality: 'speakeasy',
    themeName: 'Bird-Noir Espresso Speakeasy',
    motifBadge: 'Art-Deco Café Noir',
    categoryBadge: 'Game',
    platformBadge: 'Android · itch.io Prototype',
    headerStamp: 'EST. NIGHT ROAST · ESPRESSO SPEAKEASY',
    mastheadBadge: 'Android Game · Official Micro-Site',
    publisher: 'ITTYBITTYBITES',
    supportEmail: 'hello@nocharge.net',
    appLegalSlug: 'coosjoint',
    trailerStageEyebrow: 'NOW SHOWING · OFFICIAL SCREENING',
    trailerStageHeading: 'Feature Trailer · Click to Load',
    trailerNote: 'Curated poster stage · YouTube loads only on play',
    sectionEyebrows: {
      intro: 'House Release & Screening',
      overview: 'House Notes · Context',
      features: 'House Menu · At a Glance',
      availability: 'Where to Find the Joint',
      faq: 'House Rules & Questions',
    },
    featureBoardLabel: 'HOUSE SPECIALTIES · ROAST SHEET',
    featureItemPrefixes: ['Course I', 'Course II', 'Course III', 'Course IV'],
  },
  twosecondwitness: {
    slug: 'twosecondwitness',
    personality: 'casefile',
    themeName: 'Forensic Detective Case-File',
    motifBadge: 'Forensic Recall Dossier',
    categoryBadge: 'Game',
    platformBadge: 'Android · itch.io Project',
    headerStamp: 'CASE FILE // 2-SECOND RECALL',
    mastheadBadge: 'Android Game · Official Micro-Site',
    publisher: 'ITTYBITTYBITES',
    supportEmail: 'hello@nocharge.net',
    appLegalSlug: 'twosecondwitness',
    trailerStageEyebrow: 'EXHIBIT A // OFFICIAL FOOTAGE',
    trailerStageHeading: 'Evidence Monitor · Click to Load',
    trailerNote: 'Locked offline · YouTube loads only on play',
    sectionEyebrows: {
      intro: 'Dossier // Official Release Destinations',
      overview: 'Section 01 // Case Brief',
      features: 'Section 02 // Evidence Log',
      availability: 'Section 03 // Chain of Custody',
      faq: 'Section 04 // Interrogation Q&A',
    },
    featureBoardLabel: 'RECORDED EXHIBITS // PUBLISHER DESCRIPTION',
    featureItemPrefixes: ['EX-01', 'EX-02', 'EX-03', 'EX-04'],
  },
  'barn-road-chronicles': {
    slug: 'barn-road-chronicles',
    personality: 'journal',
    themeName: 'Weathered Field Journal & Lantern Storyboard',
    motifBadge: 'Lantern Field Journal',
    categoryBadge: 'Game',
    platformBadge: 'HTML5 Prototype · itch.io',
    headerStamp: 'ACT I · FIELD JOURNAL & STORYBOARD',
    mastheadBadge: 'HTML5 Prototype · Release Micro-Site',
    publisher: 'ITTYBITTYBITES',
    supportEmail: 'hello@nocharge.net',
    sectionEyebrows: {
      intro: 'Prologue · Creator-Hosted Dispatch',
      overview: 'Chapter I · Field Context',
      features: 'Chapter II · Lantern Storyboard',
      availability: 'Chapter III · Trailhead & Release',
      faq: 'Chapter IV · Margin Notes & FAQ',
    },
    featureBoardLabel: 'STORYBOARD PLATES · ACT I NOTES',
    featureItemPrefixes: ['Plate 01', 'Plate 02', 'Plate 03', 'Plate 04', 'Plate 05'],
    fieldLedger: [
      { label: 'Format', value: 'HTML5 Browser Prototype' },
      { label: 'Host', value: 'Creator-Owned itch.io Page' },
      { label: 'Input Focus', value: 'Mobile-First · Touch-First' },
      { label: 'H5 Ads Status', value: 'Future Candidate (Deferred)' },
    ],
  },
  profivue: {
    slug: 'profivue',
    personality: 'cockpit',
    themeName: 'Reseller Fintech Margin Cockpit',
    motifBadge: 'Precision Margin Ledger',
    categoryBadge: 'Productivity',
    platformBadge: 'Android · Local-First Utility',
    headerStamp: 'MARGIN COCKPIT // RESELLER FEE LEDGER',
    mastheadBadge: 'Android Utility · Official Overview',
    publisher: 'ITTYBITTYBITES',
    supportEmail: 'hello@nocharge.net',
    appLegalSlug: 'profivue',
    sectionEyebrows: {
      intro: 'Direct answer',
      overview: '01 / Ledger Context',
      features: '02 / Feature Breakdown',
      workflows: '03 / Pricing Workflows',
      useCases: '04 / Seller Scenarios',
      gallery: '05 / Product Specimens',
      availability: '06 / Scope & Verification',
      faq: '07 / Audit Q&A',
    },
    featureBoardLabel: 'CALCULATION CAPABILITIES · PUBLISHER SCOPE',
    featureItemPrefixes: ['01', '02', '03', '04', '05', '06'],
    cockpitMetrics: [
      { code: 'METRIC 01', label: 'Net Profit', detail: 'Sale less cost, fees & shipping' },
      { code: 'METRIC 02', label: 'Margin %', detail: 'Estimated share of sale retained' },
      { code: 'METRIC 03', label: 'ROI %', detail: 'Estimated return on purchase cost' },
      { code: 'METRIC 04', label: 'Break-Even', detail: 'Minimum price to recover outlay' },
    ],
  },
  rideside: {
    slug: 'rideside',
    personality: 'logbook',
    themeName: 'Coastal Marine Captain’s Log & Checklist',
    motifBadge: 'Nautical Deck Logbook',
    categoryBadge: 'Productivity',
    platformBadge: 'Android · On-Device Logbook',
    headerStamp: 'CAPTAIN’S LOG // BOAT & PWC DECK',
    mastheadBadge: 'Android Utility · Official Overview',
    publisher: 'ITTYBITTYBITES',
    supportEmail: 'ittybittybitesgames@gmail.com',
    appLegalSlug: 'rideside',
    sectionEyebrows: {
      intro: 'Direct answer',
      overview: 'LOG 01 // Vessel Notebook Context',
      features: 'LOG 02 // Pre-Launch Checklist Deck',
      workflows: 'LOG 03 // Launch & Trip Routines',
      useCases: 'LOG 04 // On-Water Use Cases',
      gallery: 'LOG 05 // Deck Imagery',
      availability: 'LOG 06 // Harbor Scope & Verification',
      faq: 'LOG 07 // Captain’s Q&A',
    },
    featureBoardLabel: 'PRE-LAUNCH & TRIP CHECKLIST ITEMS',
    featureItemPrefixes: ['Pre-Launch', 'Craft Spec', 'Trip Notes', 'Templates', 'Weather', 'On-Device'],
    logbookCoordinates: [
      'CRAFT // BOAT & PWC',
      'DECK // BEFORE · DURING · AFTER',
      'RECORDS // ON-DEVICE NOTEBOOK',
    ],
  },
};

export function getExperienceTheme(slug: string | undefined): ExperienceThemeMeta | undefined {
  if (!slug || !Object.hasOwn(experienceThemes, slug)) return undefined;
  return experienceThemes[slug as ExperienceThemeSlug];
}
