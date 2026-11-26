/**
 * ITTYBITTYBITES application websites listed by the NoCharge Experiences
 * directory. This data is separate from the static app showcases, editorial
 * overviews, and the independent Shop destination.
 */
export const EXPERIENCE_PRODUCT_CATEGORIES = [
  'Games & Entertainment',
  'Productivity & Utilities',
] as const;

export type ExperienceProductCategory = (typeof EXPERIENCE_PRODUCT_CATEGORIES)[number];
export type ExperienceProductStatus = 'draft' | 'published' | 'archived';

export interface ExperienceProduct {
  id: string;
  slug: string;
  name: string;
  category: ExperienceProductCategory;
  /** Exact configured host; product sites are external app destinations, not stores. */
  hostname: string;
  summary: string;
  status: ExperienceProductStatus;
}

export const experienceProducts: readonly ExperienceProduct[] = [
  {
    id: 'ittybittybites-product-coosjoint',
    slug: 'coosjoint',
    name: "Coo's Joint: Coffee Idle",
    category: 'Games & Entertainment',
    hostname: 'coosjoint.nocharge.net',
    summary: 'Read a static showcase for the Android app, follow the separate creator-hosted itch.io prototype, and visit the official product website for current details.',
    status: 'published',
  },
  {
    id: 'ittybittybites-product-twosecondwitness',
    slug: 'twosecondwitness',
    name: 'The 2-Second Witness',
    category: 'Games & Entertainment',
    hostname: 'twosecondwitness.nocharge.net',
    summary: 'Read a static showcase for the Android app, follow the separate creator-hosted itch.io project, and visit the official product website for current details.',
    status: 'published',
  },
  {
    id: 'ittybittybites-product-profivue',
    slug: 'profivue',
    name: 'ProfiVue',
    category: 'Productivity & Utilities',
    hostname: 'profivue.nocharge.net',
    summary: 'Review ProfiVue’s reseller calculator for marketplace fees, estimated profit, and pricing decisions; check the official ITTYBITTYBITES product website for current app details.',
    status: 'published',
  },
  {
    id: 'ittybittybites-product-rideside',
    slug: 'rideside',
    name: 'RideSide',
    category: 'Productivity & Utilities',
    hostname: 'rideside.nocharge.net',
    summary: 'See how RideSide organizes boat and personal-watercraft checklists and ride notes; check the official ITTYBITTYBITES product website for current app details.',
    status: 'published',
  },
] as const satisfies readonly ExperienceProduct[];

function isSafeExperienceProductHost(hostname: string): boolean {
  try {
    const url = new URL(`https://${hostname}/`);
    return url.protocol === 'https:'
      && url.hostname === hostname
      && url.port === ''
      && url.pathname === '/'
      && url.search === ''
      && url.hash === ''
      && url.hostname.endsWith('.nocharge.net')
      && !url.hostname.includes('square');
  } catch {
    return false;
  }
}

export function validateExperienceProducts(products: readonly ExperienceProduct[] = experienceProducts): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const hostnames = new Set<string>();

  for (const product of products) {
    if (!product.id.trim() || ids.has(product.id)) issues.push(`duplicate or empty product ID: ${product.id}`);
    if (!product.slug.trim() || slugs.has(product.slug)) issues.push(`duplicate or empty product slug: ${product.slug}`);
    if (!product.hostname.trim() || hostnames.has(product.hostname)) issues.push(`duplicate or empty product host: ${product.hostname}`);
    if (!EXPERIENCE_PRODUCT_CATEGORIES.includes(product.category)) issues.push(`unknown category for ${product.id}`);
    if (!isSafeExperienceProductHost(product.hostname)) issues.push(`unsafe or non-product host for ${product.id}: ${product.hostname}`);
    if (!product.name.trim() || !product.summary.trim()) issues.push(`missing directory copy for ${product.id}`);
    ids.add(product.id);
    slugs.add(product.slug);
    hostnames.add(product.hostname);
  }

  return issues;
}

export function assertValidExperienceProducts(products: readonly ExperienceProduct[] = experienceProducts): void {
  const issues = validateExperienceProducts(products);
  if (issues.length) throw new Error(`Invalid ITTYBITTYBITES product directory:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
}

assertValidExperienceProducts();

/** Fail closed for drafts/archived entries; future products can be added safely. */
export function getPublishedExperienceProducts(category?: ExperienceProductCategory): ExperienceProduct[] {
  assertValidExperienceProducts();
  return experienceProducts.filter((product) => product.status === 'published' && (!category || product.category === category));
}

export function getExperienceProductUrl(product: Pick<ExperienceProduct, 'hostname'>): string {
  return `https://${product.hostname}/`;
}
