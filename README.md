# NoCharge

> Simple games. Fast load. Real players. No bloat.

A small collection of browser games built with **Astro** (static-first). No accounts, no database, no tracking maze.

**Live:** [nocharge.net](https://nocharge.net)

## Stack

| Layer        | Choice                                      |
| ------------ | ------------------------------------------- |
| Framework    | Astro (static HTML)                         |
| Language     | TypeScript                                  |
| Games        | Canvas + DOM (vanilla)                      |
| Styling      | Plain CSS (“Quiet Arcade”)                  |
| Storage      | `localStorage`                              |
| Analytics    | GA4 (`G-GYQ8TEM6DS`), delayed + anonymized  |
| Ads          | Adsterra banners only (non-intrusive)       |

## Games (v1)

1. **Memory Match** — flip cards, find pairs  
2. **Word Tile Rush** — drag adjacent tiles to spell words  
3. **Color Flip** — tap to change color, stay on matching tiles  

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## Project layout

```text
src/
  components/     # Header, Footer, GameCard, GameShell, SeoHead
  layouts/        # BaseLayout
  pages/          # index, privacy, games/[slug]
  content/games/  # markdown metadata per game
  games/          # per-game TS + CSS + shared helpers
  styles/         # global.css
public/           # favicon, icons, manifest, robots, sound assets
```

## Notes

- Intended for users **13+** (not child-directed).  
- Scores never leave the device.  
- GA loads only in production, after 2s, with `anonymize_ip`.  
- Banner ad slots are placeholders until Adsterra creatives are pasted in.
