# Cloudflare owner checklist

Repository code cannot apply Cloudflare dashboard settings. Every item below is an **owner action** and remains unconfirmed until the owner records evidence. Do not put account IDs, tokens, API keys, or private DNS verification values in this repository.

## Before changing traffic or headers

- [ ] In **DNS**, confirm website records used by `nocharge.net` and `www` are proxied where appropriate (orange cloud).
- [ ] Identify mail routing records first. Preserve MX records and mail-related TXT/CNAME records exactly; do not proxy records that the email provider requires to remain DNS-only.
- [ ] In **Web Analytics** and any performance/observability injection setting, disable Cloudflare Web Analytics/RUM script injection. Confirm page source and the Network panel contain no unexpected Beacon/RUM script.

## Baseline response headers

- [ ] Add `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, the documented `Permissions-Policy`, `X-Frame-Options: DENY`, and `Cross-Origin-Opener-Policy: same-origin` through a response-header rule.
- [ ] Copy the current edge CSP from [`SECURITY.md`](../SECURITY.md), including the narrowly scoped `https://*.adtrafficquality.google` connection endpoint.
- [ ] Apply that policy as **Content-Security-Policy-Report-Only** first. Collect and review reports; do not weaken directives broadly to silence one request.
- [ ] Test games, the Google Privacy & messaging flow, the AdSense slot without clicking it, and analytics both denied and allowed. Confirm gameplay, fonts, artwork, audio, and full screen still work.
- [ ] Enforce `Content-Security-Policy` only after the report-only review has no unexplained required-resource blocks.
- [ ] Do **not** enable Cross-Origin-Embedder-Policy (COEP): third-party advertising and consent frames are not designed for that isolation requirement.

## HSTS safety

- [ ] Begin with a conservative HSTS `max-age` only after HTTPS and redirects are stable.
- [ ] Delay `includeSubDomains` until every present and future subdomain, including mail-related web endpoints, is confirmed HTTPS-safe.
- [ ] Delay preload until the owner understands the long-lived browser-list commitment and all preload requirements are continuously met. Do not submit merely because an example header contains `preload`.

## Deployment verification

- [ ] After a deployment, use **Caching → Configuration → Purge Cache**. Prefer purging only changed URLs; use purge-everything only when a broad stale deployment requires it.
- [ ] Open `https://nocharge.net/ads.txt` directly and confirm the one expected public line remains reachable as plain text.
- [ ] In browser developer tools, inspect the main document under **Network → Headers**. Confirm the CSP and baseline response headers are response headers, not only the repository’s meta CSP.
- [ ] Check Console and Network while testing AdSense, CMP, analytics consent transitions, all four games, platform articles, and collections. Do not click live advertisements.
- [ ] Recheck DNS and mail delivery after any DNS edit.

Record the date, tester, affected Cloudflare rule names, and non-sensitive evidence in an owner-controlled change record. This checklist does not claim any dashboard setting has been applied.
