# Security policy and deployment headers

## Reporting a vulnerability

Please email **hello@nocharge.net** with a description, reproduction steps, and affected URL. Do not include player data or run destructive tests against the production site.

## Browser controls in this repository

- Main pages ship a meta Content Security Policy that limits scripts, frames, media, connections, and form submissions.
- Third-party advertisements load only after advertising consent.
- Ad documents run in sandboxed iframes without `allow-same-origin` or top-navigation permission.
- Ad host documents have a separate restrictive CSP and are excluded from indexing.
- Analytics loads only after analytics consent and is disabled again when consent is withdrawn.
- A strict-origin referrer policy is declared on normal and ad pages.

## Required edge response headers

GitHub Pages does not provide repository-configurable custom response headers. Meta CSP protects document-loaded resources, but some directives and headers work only as HTTP response headers. If the custom domain is placed behind Cloudflare, Netlify, or another configurable edge, apply the following baseline there:

```text
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com; font-src 'self'; media-src 'self'; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com; frame-src 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
Permissions-Policy: accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cross-Origin-Opener-Policy: same-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

Before enabling HSTS `includeSubDomains` or submitting to the preload list, confirm every current and future subdomain supports HTTPS. Test the response policy in report-only mode first if ad or analytics providers change.

The remaining `'unsafe-inline'` allowance supports the current small inline boot scripts and Astro-generated style variables. A future hardening pass can move those scripts to static files and use CSP hashes.
