/**
 * Central Google AdSense configuration.
 *
 * NoCharge serves exactly one manual, responsive AdSense banner per eligible
 * page (see `src/components/AdSenseBanner.astro`). Google's Privacy & messaging
 * tag (Funding Choices) is the advertising consent management platform: the
 * official AdSense tag reads those choices itself, so this site never builds
 * TCF or GPP strings and never gates ads behind its own consent flag.
 */

/**
 * Master switch for the AdSense banner.
 *
 * Advertising is **off** by default: the site ships with no banner, no ad
 * placeholder, no AdSense tag and no Google Privacy & messaging tag. The
 * component, slot ids and `ads.txt` record are all kept so the banner can be
 * restored by setting `PUBLIC_ADSENSE_ENABLED=true` — no code change needed.
 *
 * When it is `false`:
 *  - `BaseLayout` renders no `<AdSenseBanner />` and loads no Google ad or
 *    consent tag, regardless of a page's `showAds` prop;
 *  - the footer's "Privacy and cookie settings" control is not rendered,
 *    because there is no Google advertising consent message to reopen.
 *
 * See `docs/ADVERTISING_STATE.md`.
 */
export const ADSENSE_ENABLED = import.meta.env.PUBLIC_ADSENSE_ENABLED === 'true';

/** AdSense publisher (client) id. */
export const ADSENSE_PUBLISHER_ID = 'ca-pub-1566091161594729';

/** Bottom responsive ad slot id. */
export const ADSENSE_BOTTOM_SLOT_ID = '6964002740';

/** Official AdSense tag script. */
export const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`;

/** Official Google Privacy & messaging (Funding Choices) message tag. */
export const ADSENSE_CONSENT_TAG_URL =
  'https://fundingchoicesmessages.google.com/i/pub-1566091161594729?ers=1';

/** Exact public/ads.txt line. */
export const ADSENSE_ADS_TXT_LINE = 'google.com, pub-1566091161594729, DIRECT, f08c47fec0942fa0';
