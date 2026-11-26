# RideSide listing imagery provenance

**Scope:** `/experiences/rideside/` on NoCharge only.

## Product identity and source

- Publisher/developer shown by the exact public listing: ITTYBITTYBITES.
- Application package: `com.ittybittybites.rideside`.
- Source listing reviewed: `https://play.google.com/store/apps/details?id=com.ittybittybites.rideside&hl=en_US`.
- Source images are locally stored copies of publisher-supplied images from the listing image host. They are not hotlinked at runtime.
- Attribution: **RideSide screenshots and product imagery are publisher-supplied materials from the ITTYBITTYBITES RideSide listing.** NoCharge uses these materials only to identify and describe the product on its editorial RideSide page. NoCharge is not the publisher.

| Manifest source ID | Local source | Publisher image URL | Runtime derivative |
| --- | --- | --- | --- |
| `NC-RS-01` | `source/rideside-trip-memory-card.png` | `https://play-lh.googleusercontent.com/wuGrgFooUTDPEaNf49NaeAEcHsYujKT4MB5ZUU6in0gLF7A5_83Du9X6v_qlJ3Lgk2eMX-xC0VF43u9Wk0Gkh9k=s0` | `NC-RS-01-OPT` · `optimized/rideside-trip-memory-card.webp` |
| `NC-RS-02` | `source/rideside-watercraft-checklist.png` | `https://play-lh.googleusercontent.com/EbAqbuQ-UwAKc70H9DxKTSNUFn8yD7vAajehfb3czBsvExt65H2PBNtUXRg3Du5hzNcI78La51wLHS2BZY7sRw=s0` | `NC-RS-02-OPT` · `optimized/rideside-watercraft-checklist.webp` |

## Derivative and delivery notes

Each PNG source is retained unchanged as a provenance record. Its runtime `.webp` derivative is a lossless RGB WebP conversion at the original 768×1376 dimensions. Decoding both versions to RGB produced a pixel-for-pixel match; there is no crop, retouch, overlay, or added product content. The conversion reduces transfer size while preserving every pixel. Both source and derivative, their byte sizes, provenance, and exact route scope are registered in `assets/manifest.csv`.

The manifest-listed derivative is mirrored byte-for-byte under `public/assets/application-identities/rideside/optimized/` so prerendered HTML and client navigation share a stable same-origin URL. The page renders it as a native image with `loading="lazy"` and `decoding="async"`; no remote image request is made. Do not use these files as shared NoCharge branding or on other application routes.

## Editorial verification boundary

The page copy summarizes claims in the product description and data-safety declaration visible on the public listing reviewed on 2026-11-16. Checklist/template behavior, watercraft records, weather-source coverage and freshness, offline behavior, account requirements, data storage, identifier collection/sharing, deletion, backup, and privacy behavior have not been independently tested. Treat all those details as publisher statements; verify them with ITTYBITTYBITES before presenting them as confirmed product behavior.
