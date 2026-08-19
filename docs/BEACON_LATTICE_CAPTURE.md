# Beacon Lattice gameplay screenshot capture

Real gameplay rasters must come from the mounted game DOM. Do not redraw the UI.

## Command

```bash
npm run build
npm run capture:beacon
```

`npm run art:beacon` writes covers, diagrams, and `source.svg` only. It does not write `screenshot-desktop.webp` or `screenshot-mobile.webp`.

Optional: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` may point at a local Chromium. That path is not committed.

## Route and viewports

| File | Route | Viewport | Output size |
| --- | --- | --- | --- |
| `public/game-art/beacon-lattice/screenshot-desktop.webp` | `/games/beacon-lattice/` | 1440×900 | 1440×900 |
| `public/game-art/beacon-lattice/screenshot-mobile.webp` | `/games/beacon-lattice/` | 390×844 | 720×1280 (cover-resized from the mobile viewport capture) |

## Deterministic state

The capture script uses only the public game UI after mount:

1. Confirm `[data-game-root="beacon-lattice"]` has `is-game-mounted`.
2. Choose **Long plus** (`bl-02-long-plus`) in the puzzle selector.
3. Select the Cross type button.
4. Click **Row 3, column 3**, then **Row 1, column 3**.

That state shows Gap, Exact, and Overlap labels on the live board together with the type buttons and puzzle selector. Production play has no query parameter, global debug object, or placement injection API.

Consent is seeded denied so the capture is not covered by the analytics banner.
