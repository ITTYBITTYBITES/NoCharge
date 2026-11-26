/**
 * Independent external storefront registry.
 *
 * Add one entry per approved merchandise brand/app when content is ready. Each
 * entry owns its own internal landing-page slug, external Square Online URL,
 * optional NoCharge subdomain alias (for example, witness.nocharge.net or
 * coos.nocharge.net), and page metadata. The registry is intentionally empty
 * during Phase 1: no stores, brands, or domains are configured.
 */
export interface StorefrontBrand {
  id: string;
  slug: string;
  brandName: string;
  eyebrow: string;
  introduction: string;
  status: 'draft' | 'published';
  squareStorefrontUrl: string | null;
  nochargeSubdomain: string | null;
  seoTitle: string;
  seoDescription: string;
}

export const STOREFRONT_PROVIDER = 'Square Online';

export const storefrontBrands: readonly StorefrontBrand[] = [];

export function getStorefrontBySlug(slug: string | undefined): StorefrontBrand | undefined {
  if (!slug) return undefined;
  return storefrontBrands.find((brand) => brand.slug === slug);
}

export function isCompletePublishedStorefront(brand: StorefrontBrand): boolean {
  return brand.status === 'published'
    && Boolean(brand.slug.trim())
    && Boolean(brand.brandName.trim())
    && Boolean(brand.introduction.trim())
    && Boolean(brand.seoTitle.trim())
    && Boolean(brand.seoDescription.trim());
}

export function getPublishedStorefronts(): StorefrontBrand[] {
  return storefrontBrands.filter(isCompletePublishedStorefront);
}

export function getValidExternalStorefrontUrl(brand: StorefrontBrand): string | null {
  if (!brand.squareStorefrontUrl) return null;
  try {
    const url = new URL(brand.squareStorefrontUrl);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}
