/**
 * Shared no-index / alias route policy.
 *
 * Both the sitemap generator validator and the production uptime check must
 * agree on this list. Routes here are intentionally absent from sitemap.xml
 * (no-index or alias pages), but may still be served and HTTP-checked.
 */
export const NOINDEX_ROUTES = Object.freeze(['/my-arcade/', '/changelog/', '/privacy-policy/', '/404.html']);
