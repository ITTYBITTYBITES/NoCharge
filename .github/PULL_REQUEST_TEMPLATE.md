## Checklist

- [ ] `npm run check` passes (unit tests + `astro check`)
- [ ] `npm run build` passes
- [ ] Browser tests pass (`npx playwright test --project=chromium`)
- [ ] **If game-art generators or rasters changed:** regenerated with the matching `art:*` script, and a reviewer **opened the regenerated rasters in a browser**. Vector source diffs alone are not sufficient — a generator bug can produce valid SVG that renders wrong (clipped, mis-centred, or placeholder text).
- [ ] **If `scripts/art-sources/` changed:** re-ran the generator(s) so the committed canonical SVGs match; the CI art-drift check passes.
- [ ] **If storage keys changed** (`src/games/**`, `src/lib/local-game-data.ts`): updated `docs/MY_ARCADE_DATA_MODEL.md`, the My Arcade clear-all key list and its tests, and the "How NoCharge saves scores without an account" article.
- [ ] Game-count copy checked against the game registry (About, Media, Accessibility, changelog, and any article that names the catalog).
