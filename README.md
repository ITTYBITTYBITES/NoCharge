# NoCharge

> Quick games. Clear guides. No clutter.

A growing collection of browser games and practical player guides built with **Astro** (static-first). No accounts, no database, no tracking maze.

**Live:** [nocharge.net](https://nocharge.net)

## Stack

| Layer        | Choice                                      |
| ------------ | ------------------------------------------- |
| Framework    | Astro (static HTML)                         |
| Language     | TypeScript                                  |
| Games        | Canvas + DOM (vanilla)                      |
| Styling      | Plain CSS (“Quiet Arcade”)                  |
| Storage      | `localStorage`                              |
| Analytics    | GA4 (`G-GYQ8TEM6DS`), consent-gated          |
| Ads          | One manual, responsive Google AdSense banner; consent via Google Privacy & messaging |

## Games

NoCharge currently publishes 26 games:

- **Solo:** Memory Match, Word Tile Rush, Color Flip, Beacon Lattice, Klondike, FreeCell, Nonogram, Twenty Forty-Eight, Tile Garden, Word Search, Mini Sudoku, Minesweeper, Hangman, Lights Out, Simon, Sudoku 9×9, and Word Loom.
- **Pass & Play:** Tic-Tac-Toe, Dots & Boxes, Four in a Row, Reversi, Last Token, Pass the Picture, Gomoku, Nine Men's Morris, and Checkers.

## Guides and articles

Each game has a long-form guide under `/guides/` covering rules, controls, scoring, strategy, accessibility, and local score storage. `/articles/` contains both game-specific notes and platform explainers without fake game associations. Reviewed, metadata-driven game groupings live under `/collections/`.

Editorial rules and source-of-truth review ownership are documented in `docs/EDITORIAL_STANDARDS.md` and `docs/CONTENT_ACCURACY_MATRIX.md`. Public trust pages are available at `/about/`, `/privacy/`, `/terms/`, `/advertising/`, `/accessibility/`, and `/changelog/`.

## Develop

```bash
npm install
npm run dev
```

```bash
npm run audit:content
npm run check
npm run build
npm run verify:build
npm run test:e2e
npm run test:e2e:matrix
npm run lighthouse
npm run preview
```

## Project layout

```text
src/
  components/     # Navigation, cards, game shell, consent, SEO
  layouts/        # BaseLayout
  pages/             # home, arcade, guides, articles, games, trust pages
  content/games/     # game metadata and descriptions
  content/guides/    # long-form player guides
  content/articles/  # game-specific and platform articles
  content/collections/ # reviewed curated collections
  content/changelog/ # public verified updates
  games/             # per-game TS + CSS + shared helpers
  styles/         # global.css
public/           # favicon, icons, manifest, robots, sound assets
```

## Notes

- NoCharge is a general-audience website and is not directed to children.
- Scores never leave the device.
- Analytics stays blocked until the visitor allows it.
- With analytics consent, GA loads only in production and requests `anonymize_ip`.
- Eligible pages show exactly one manual, responsive Google AdSense banner, labeled “Advertisement”, before the footer. Auto ads, interstitials, anchors, popups, and Smartlink fallbacks are off, and ads never appear over gameplay.
- Advertising consent is handled by Google's Privacy & messaging consent message; the official AdSense tag consumes those choices. The footer's “Privacy and cookie settings” control reopens Google's message.
- `npm run test:e2e:matrix` enables the cross-browser Playwright matrix; see `docs/CI_BROWSER_MATRIX.md` for CI activation status.
- `npm run lighthouse` audits the production build with optional analytics denied; see `docs/CI_LIGHTHOUSE.md`.
- `/health.json` and `scripts/check-production.mjs` prepare privacy-safe uptime checks. Scheduled monitoring is not active until the owner configures it; see `docs/CI_UPTIME.md`.
