# ProfiVue listing imagery provenance

**Scope:** `/experiences/profivue/` on NoCharge only.

## Product identity and source

- Publisher/developer shown by the exact public listing: ITTYBITTYBITES.
- Application package: `com.ittybittybites.profivue`.
- Source listing reviewed: `https://play.google.com/store/apps/details?id=com.ittybittybites.profivue&hl=en_US`.
- Source images are locally stored copies of publisher-supplied images from the listing image host. They are not hotlinked at runtime.
- Attribution: **ProfiVue screenshots and product imagery are publisher-supplied materials from the ITTYBITTYBITES ProfiVue listing.** NoCharge uses these materials only to identify and describe the product on its editorial ProfiVue page. NoCharge is not the publisher.

| Manifest source ID | Local source | Publisher image URL | Runtime derivative |
| --- | --- | --- | --- |
| `NC-PV-01` | `source/profivue-before-buy.png` | `https://play-lh.googleusercontent.com/Yait9hbSaaC0b3RsvN6inMeMDhGT0VvO0YILK5ajVCfd_anLMmKtTBqeN-5nkJCcyV4n619G3_p4SSzNZb_KaQ=s0` | `NC-PV-01-OPT` · `optimized/profivue-before-buy.webp` |
| `NC-PV-02` | `source/profivue-cost-breakdown.png` | `https://play-lh.googleusercontent.com/k-Bzl7OotQj54kAjuH-Phs254C6S8Jfzomz2l0pmngJDS4ohyAHq0ne3tr8tRZ3a7McHIBGWJnL5FxtXl9UMsA=s0` | `NC-PV-02-OPT` · `optimized/profivue-cost-breakdown.webp` |
| `NC-PV-03` | `source/profivue-marketplace-profiles.png` | `https://play-lh.googleusercontent.com/GLjRqrNh7IhzbqpT9tfvp8rcs0-ePSiaeiH4qoD6wyPdO_OfETf1K2I3cOnM-5hQRbCPPISdI6nKdKV-a7Co=s0` | `NC-PV-03-OPT` · `optimized/profivue-marketplace-profiles.webp` |

## Derivative and delivery notes

Each PNG source is retained unchanged as a provenance record. Its runtime `.webp` derivative is a lossless RGB WebP conversion at the original 768×1376 dimensions. Decoding both versions to RGB produced a pixel-for-pixel match; there is no crop, retouch, overlay, or added product content. The conversion reduces transfer size while preserving every pixel. Both source and derivative, their byte sizes, provenance, and exact route scope are registered in `assets/manifest.csv`.

The manifest-listed derivative is mirrored byte-for-byte under `public/assets/application-identities/profivue/optimized/` so prerendered HTML and client navigation share a stable same-origin URL. The page renders it as a native image with `loading="lazy"` and `decoding="async"`; no remote image request is made. Do not use these files as shared NoCharge branding or on other application routes.

## Editorial verification boundary

The page copy summarizes claims in the product description and release notes visible on the public listing reviewed on 2026-11-16. Those statements, product screens, current fee assumptions, tax reserve behavior, export/backup behavior, marketplace coverage, platform availability, and privacy disclosures have not been independently tested. Treat them as publisher claims; verify each item with ITTYBITTYBITES before presenting it as confirmed product behavior.
