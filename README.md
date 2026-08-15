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
| Ads          | Consent-gated, sandboxed Adsterra banners    |

## Games (v1)

1. **Memory Match** — flip cards, find pairs  
2. **Word Tile Rush** — drag adjacent tiles to spell words  
3. **Color Flip** — tap to change color, stay on matching tiles  

## Guides and articles

Each game has a long-form guide under `/guides/` covering rules, controls, scoring, strategy, accessibility, and local score storage. Focused supporting articles live under `/articles/` and link back to both the relevant game and its definitive guide.

Public trust pages are available at `/about/`, `/terms/`, `/advertising/`, and `/changelog/`.

## Develop

```bash
npm install
npm run dev
```

```bash
npm run check
npm run build
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
  content/articles/  # focused supporting articles
  content/changelog/ # public verified updates
  games/             # per-game TS + CSS + shared helpers
  styles/         # global.css
public/           # favicon, icons, manifest, robots, sound assets
```

## Notes

- Intended for users **13+** (not child-directed).  
- Scores never leave the device.  
- Analytics and ads are blocked until the visitor allows their separate consent categories.
- With analytics consent, GA loads only in production and requests `anonymize_ip`.
- Adsterra documents run in sandboxed iframes without same-origin or top-navigation access.
- The configured Smartlink is a sponsored no-fill fallback and never loads before advertising consent.
- Responsive banner units load only when their breakpoint is visible.
- `npm run test:e2e:matrix` enables the cross-browser Playwright matrix; see `docs/CI_BROWSER_MATRIX.md` for CI activation status.
- `npm run lighthouse` audits the production build with optional advertising denied; see `docs/CI_LIGHTHOUSE.md`.
- `/health.json` and `scripts/check-production.mjs` prepare privacy-safe uptime checks. Scheduled monitoring is not active until the owner configures it; see `docs/CI_UPTIME.md`.
