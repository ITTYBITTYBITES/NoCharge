import type { AppLegalSlug } from './appLegalPolicies';

export type ExperienceThemeSlug =
  | 'coosjoint'
  | 'twosecondwitness'
  | 'barn-road-chronicles'
  | 'profivue'
  | 'rideside';

export interface ExperienceThemeMeta {
  slug: ExperienceThemeSlug;
  themeName: string;
  mastheadBadge: string;
  publisher: string;
  supportEmail: string;
  appLegalSlug?: AppLegalSlug;
}

export const experienceThemes: Readonly<Record<ExperienceThemeSlug, ExperienceThemeMeta>> = {
  coosjoint: {
    slug: 'coosjoint',
    themeName: 'Bird-Noir Espresso Café',
    mastheadBadge: 'Android Game · Official Micro-Site',
    publisher: 'ITTYBITTYBITES',
    supportEmail: 'hello@nocharge.net',
    appLegalSlug: 'coosjoint',
  },
  twosecondwitness: {
    slug: 'twosecondwitness',
    themeName: 'Forensic Case-File Noir',
    mastheadBadge: 'Android Game · Official Micro-Site',
    publisher: 'ITTYBITTYBITES',
    supportEmail: 'hello@nocharge.net',
    appLegalSlug: 'twosecondwitness',
  },
  'barn-road-chronicles': {
    slug: 'barn-road-chronicles',
    themeName: 'Weathered Barnwood & Lantern',
    mastheadBadge: 'HTML5 Prototype · Release Micro-Site',
    publisher: 'ITTYBITTYBITES',
    supportEmail: 'hello@nocharge.net',
  },
  profivue: {
    slug: 'profivue',
    themeName: 'Reseller Fintech Ledger',
    mastheadBadge: 'Android Utility · Official Overview',
    publisher: 'ITTYBITTYBITES',
    supportEmail: 'hello@nocharge.net',
    appLegalSlug: 'profivue',
  },
  rideside: {
    slug: 'rideside',
    themeName: 'Coastal Marine Checklist',
    mastheadBadge: 'Android Utility · Official Overview',
    publisher: 'ITTYBITTYBITES',
    supportEmail: 'ittybittybitesgames@gmail.com',
    appLegalSlug: 'rideside',
  },
};

export function getExperienceTheme(slug: string | undefined): ExperienceThemeMeta | undefined {
  if (!slug || !Object.hasOwn(experienceThemes, slug)) return undefined;
  return experienceThemes[slug as ExperienceThemeSlug];
}
