# IMPLEMENTATION_STATUS.md

Source of truth for the NoCharge expansion program. One row per backlog item.
Columns: **Item | Proposed | Live URL or — | In repo | Status (missing/partial/done/wontfix) | Blockers | Notes**

- Last registry review: **2026-08-27** (this update)
- Status legend: `done` ships the full Definition of Done · `partial` ships part of it · `missing` not started · `wontfix` deliberately out of scope (reason in Notes or DECISIONS_NEEDED.md).
- Update this file every time a catalog change lands. Re-check each row after every major merge.

---

## Band A — Foundation

| Item | Proposed | Live URL or — | In repo | Status | Blockers | Notes |
|---|---|---|---|---|---|---|
| A1 Game registry completeness | structured catalog driving Arcade, Wheel, related games, facts, Finder, planner, Daily | — | `src/lib/game-catalog.ts` + `src/lib/game-catalog.test.ts` | done | none | sessionMin/Max parsed from labels; players/inputs/pressure/originality/dates/storage keys/keyboard flag; validation test ensures no stale drift |
| A2 `/llms.txt` | llmstxt.org format | `/llms.txt` | `src/pages/llms.txt.ts` | done | none | Build-time; auto-lists games, guides, collections, tools, articles, hubs |
| A3 `/llms-full.txt` | long-form curated dump | `/llms-full.txt` | `src/pages/llms-full.txt.ts` | done | none | Brand definition, free-model FAQ, registry facts, one-line game list |
| A4 Machine/SEO hygiene | JSON-LD + anchors | — | SeoHead + schemas | done | none | VideoGame/FAQPage on games, WebApplication on tools, ItemList on collections, DefinedTermSet on glossary; anchors `#controls`, `#faq`, `#guide-faq` |
| A5 Tools hub IA | categories + nav + shared template | `/tools/` | `src/config/tools.ts`, `ToolPage.astro`, Header | done | none | 5 categories, Tools/Learn/Daily in primary nav and footer |
| A6 Arcade IA shell | filters/sort/chips + catalog facts | `/arcade/` | `src/pages/arcade.astro` + GameCard | done | none | Time/input/pressure/players filters, sort, New/Updated chips, live stats |
| A7 `/daily/` shell | local daily hub | `/daily/` | `src/pages/daily.astro`, `src/config/dailies.ts` | partial | none | Hub live; Word Loom slot live; crossword/sudoku slots planned until those games ship |
| A8 Registry facts article | first-party stats | `/articles/registry-facts/` | `src/pages/articles/registry-facts.astro` | done | none | Build-time numbers; update procedure on the page |
| A9 Media kit embeds | embed gallery + canonical blurb | `/media/` | media.astro + `src/lib/brand-blurb.ts` | done | none | Blurb shared with llms.txt surface |
| A10 Privacy documentation hook | every key documented | `/privacy/` | `src/lib/storage-docs.ts` + drift test | done | none | Generated table; enablelist and docs can't drift |

## Band B — Collections & learn hubs

| Item | Proposed | Live URL or — | In repo | Status | Blockers | Notes |
|---|---|---|---|---|---|---|
| B1 Card & solitaire | /collections/card-and-solitaire/ | — | — | missing | needs 3rd card game (Spider) | comparator covers rules meanwhile |
| B1 Word games | done | /collections/word-games/ | yes | done | none | Word Tile Rush, Word Search, Hangman, Word Loom |
| B1 Logic & number | done | /collections/logic-and-number/ | yes | done | none | Beacon Lattice, Nonogram, Mini Sudoku, 9×9, 2048, Lights Out, Minesweeper |
| B1 Memory & recall | — | — | — | missing | needs 3rd memory title (Simon + Memory Match only) | one more memory game unblocks |
| B1 Originals only | done | /collections/originals-only/ | yes | done | none | Catalog `isOriginal` facts |
| B1 Pass & Play completeness | done | /collections/pass-and-play/ | yes | done | expands as P&P ships | 10 members now (incl. Gomoku, Nine Men's Morris, Checkers) |
| B2 One-thumb / mobile | done | /collections/one-thumb-mobile-friendly/ | yes | done | none | Input + tap loop criteria |
| B2 Large tap targets / low complexity | done | /collections/large-tap-targets-low-complexity/ | yes | done | none | 44px + board geometry criteria |
| B2 Keyboard-only capable | done (deepened) | /collections/keyboard-friendly-browser-games/ | yes | done | none | Verified `hasKeyboardComplete` flag in inclusion method |
| B2 Two players one device | done | /collections/pass-and-play/ | yes | done | — | |
| B2 Short break | done (in sync) | /collections/games-for-a-short-break/ | yes | done | keep in sync | metadata criteria |
| B2 Offline-after-load | — | — | — | wontfix | no service worker | documented in DECISIONS_NEEDED #4 |
| B3 What is Quiet Arcade | done | /learn/what-is-quiet-arcade/ | yes | done | none | |
| B3 What is Pass & Play | done | /learn/what-is-pass-and-play/ | yes | done | none | |
| B3 Local storage scoring | done | /learn/local-storage-scoring/ | yes | done | none | |
| B3 Browser games without accounts | done | /learn/browser-games-without-accounts/ | yes | done | none | |
| B3 Untimed / reduced-pressure | done | /learn/untimed-play/ | yes | done | none | |
| B3 Handoff screen | done | /learn/handoff-screen/ | yes | done | none | |
| B3 Game Mode (viewport) | done | /learn/game-mode-viewport/ | yes | done | none | |
| B3 Unblocked vs no-account | done | /learn/unblocked-vs-no-account/ | yes | done | none | honest network caveat |
| B4 Glossary shorts | done | /learn/glossary/ | yes | done | none | exact cover, foundations/tableau/stock/waste, nonogram runs, reduced pressure, handoff, Game Mode, dailies |

## Band C — Games

### C1 Classics

| Item | Status | Notes |
|---|---|---|
| C1-1 Minesweeper | done | 9×9/16×16/16×30, flag/chord, first-click safe (documented boundary), untimed |
| C1-2 Sudoku 9×9 | done | 42/34/28 givens, unique-solution verified, pencil marks, untimed |
| C1-3 Spider Solitaire | missing | depends on shared `solitaire` reuse; comparator row ready |
| C1-4 Mahjong Solitaire | missing | |
| C1-5 Hangman | done | 4 themes, accessible letter entry, untimed |
| C1-6 Crossword mini | missing | planned daily slot exists |
| C1-7 Daily word puzzle | done | Word Loom (original), daily + practice, on-device streak, symbol+color feedback |
| C1-8 Lights Out | done | 5×5, solvable by construction, untimed |
| C1-9 Simon | done | 12-pad target, Calm pattern (reduced-motion alternative) |

### C2 Pass & Play expansions

| Item | Status | Notes |
|---|---|---|
| C2-10 Checkers / Draughts | done | English draughts, mandatory captures, simple rule documented |
| C2-11 Battleship | missing | fog-of-war handoff pattern documented in learn/handoff-screen |
| C2-12 Gomoku | done | 15×15 free-style, variant stated |
| C2-13 Nine Men's Morris | done | 24-point mills, mill-protection, flying at 3, blocked loss |
| C2-14 Yahtzee / Yacht | missing | |
| C2-15 Dominoes | missing | |
| C2-16 Chess | missing | P&P-first rule stands; no AI/Elo in v1 |

### C3 Cluster deepeners

| Item | Status |
|---|---|
| Pyramid / Golf / TriPeaks / Yukon | missing (solitaire shared code reusable) |
| Kakuro / Hashi / Slitherlink / Nurikabe / Futoshiki / Skyscrapers / KenKen | missing (logic framework patterns established) |
| Nonogram packs | missing (C6 pattern) |
| Anagrams / Boggle-style / Category guess / Original spelling grid | missing |
| Nonogram pack landing | missing |

### C4 Originals

| Item | Status | Notes |
|---|---|---|
| ≥2 new originals beyond Lattice | partial | Word Loom ships as original #1 of the new cohort; Tile Garden/Color Flip/Beacon Lattice already original. Second new original (exact-cover cousin or quiet path logic) remains in backlog. |
| Stronger guides + systems articles per original | partial for shipped originals | Beacon Lattice/Color Flip/Tile Garden/Word Loom each carry systems articles |

### C5 Out of scope

| Item | Status |
|---|---|
| .io / server multiplayer | wontfix (constraint 3) |
| Match-3/merge with lives/energy/paywalls | wontfix (constraint 1/2, brand) |
| Endless runner / high-dopamine arcade | wontfix (C5 default; skipped Snake/Tetris-like) |
| Anything requiring an account | wontfix (hard constraint) |

### C6 Puzzle pack IA

| Item | Status | Notes |
|---|---|---|
| Pack landing pages + registry entry | missing | pattern deferred until a packs feature ships (Nonogram first) |

## Band D — Tools

### D1 Play helpers

| Item | Status |
|---|---|
| D1-1 Game Finder quiz | done (catalog-driven, alphabetical, not a ranking) |
| D1-2 Session planner | done |
| D1-3 Daily hub widget | partial — daily hub + Word Loom live slot; embeddable widget planned |
| D1-4 Solitaire rules comparator | done (Klondike/FreeCell/Spider rows) |
| D1-5 Sudoku pencil-mark helper | done |
| D1-6 Nonogram clue calculator | done |
| D1-7 Word length/scoring explainer | done |
| D1-8 P&P turn timer | missing |

### D2 Setup helpers

| Item | Status |
|---|---|
| D2-9 Desk ergonomics quick check | missing |
| D2-10 Monitor distance & text size advisor | partial — Zoom Visualizer v2 with device presets; distance advisor pending |
| D2-11 Keyboard layout picker | missing |
| D2-12 Quiet switch / noise quiz | missing |
| D2-13 Bias lighting setup checker | missing |
| D2-14 Bluetooth vs USB explainer | missing (Setup guide exists in content) |
| D2-15 Touch target size checker | done |
| D2-16 Small-desk cable/power planner | missing |

### D3 Accessibility & trust

| Item | Status |
|---|---|
| D3-17 Contrast checker | done |
| D3-18 Focus order demo | done |
| D3-19 Reduced-motion tester | done |
| D3-20 localStorage inspector | done (read-only) |
| D3-21 Color vision simulation | missing |
| D3-22 Embed privacy checklist | missing |

### D4 Light utilities

| Item | Status |
|---|---|
| D4-23 Ambient Mixer share URLs | done (`?texture=&vol=`) |
| D4-24 Pomodoro + break suggestion | missing |
| D4-25 Random calm activity | done |
| D4-26 Printable blank grids | missing |

### D5 Zoom Visualizer v2

| Item | Status | Notes |
|---|---|---|
| Device presets + 200%/400% reflow helpers + links | done | buttons for 5 presets + one-click 400% (320 CSS px) |

## Band E — GEO/content

### E1 Comparison / decision articles

| Item | Status |
|---|---|
| Klondike vs FreeCell vs Spider | partial — comparator tool; article pending Spider |
| Mini Sudoku 6×6 vs 9×9 | done (`/articles/mini-sudoku-vs-9x9/`) |
| Timed Word Tile Rush vs untimed Word Search | done |
| Pass & Play vs solo Quiet Arcade | done |
| Color Flip visual vs turn-based | done (pre-existing) |
| Memory Match move-count vs timed memory | done |
| Game Finder vs Discovery Wheel | done |

### E2 Problem/query pages

| Item | Status |
|---|---|
| Free browser games no account (canonical) | done |
| Two-player games on one phone/device | done |
| Untimed puzzle games in the browser | done |
| Keyboard-only browser games | done |
| Where high scores go with no login | done |
| Solitaire free no download no signup hub | done |
| Short break games under ~5–8 min | partial — collection exists; article pending |
| How to play [each classic] | done for all 26 shipped games via guides |

### E3 Trust / methodology

| Item | Status |
|---|---|
| Accessibility test matrix | done (on /accessibility/ with automated/manual rows) |
| Advertising placement policy deep page | done (pre-existing /advertising/) |
| Changelog / registry public log | done (game release log table on /changelog/) |
| Puzzle generation or pack source method | done (`/articles/puzzle-generation-method/`) |
| Affiliate disclosure policy hub | partial — disclosures exist in Setup; separate hub not warranted yet |
| On-page template normalization | partial — ToolPage shared template; game/guide/collection pillars already have bottom line, facts, limits, FAQ, reviewed dates |
| Setup 7 topic pillars strengthened | partial — cross-link table at hub; per-topic pillar pages not created to avoid cannibalization |
| Merge near-duplicate Setup guides | in policy; no audit action this cycle |
| "With NoCharge games" sections | done at Setup hub (topic → tool → 3 games) |

### E5 Off-site consistency

| Item | Status |
|---|---|
| Single canonical brand blurb | done (`src/lib/brand-blurb.ts`; About/Media/llms.md surfaces) |
| No spam directory schemes | done (by policy) |

## Band F — Cross-links & nav

| Item | Status |
|---|---|
| Setup topic hub → ≥1 tool + ≥3 games | done (hub table) |
| Every tool → ≥2 next actions | done (ToolPage requires nextActions; all 17 tools pass) |
| Every game → guide + collections + related games + relevant tool | done for shipped games (related-games catalog module; tool links in guides where relevant) |
| Homepage/arcade/tools/learn ≤3 clicks | done — Tools, Learn, Daily in primary nav + footer |
| Collections index lists all new collections | done (auto from content collection) |

---

## Program dashboard

| Band | Done | Partial | Missing | Wontfix |
|---|---|---|---|---|
| A | 10 | 0 | 0 | 0 |
| B | 22 | 0 | 2 | 1 |
| C | 10 | 2 | 22 | 4 |
| D | 10 | 3 | 10 | 0 |
| E | 14 | 4 | 1 | 1 |
| F | 5 | 0 | 0 | 0 |

Current catalog (this review): **26 games, 26 guides, 47 articles, 11 collections, 15 tools, 366 public pages**.
