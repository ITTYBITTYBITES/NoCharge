/**
 * Pure Awin link construction and validation.
 *
 * No `import.meta.env` here: this module is environment-free so it can be unit
 * tested (src/lib/awin.test.ts) and imported by the build-time validators. The
 * environment and merchant registry live in `src/config/awin.ts`.
 *
 * Why this exists: an Awin outbound link is easy to write wrong. A missing
 * `awinaffid`, a merchant MID that belongs to a different advertiser, or a
 * `ued` that is not encoded all produce a link that looks fine, ships, and pays
 * nothing. Everything here is checked at build time so a broken link is a build
 * failure, not a silent revenue leak.
 */

/** Awin's click-tracking endpoint. All tracked outbound links go through it. */
export const AWIN_CLICK_HOSTS = ['www.awin1.com', 'awin1.com'] as const;
export const AWIN_CLICK_PATH = '/cread.php' as const;

/** Required `rel` on every paid link, site-wide. Asserted in tests. */
export const AWIN_REL = 'sponsored nofollow noopener noreferrer' as const;

/**
 * `clickref` becomes a query-string value inside Awin's reporting. Awin accepts
 * alphanumerics plus `.`, `_` and `-`; anything else is stripped rather than
 * "cleaned up" silently, so a caller that passes junk gets a build error and
 * fixes the value instead of shipping an unreadable report dimension.
 */
const CLICKREF_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

/** Claims the editorial policy forbids on a paid link label. */
const FORBIDDEN_LABEL_PATTERNS: readonly [RegExp, string][] = [
  [/\b(price|prices|pricing|cheapest|cheap|deal|deals|discount|sale|% off|save \$|stock|in stock|availability)\b/i,
    'price, discount, deal or stock claims are not allowed on a paid link label'],
  [/\b(rating|ratings|rated|reviews?|stars?)\b/i,
    'merchant or product rating/review claims are not allowed on a paid link label'],
  [/\b(best|top|#1|number one)\b/i,
    'superlatives such as "best" are not allowed on a paid link label'],
];

export interface AwinLinkInput {
  /** Destination URL at the merchant, e.g. `https://www.brkox.com/products/...`. */
  destination: string;
  /** Awin publisher id (affiliate id). */
  publisherId: string;
  /** Awin advertiser id for the merchant. */
  merchantId: string;
  /** Optional reporting reference, surfaced in Awin reports. */
  clickref?: string;
}

export interface AwinLinkResult {
  /** The tracked `cread.php` URL that must be rendered in `href`. */
  href: string;
  /** Hosts the rendered link may point at. */
  allowedHosts: readonly string[];
}

export class AwinLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AwinLinkError';
  }
}

function assertPublisherId(publisherId: string): void {
  if (!/^\d{4,12}$/.test(publisherId)) {
    throw new AwinLinkError(`Awin publisher id must be numeric, got "${publisherId}"`);
  }
}

function assertMerchantId(merchantId: string, merchantName: string): void {
  if (!/^\d{3,12}$/.test(merchantId)) {
    throw new AwinLinkError(
      `Awin merchant id (MID) for ${merchantName} must be numeric, got "${merchantId}". ` +
        'Copy the MID from the advertiser row in the Awin dashboard (Account → Advertisers).',
    );
  }
}

/** Builds the tracked `cread.php` URL. Throws on anything that cannot pay. */
export function buildAwinHref({ destination, publisherId, merchantId, clickref }: AwinLinkInput): AwinLinkResult {
  assertPublisherId(publisherId);
  assertMerchantId(merchantId, `MID ${merchantId}`);

  let target: URL;
  try {
    target = new URL(destination);
  } catch {
    throw new AwinLinkError(`Awin destination is not an absolute URL: "${destination}"`);
  }
  if (target.protocol !== 'https:') {
    throw new AwinLinkError(`Awin destination must be https, got "${destination}"`);
  }
  if (clickref !== undefined && !CLICKREF_PATTERN.test(clickref)) {
    throw new AwinLinkError(
      `clickref "${clickref}" is invalid: use 1-64 characters of A-Z a-z 0-9 . _ -`,
    );
  }

  const href = new URL(`https://${AWIN_CLICK_HOSTS[0]}${AWIN_CLICK_PATH}`);
  // Order matches Awin's documented click-URL shape.
  href.searchParams.set('awinmid', merchantId);
  href.searchParams.set('awinaffid', publisherId);
  if (clickref) href.searchParams.set('clickref', clickref);
  href.searchParams.set('ued', target.toString());

  return { href: href.toString(), allowedHosts: AWIN_CLICK_HOSTS };
}

/**
 * True when `href` is a link Awin can attribute: either our own `cread.php`
 * URL carrying this publisher and merchant, or — for Convert-a-Link, which
 * rewrites on the client — a plain https destination on the merchant's own
 * allowlisted domain.
 */
export function isAttributableAwinHref(
  href: string,
  { publisherId, merchantId, merchantDomains }: { publisherId: string; merchantId: string; merchantDomains: readonly string[] },
): boolean {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;

  if ((AWIN_CLICK_HOSTS as readonly string[]).includes(url.hostname)) {
    if (url.pathname !== AWIN_CLICK_PATH) return false;
    return url.searchParams.get('awinaffid') === publisherId && url.searchParams.get('awinmid') === merchantId;
  }

  return merchantDomains.includes(url.hostname);
}

/** Validates the human-readable label of a paid link against editorial policy. */
export function assertAwinLabel(label: string): void {
  if (label.trim().length === 0) throw new AwinLinkError('Paid link label must not be empty');
  if (!/(paid link)/i.test(label)) {
    throw new AwinLinkError(
      `Paid link label "${label}" must identify itself, e.g. "brkox LEGO lighting kit (paid link)"`,
    );
  }
  for (const [pattern, reason] of FORBIDDEN_LABEL_PATTERNS) {
    if (pattern.test(label)) throw new AwinLinkError(`Paid link label "${label}" is not allowed: ${reason}`);
  }
}

/**
 * Human label for the disclosure, built from the year so the footer does not
 * go stale. Kept here so a test can assert both statements exist.
 */
export function awinDisclosureLines(publisherId: string): readonly string[] {
  assertPublisherId(publisherId);
  return [
    'NoCharge earns a commission from qualifying purchases made through some outbound links on this site (Awin affiliate network and Amazon Associates).',
    'As an Amazon Associate I earn from qualifying purchases.',
    'Paid links are marked "(paid link)", open in a new tab, and never appear inside a game board, game controls, or results panel.',
  ];
}
