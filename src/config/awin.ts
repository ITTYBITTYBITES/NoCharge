/**
 * Awin advertiser (merchant) registry and runtime switches.
 *
 * Publisher id 3025417, site https://nocharge.net/.
 *
 * ## Two switches, deliberately separate
 *
 *  - `AWIN_ENABLED` (`PUBLIC_AWIN_ENABLED`) gates the MasterTag **script** and
 *    every paid link. Off by default so a build without the flag makes no
 *    third-party request and renders no commercial link.
 *  - `merchant.mid` gates one merchant. A merchant without a confirmed MID is
 *    never rendered: an invented MID produces a live-looking link that pays
 *    nobody, which is worse than showing nothing.
 *
 * ## Where MIDs come from
 *
 * Awin dashboard → Account → Advertisers → the row for the merchant → the
 * number in the `MID` column. The two approved advertisers in this account are
 * listed below; their MIDs still have to be pasted in, and each merchant's
 * destination URLs have to be real product/category pages, not a guess.
 *
 * ## Convert-a-Link
 *
 * Convert-a-Link is ON in the dashboard. It rewrites outbound merchant links in
 * the browser using the MasterTag, so a plain merchant URL is also attributable.
 * NoCharge still renders explicit `cread.php` links wherever a merchant block is
 * built (deterministic, testable, works with the script blocked) and treats
 * Convert-a-Link as a safety net for links written by hand in markdown — see
 * `docs/AWIN_INTEGRATION.md` for why that order matters.
 */

/** Master switch. Nothing Awin-related renders or loads unless this is true. */
export const AWIN_ENABLED = import.meta.env.PUBLIC_AWIN_ENABLED === 'true';

/** Awin publisher (affiliate) id. */
export const AWIN_PUBLISHER_ID = '3025417' as const;

/** Official MasterTag. Sets the Awin tracking cookie; consent-gated in the layout. */
export const AWIN_MASTERTAG_URL = `https://www.dwin2.com/pub.${AWIN_PUBLISHER_ID}.min.js` as const;

/**
 * Hosts the MasterTag needs. Added to the Content-Security-Policy only when
 * `AWIN_ENABLED` is true — the calm default policy stays `'self'`-first.
 */
export const AWIN_CSP_SOURCES = {
  scriptSrc: ['https://www.dwin2.com'],
  imgSrc: ['https://www.dwin2.com', 'https://www.awin1.com'],
  connectSrc: ['https://www.dwin2.com', 'https://www.awin1.com'],
} as const;

export type AwinMerchantStatus = 'approved' | 'pending' | 'declined';

/**
 * MIDs can be supplied by environment instead of a code edit, so switching the
 * program on is a deploy-variable change (and so CI can build and verify the
 * enabled path with test MIDs). The env value wins; the literal below is the
 * fallback a maintainer commits once the value is confirmed.
 */
const envMid = (name: string): string | null => {
  const value =
    name === 'brkox'
      ? import.meta.env.PUBLIC_AWIN_MID_BRKOX
      : name === 'shenzhen-cangyu'
        ? import.meta.env.PUBLIC_AWIN_MID_CANGYU
        : undefined;
  return value && /^\d{3,12}$/.test(value.trim()) ? value.trim() : null;
};

export interface AwinMerchant {
  /** Stable key used in content and components. */
  key: string;
  /** Display name exactly as Awin lists the advertiser. */
  name: string;
  /**
   * Awin advertiser id from the dashboard `MID` column.
   *
   * `null` means "not confirmed yet". The build refuses to render a link for a
   * merchant with a null MID — see `AwinLink.astro`.
   */
  mid: string | null;
  status: AwinMerchantStatus;
  /** What this merchant may be used for in editorial copy. */
  category: string;
  /** Domains this merchant's own product pages live on (for Convert-a-Link checks). */
  domains: readonly string[];
  /**
   * Editorial destinations used by `GearPicks`. Each must be a real page on the
   * merchant domain; `path` is appended to the first domain.
   */
  destinations: readonly { label: string; path: string; why: string; limits: string }[];
  /** Set once the MID and destinations have been verified by the site owner. */
  verified: boolean;
}

const RAW_MERCHANTS: readonly AwinMerchant[] = [
  {
    key: 'brkox',
    name: 'brkox',
    // Confirmed MID, or null. Set PUBLIC_AWIN_MID_BRKOX to enable without a
    // code change; until then this merchant renders nothing, because a guessed
    // MID pays no commission.
    mid: 'PLACEHOLDER' as string | null,
    status: 'approved',
    category: 'Hobby hardware / LEGO lighting kits',
    domains: ['brkox.com', 'www.brkox.com'],
    destinations: [
      {
        label: 'brkox LEGO lighting kit (paid link)',
        path: '/collections/lighting-kits',
        why: 'A lighting kit is the one hobby-hardware purchase that fits a dim, low-glare desk setup: it adds accent light without washing out a screen.',
        limits: 'Sold for specific LEGO sets, so check the set number before buying. Not a desk lamp and not a substitute for task lighting.',
      },
    ],
    verified: false,
  },
  {
    key: 'shenzhen-cangyu',
    name: 'Shenzhen Cangyu Technology Co., Ltd.',
    // Confirmed MID, or null. Set PUBLIC_AWIN_MID_CANGYU to enable.
    mid: 'PLACEHOLDER' as string | null,
    status: 'approved',
    category: 'Electronics / gadgets (monitor arms, small peripherals, cable accessories)',
    domains: ['cangyu-tech.com', 'www.cangyu-tech.com'],
    destinations: [
      {
        label: 'Shenzhen Cangyu desk accessories (paid link)',
        path: '/collections/desk-accessories',
        why: 'Accessory-level purchases are the cheapest way to test a desk arrangement before spending on furniture.',
        limits: 'Generic accessory listings; compatibility with a specific monitor or clamp is on you to check. Confirm the mount pattern before ordering.',
      },
    ],
    verified: false,
  },
] as const;

/**
 * The registry with environment MIDs applied. A merchant whose MID is still the
 * `PLACEHOLDER` literal (or absent) resolves to `null` and cannot render.
 */
export const AWIN_MERCHANTS: readonly AwinMerchant[] = RAW_MERCHANTS.map((merchant) => ({
  ...merchant,
  mid: envMid(merchant.key) ?? (merchant.mid === 'PLACEHOLDER' ? null : merchant.mid),
}));

/** Merchants that are approved, MID-confirmed and safe to render. */
export function renderableMerchants(): readonly AwinMerchant[] {
  if (!AWIN_ENABLED) return [];
  return AWIN_MERCHANTS.filter((merchant) => merchant.status === 'approved' && merchant.mid !== null);
}

/** Lookup that never returns a merchant the site must not link to. */
export function merchantByKey(key: string): AwinMerchant | undefined {
  return AWIN_MERCHANTS.find((merchant) => merchant.key === key);
}
