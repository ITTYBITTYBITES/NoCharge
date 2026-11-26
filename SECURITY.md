# Security policy

## Reporting a vulnerability

Please email **hello@nocharge.net** with a description, reproduction steps, and affected URL. Do not include player data or run destructive tests against the production site.

## V2 browser-resource baseline

The V2 source and generated output were statically audited for external scripts, frames, network APIs, images, fonts, and stylesheets. The only direct third-party embed is the click-to-load YouTube iframe at `https://www.youtube-nocookie.com/embed/...`; the app does not directly reference `www.youtube.com` or `i.ytimg.com` thumbnails. Analytics, ad, CMP, and affiliate request integrations are inactive in V2. Outbound links are navigations, not embedded resource loads.

The app has inline executable boot scripts and inline style attributes. Any strict CSP must allow the current inline scripts (prefer build-specific hashes) and inline styles, and should allow only the direct YouTube frame host. Recompute script hashes if the generated inline blocks change.

## Response headers and hosting boundary

GitHub Pages does not provide configurable custom response headers through repository files. This repository does not contain or deploy the separate Cloudflare `nocharge-headers` Worker. Do not assume that CSP or other edge headers changed when this site repository is pushed. A live response check during release preparation showed that the current Cloudflare CSP still omits the YouTube frame host; until the Worker is separately updated, the trailer may be blocked.

The separately managed Worker should allow `https://www.youtube-nocookie.com` in `frame-src` for the click-to-load embed and preserve these headers:

```text
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

No Worker edit or deployment is included in this repository release. Verify the active edge policy and response headers independently before treating them as updated.
