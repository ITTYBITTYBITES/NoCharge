# The 2-Second Witness — original identity artwork (archived)

This directory contains an original vector-art set created for NOCHARGE V2 Phase 5B-2 on 2026-11-16. The artwork is a NoCharge interpretation scoped to this app; it is not copied from, traced from, or derived from the Google Play or itch.io listing art, screenshots, icons, typography, or branding. The current `/experiences/twosecondwitness/` page is a static app showcase and does not display these illustrations or reproduce the game. The files are retained for provenance and asset-integrity audits only.

## Attribution and factual references

- **Art attribution:** Original SVG illustrations authored for this project on 2026-11-16. No external artwork, image library, font file, logo, or raster reference was used. Source and runtime derivative IDs are recorded in `assets/manifest.csv`.
- **Factual review only:** The Play Store and itch.io pages were consulted solely to verify mechanics, development/platform labels, and outbound destinations. Their prose and visual materials were not reused.
- **Verified destinations:** Google Play — `https://play.google.com/store/apps/details?id=com.ittybittybites.the2secondwitness`; itch.io — `https://ittybittybites.itch.io/2-second-witness`; product site — `https://twosecondwitness.nocharge.net/`.
- **Scope:** `/experiences/twosecondwitness/` only. This set is not a NoCharge brand mark, shared icon, experience-directory thumbnail, Arcade asset, Tool asset, or Shop asset.
- **Archived source:** `src/assets/twoSecondWitnessIdentityRegistry.ts` keeps the manifest-listed optimized SVGs in an isolated registry for provenance and tests. The published static showcase does not load the registry, `TwoSecondWitnessPreview`, or any local gameplay module.
- **Safety and accessibility:** Theme/event colors use V2 tokens; SVGs have no scripts, linked resources, embedded content, fixed hex colors, external fonts, or raster images. Illustrations are decorative and paired with visible text labels. Asset and browser checks cover registry integrity, contrast, and overflow.

## Inventory

| Source ID | Runtime ID | Artwork | Dimensions | Archived concept |
| --- | --- | --- | --- | --- |
| `NC-2SW-01` | `NC-2SW-01-OPT` | `witness-emblem.svg` | 180 × 180 | Decorative observation emblem |
| `NC-2SW-02` | `NC-2SW-02-OPT` | `street-corner.svg` | 720 × 320 | Street-corner observation scene |
| `NC-2SW-03` | `NC-2SW-03-OPT` | `diner-counter.svg` | 720 × 320 | Diner-counter observation scene |
| `NC-2SW-04` | `NC-2SW-04-OPT` | `transit-platform.svg` | 720 × 320 | Transit-platform observation scene |
| `NC-2SW-05` | `NC-2SW-05-OPT` | `study-desk.svg` | 720 × 320 | Study-desk observation scene |
| `NC-2SW-06` | `NC-2SW-06-OPT` | `prop-umbrella.svg` | 96 × 96 | Local scene prop |
| `NC-2SW-07` | `NC-2SW-07-OPT` | `prop-bus.svg` | 96 × 96 | Local scene prop |
| `NC-2SW-08` | `NC-2SW-08-OPT` | `prop-mug.svg` | 96 × 96 | Local scene prop |
| `NC-2SW-09` | `NC-2SW-09-OPT` | `prop-suitcase.svg` | 96 × 96 | Local scene prop |
| `NC-2SW-10` | `NC-2SW-10-OPT` | `prop-ticket.svg` | 96 × 96 | Local scene prop |
| `NC-2SW-11` | `NC-2SW-11-OPT` | `prop-scarf.svg` | 96 × 96 | Local scene prop |
| `NC-2SW-12` | `NC-2SW-12-OPT` | `prop-book.svg` | 96 × 96 | Local scene prop |
| `NC-2SW-13` | `NC-2SW-13-OPT` | `prop-lamp.svg` | 96 × 96 | Local scene prop |
| `NC-2SW-14` | `NC-2SW-14-OPT` | `prop-plant.svg` | 96 × 96 | Local scene prop |
| `NC-2SW-15` | `NC-2SW-15-OPT` | `prop-clock.svg` | 96 × 96 | Local scene prop |

Each source has an adjacent lossless whitespace-minified derivative in `optimized/`. Both files, IDs, and the current non-integration status are listed in the canonical V2 manifest. Runtime IDs use the `-OPT` suffix; source artwork remains immutable for attribution and audit, and neither version is bundled into the static showcase.
