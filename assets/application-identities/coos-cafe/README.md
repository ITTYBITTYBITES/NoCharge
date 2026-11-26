# Coo’s Joint application identity artwork (archived)

This directory contains an original, hand-authored café/barista vignette created for NOCHARGE V2 Phase 5B-1. It is NoCharge artwork, not a screenshot, trace, icon, or promotional asset from Google Play or itch.io. The current `/experiences/coosjoint/` route is a static app showcase and does not display this artwork or a local gameplay demo. The source and optimized derivative are retained for attribution and asset-integrity audits only.

- **Source:** `source/coos-joint-shift-vignette.svg`
- **Optimized runtime derivative:** `optimized/coos-joint-shift-vignette.svg`
- **Manifest IDs:** `NC-CJ-01` and `NC-CJ-01-OPT` in `assets/manifest.csv`
- **Attribution:** Original vector artwork authored for this project on 2026-11-16; no external art, font, or reference asset used.
- **Archived source:** `src/assets/experienceIdentityRegistry.ts` keeps the optimized SVG isolated for provenance and asset tests. The published static showcase does not import this registry, render the image, or load `CoffeeIdlePreview`.
- **Scope:** `/experiences/coosjoint/` attribution only. Not a current showcase image, store icon, product listing image, directory-card asset, general NoCharge brand mark, or Shop asset.
- **Safety:** No scripts, remote references, embedded content, external fonts, raster images, or network requests. Asset and rendering checks are part of `npm run test:assets` and `npm run test:assets-browser`.
