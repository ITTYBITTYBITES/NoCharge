# Security policy and deployment headers

## Reporting a vulnerability

Please email **hello@nocharge.net** with a description, reproduction steps, and affected URL. Do not include player data or run destructive tests against the production site.

## Browser controls in this repository

- Main pages ship a meta Content Security Policy that limits scripts, frames, media, connections, and form submissions to the documented analytics and AdSense origins.
- Advertising is one manual, responsive Google AdSense banner. Its consent is managed by Google's Privacy & messaging (Funding Choices) consent platform, and the official AdSense tag consumes those choices; NoCharge never fabricates TCF or GPP strings.
- The site keeps no custom advertising toggle and no custom ad frames. Google's consent message can be reopened from the footer's "Privacy and cookie settings" control.
- Analytics loads only after analytics consent and is disabled again when consent is withdrawn.
- A strict-origin referrer policy is declared on all pages.

## Browser meta CSP

Every page ships this policy in a `<meta http-equiv="Content-Security-Policy">` element (see `src/layouts/BaseLayout.astro`):

```text
default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://securepubads.g.doubleclick.net https://www.google.com; font-src 'self'; media-src 'self'; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://securepubads.g.doubleclick.net https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com https://www.google.com; frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://fundingchoicesmessages.google.com; form-action 'self'
```

Two differences from the edge policy are deliberate:

- **No `upgrade-insecure-requests`.** WebKit applies the meta directive to plain-HTTP local preview servers too, upgrading `http://localhost` requests to HTTPS and failing the TLS handshake during local e2e runs. The production site is served entirely over HTTPS, so the meta-level upgrade is unnecessary there; the directive is applied only at the edge (below).
- **No `frame-ancestors`.** The directive is ignored in meta elements, so it can only be delivered as an HTTP response header at the edge.

The AdSense and Privacy & messaging origins follow Google's documented CSP guidance for the AdSense tag and the Funding Choices consent tag; do not add broader wildcards.

## Required Cloudflare/edge response headers

GitHub Pages does not provide repository-configurable custom response headers. If the custom domain is placed behind Cloudflare, Netlify, or another configurable edge, apply the following baseline there:

```text
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://securepubads.g.doubleclick.net https://www.google.com; font-src 'self'; media-src 'self'; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://securepubads.g.doubleclick.net https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com https://www.google.com; frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://fundingchoicesmessages.google.com; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
Permissions-Policy: accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cross-Origin-Opener-Policy: same-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

The edge response CSP is the meta policy plus `frame-ancestors 'none'` and `upgrade-insecure-requests`, which are only meaningful as response headers. Keeping them out of the meta policy also keeps plain-HTTP local previews (Playwright, Astro dev) working in WebKit.

**Owner action:** if the deployed domain is served through Cloudflare or another edge, update its CSP (or equivalent) security header with the policy above — repository changes cannot apply HTTP response headers on GitHub Pages.

Before enabling HSTS `includeSubDomains` or submitting to the preload list, confirm every current and future subdomain supports HTTPS. Test the response policy in report-only mode first if ad or analytics providers change.

The remaining `'unsafe-inline'` allowance supports the current small inline boot scripts, the Google consent tag, and Astro-generated style variables. A future hardening pass can move those scripts to static files and use CSP hashes.
