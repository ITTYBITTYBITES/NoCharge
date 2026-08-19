# Beacon Lattice gameplay screenshot capture

Real gameplay rasters must come from the mounted game DOM. Do not redraw the UI.

## Command

```bash
npm run build
npm run capture:beacon
```

`npm run art:beacon` writes covers, diagrams, and `source.svg` only. It does not write `screenshot-desktop.webp` or `screenshot-mobile.webp`.

## Route and viewports

| File | Route | Viewport | Output size |
| --- | --- | --- | --- |
| `public/game-art/beacon-lattice/screenshot-desktop.webp` | `/games/beacon-lattice/` | 1440×900 | 1440×900 |
| `public/game-art/beacon-lattice/screenshot-mobile.webp` | `/games/beacon-lattice/` | 390×844 | 720×1280 (cover-resized from the mobile viewport capture) |

## Deterministic state

The capture script uses the test-only `window.__NOCHARGE_BEACON_LATTICE_TEST__` seam after the game mounts:

1. `loadPuzzle('bl-02-long-plus')`
2. `applyPlacements([{ x: 2, y: 2, type: 'cross' }, { x: 2, y: 0, type: 'cross' }])`

That state shows Gap, Exact, and Overlap labels on the live board together with the type buttons and puzzle selector. The seam is not used by production play.

Consent is seeded denied so the capture is not covered by the analytics banner.
