# Sound redesign baseline — 2026-08-27

This baseline was recorded before changing the ambient implementation on `arena/01a0447e-nocharge`, checked out at merge commit `fe55c4689712a9f2e0e8fd2efdcd16c838ee6d5e` (PR #35).

## Automated baseline

- `npm ci`: passed; 650 packages installed, 0 reported vulnerabilities.
- `npm run test:unit`: passed — 36 test files, 412 tests.
- `npm run build`: passed — Astro built 298 pages and every existing build, HTML, link, sitemap, structured-data, FAQ, content, feed, brand, media, asset, and favicon validation passed.
- `npx playwright test tests/e2e/tools.spec.ts tests/e2e/sound-events.spec.ts --project=chromium`: could not execute because the Playwright Chromium executable was not installed. `npx playwright install chromium` was attempted and was blocked by repeated `ECONNRESET` failures while downloading Chrome for Testing. No browser assertions were therefore observed in the baseline.

## Audited implementation findings

The previous ambient path created a single mono `AudioBuffer`, populated it synchronously on the main thread, set `source.loop = true`, and repeated it for 3–8 seconds. Rain, forest, fireplace, ocean, night, cafe, and library were all baked into that short buffer. Lofi used a random note timer and drone used two static sine oscillators. A generated random impulse buffer was used as reverb. Ambient and effects also used separate direct-to-destination graphs.

The redesign must retain the `nocharge:pref:ambient-sound` storage key and the existing game-data clearing allowlist while replacing those looping buffers and musical/drone shortcuts with continuously generated procedural voices, lifecycle-safe buses, crossfades, and an AudioWorklet-first noise path.
