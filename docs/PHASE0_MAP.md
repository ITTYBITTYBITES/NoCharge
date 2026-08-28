# Phase 0 discovery map — NoCharge (2026-08-27)

Working note for the expansion program. Re-verify before trusting; the live site is the source of truth for published state, the repo for build state.

## 0.1 Live-site verification

Fetched `https://nocharge.net/` (home), `/sitemap.xml`, `/arcade/`, `/guides/`, `/articles/`, `/collections/`, `/setup/`, `/tools/`, `/media/`, one solo game page (`/games/memory-match/`) and its guide (`/guides/memory-match/`), one Pass & Play game page (`/games/tic-tac-toe/` verified in sitemap; same shell), and `/llms.txt`.

| Check | Result |
|---|---|
| Homepage | Live; "17 browser games", 6 Pass & Play, Recently Played module |
| Sitemap | Single `sitemap.xml` with all games, guides, articles, 210 setup pages, collections, trust pages, 3 tools |
| `/arcade/` | Two sections (solo + Pass & Play); **no filters/sort/chips**, no related-games module |
| `/guides/` | 17 guides, one per game |
| `/articles/` | 26 articles (platform + game notes) |
| `/collections/` | 6 collections with inclusion methods |
| `/setup/` | 210 guides across 7 topics (keyboards, pointing-devices, screens-and-stands, desk-and-comfort, offline-puzzles, audio, lighting) |
| `/tools/` | 3 tools: Game Discovery Wheel, Ambient Mixer, Browser Zoom Viewport Calculator — **no categories** |
| `/media/` | Exists: brand downloads, social cards, press facts |
| `/daily/` | Not found (404) |
| `/learn/` | Not found (404) |
| `/llms.txt`, `/llms-full.txt` | Not found (404) |
| Registry facts page | Not found (404) |
| Tools in primary nav | **No** (footer only) |

## 0.2 Repo map

Stack: Astro 7 static (`output: 'static'`, directory format), TypeScript, vanilla TS games (canvas/DOM), plain CSS, `localStorage`, consent-gated GA4 + AdSense.

| Concern | Location |
|---|---|
| Content collections (source of truth for published content) | `src/content/{games,guides,articles,collections,setup,changelog}/*.md`; zod schemas in `src/content.config.ts` |
| Game *metadata* fields | `src/content/games/*.md` frontmatter (`genre`, `session` as string, `tier`, `runtime`, `presentation.controls`, `artwork`) |
| Game *mount* registry (runtime) | `src/games/registry.ts` (slug → `mount(root)`) |
| Pass & Play list | `src/games/shared/pass-play.ts` (`PASS_PLAY_GAME_IDS`) |
| Discovery data derivation | `src/pages/tools/discovery-wheel.astro` **derives** input/pressure from frontmatter text + hardcoded ids — the gap A1 fixes |
| Shared game shell | `src/components/GameShell.astro` + `src/games/shared/shell.ts` (pause on hide, mute, ambient, fullscreen/Game Mode, restart, live status) |
| Shared helpers | `src/games/shared/` — `storage.ts` (score/pref keys), `pass-play.ts`, `recently-played.ts`, `audio/*`, `solitaire/*`, `grid/*`, `pause-recovery.ts`, `shell-menu.ts` |
| Storage key allowlist / clear-data | `src/lib/local-game-data.ts` (`nocharge:*` prefix); Privacy page renders it |
| Local dashboard | `src/pages/my-arcade.astro` + `src/lib/my-arcade/*` |
| SEO head + JSON-LD | `src/components/SeoHead.astro`; per-page schema arrays (VideoGame/FAQPage on games, SoftwareApplication on tools, ItemList on collections) |
| Sitemap | `src/pages/sitemap.xml.ts` (static list + collections; generated at build) |
| Nav | `src/components/Header.astro` (Arcade/Guides/Articles/Setup; **Tools absent**) |
| Art pipeline | `public/game-art/{slug}/`; generators in `scripts/generate-*-art.mjs` + `generate-game-pins.mjs`; `GameArtwork.astro` |
| Tests | `vitest` unit (`npm run test:unit`), Playwright e2e (`npm run test:e2e`), `@axe-core/playwright` a11y smoke |
| Validators in build | `npm run verify:build`: html-validate, internal links, sitemap, structured data, FAQ schema, asset budget, setup policy, feeds, brand, media kit, favicons |
| Deploy/preview | `astro dev --host 0.0.0.0`, `astro build`, `astro preview`; site served statically (Cloudflare per `docs/CLOUDFLARE_OWNER_CHECKLIST.md`) |

### How a game is added (current path)

1. `src/games/{slug}/` — `engine.ts` (pure rules), `main.ts` (mount + UI), `styles.css`, `*.test.ts`.
2. `src/content/games/{slug}.md` — metadata; **must add slug to `gameIds` enum** in `src/content.config.ts`.
3. `src/games/registry.ts` — `{ slug: { mount } }`.
4. Art: `public/game-art/{slug}/` (cover square/landscape, guide header, social card, diagrams, pin) + `public/game-assets/` if needed.
5. `src/content/guides/{slug}.md`, ≥1 `src/content/articles/{slug}.md` (kind `game`), collection membership updates.
6. Sitemap picks up automatically from content collections.

## 0.3 Baseline metrics (first-party, honest)

Measured from repo + live content on 2026-08-27:

| Metric | Value | Note |
|---|---|---|
| Games | 26 | 14 solo + 12 Pass & Play at this review (2026-08-27) |
| Guides | 26 | 1 per game |
| Articles | 47 | game notes + platform/trust explainers |
| Collections | 11 | all with inclusion methods |
| Setup guides | 210 | 7 topics |
| Tools | 15 | 5 categories, shared template |
| Changelog entries | 12 | |
| % games with verified complete keyboard path | 23/26 (88%) via `hasKeyboardComplete` | Pass the Picture excluded (pointer-only core) |
| % untimed by default or with untimed mode | 16/17 (94%) | Word Tile Rush timed-only; Color Flip has both |
| Median documented session upper bound | 8 min | max() of listed ranges across games |
| Last registry review | 2026-08-27 | set when inventory written |

## 0.4 Key findings / decisions before building

1. **Single source of truth gap (A1).** Discovery Wheel hand-derives `input` from prose and hardcodes `pressure`. Build a typed catalog helper over structured frontmatter and route Arcade, Discovery Wheel, related-games, facts, Game Finder, and Daily through it.
2. **Storage keys are already centralized** (`local-game-data.ts`) and Privacy renders them. New games must extend this allowlist (A10).
3. **Tools IA is flat and Tools is not in primary nav** (A5). Add categories: Play · Audio · Accessibility · Setup helpers · Learning, plus a header link.
4. **llms.txt is 404** (A2/A3). Static files in `public/` are the right mechanism.
5. **No `/daily/` shell** (A7). Build as a static hub page; dailies link out to date-seeded games once they ship.
6. **/setup/ has topic data** (`topic` + `topics` fields) — pillar pages can be generated/strengthened without new content pipelines (E4).
7. **No service worker** in the repo → "offline-after-load" collection is **not claimed** (honest `wontfix` unless SW is added deliberately). Browser HTTP cache alone is not offline support.
8. **Games already live** (no work): Memory Match, Word Tile Rush, Color Flip, Beacon Lattice, Klondike, FreeCell, Nonogram, Twenty Forty-Eight, Tile Garden, Word Search, Mini Sudoku 6×6, Tic-Tac-Toe, Dots & Boxes, Four in a Row, Reversi, Last Token, Pass the Picture.
