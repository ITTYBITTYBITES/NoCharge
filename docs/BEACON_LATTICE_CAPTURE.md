# Beacon Lattice gameplay screenshot capture

Committed rasters are captures of the mounted game DOM (`[data-game-viewport]`), not reconstructed artwork.

## Command

```bash
npm run build
npm run capture:beacon
```

`npm run art:beacon` writes covers, diagrams, and `source.svg` only. It does not create or overwrite `screenshot-desktop.webp` or `screenshot-mobile.webp`.

Optional: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` may point at a local Chromium. That path is not committed.

These files were last produced from GitHub Actions Chromium on commit `563681d` (run https://github.com/ITTYBITTYBITES/NoCharge/actions/runs/32267723566): the capture test opened the built preview of `/games/beacon-lattice/`, confirmed `is-game-mounted`, staged Long plus through the public UI, waited for `document.fonts.ready`, disabled animations for the screenshot, and captured `[data-game-viewport]`.

## Route, browser, and viewports

| File | Route | Browser | Viewport | Captured region | Native capture | Final file |
| --- | --- | --- | --- | --- | ---: | ---: |
| `public/game-art/beacon-lattice/screenshot-desktop.webp` | `/games/beacon-lattice/` | Playwright Chromium | 1440×900 | `[data-game-viewport]` | 1152×648 | 1440×900 |
| `public/game-art/beacon-lattice/screenshot-mobile.webp` | `/games/beacon-lattice/` | Playwright Chromium | 390×844 | `[data-game-viewport]` | 370×788 | 720×1280 |

The native sizes are the laid-out game region inside the viewport, not a stretched window.

## Fitting into the asset convention

Other Quiet Arcade screenshots use 1440×900 desktop and 720×1280 mobile. Beacon captures keep aspect ratio:

```bash
sharp(desktopCapture).resize(1440, 900, { fit: 'contain', background: '#101210' }).webp({ quality: 80 })
sharp(mobileCapture).resize(720, 1280, { fit: 'contain', background: '#101210' }).webp({ quality: 80 })
```

`contain` scales proportionally and pads. It does not stretch. The 390×844 session is not cover-cropped; unused bands stay the page background.

## Public UI state

1. Confirm `[data-game-root="beacon-lattice"]` has `is-game-mounted`.
2. Choose **Long plus** (`bl-02-long-plus`) in the puzzle selector.
3. Select Cross.
4. Click **Row 3, column 3**, then **Row 1, column 3**.

The board then shows Gap, Exact, and Overlap together with the type control and selector. Production play has no query parameter, global debug object, or placement injection API.

Consent is seeded denied so the analytics banner is not in the frame.
