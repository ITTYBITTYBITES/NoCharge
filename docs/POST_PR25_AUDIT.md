# Post PR #25 (Pass & Play) — full-site audit

**Audit date:** 2026-08-24
**Branch / commit:** `arena/01a03563-nocharge` from `main` @ `230cb76` ("Merge PR #29: Fix Quiet Setup illustrations and complete PR #28 gaps")
**Scope:** Every public route, every game, all content collections, generated artwork, local-storage model, metadata/SEO, security posture, and CI-validated behavior — the entire shipped site.
**Mode:** Investigation (2026-08-24), then **user-directed fixes in the same PR.** The original investigation-only constraint was lifted with the instruction: *"Fix every single thing you found and then scan everything again to make sure it didn't introduce errors."* Every finding below is resolved in this PR (§9), and §10 re-runs the full validation battery to prove no regressions. Mobile/gameplay browser testing was explicitly handed off to a separate agent with a real browser environment; the Playwright suite (including two new gameplay specs) is the browser gate for this PR in CI.

## Severity definitions (used consistently throughout)

- **Critical** — site broken, a game unplayable, data loss, security/CSP regressions, or a broken core promise (no accounts, no dark patterns, local-only data).
- **Major** — visible glitch users will see and complain about, broken layout, wrong copy, or missing new-game polish (the class of issues flagged in the original PR #25 review).
- **Minor** — cosmetic, edge case, polish, internal-documentation staleness.

## Method and verification

| Step | Result |
| --- | --- |
| `npx vitest run` (all unit tests) | 31 files, **325 tests passed** |
| `npx astro check` | 0 errors, 0 warnings, 33 hints |
| `npm run build` | **92 pages built**, success |
| `npm run check:links` | 0 broken internal links (92 HTML files) |
| `npm run validate:sitemap` | passed, 91 public routes in main sitemap |
| `npm run check:assets` | asset budget passed (8 scripts / 177 KB; largest image 145.7 KB) |
| `npm run inspect:structured-data` | passed (Article, BreadcrumbList, CollectionPage, ItemList, ListItem, Organization, VideoGame, WebPage, WebSite) |
| `npm run validate:html` (html-validate, no config in repo) | **6 errors** (see Minor F-m10) |
| `npm run validate:feed`, `validate:brand`, `validate:media-kit`, `validate:brand-media`, `validate:setup`, `inspect:favicons` | all passed |
| Full crawl of all 94 HTML routes (status, h1/title, every local `src`/`href` vs. `dist/`) | **no missing routes, no missing assets, no page without an h1 or title** |
| Artwork: every one of the 17 game-art packages visually inspected (cover-square, cover-landscape, plus source SVGs and generator scripts) | Findings F-M1…F-M7 (below) |
| Playwright e2e suite | **Not re-runnable in this sandbox** (browser binary download blocked by the network). Findings therefore rest on code review + the unit/build/validator gates above + visual inspection; CI (`deploy.yml`: art-drift check → `npm run check` → build → `playwright test --project=chromium`) is the browser gate. |
| Post-fix re-scan (the whole table re-run, plus the 94-route crawl, content greps, and generator determinism checks) | See **§10 Re-scan results** — all green. |

Note on the historical visual-review process: `docs/PASS_AND_PLAY_VISUAL_REVIEW.md` and `docs/NEW_SOLO_GAMES_VISUAL_REVIEW.md` state they are "built from capture-time DOM assertions (green CI = PASS), **not by hand-opened images**." That is exactly why the broken raster artwork in this audit shipped: e2e tests assert that the right image *files are referenced*, never what the pixels show. See Recommendation R8.

---

## 1. Summary

The Pass & Play merge (PR #25) and everything shipped since are **functionally sound**: all 17 games mount, all engines pass unit tests, the shared handoff screen behaves as documented (session-only names, one bounded match record per game, no timers, no AI, no network), the storage model is bounded and correctly excluded from Clear-Game-Data-elsewhere, all 92 routes serve, links resolve, and the security/CSP posture is unchanged and documented. **No Critical findings.**

The damage is concentrated in **generated artwork and stale copy**:

- **Count by severity: 0 Critical · 16 Major · 21 Minor.** (13 Major / 20 Minor at investigation time; F-M14, F-M15 and F-m21 were found *while fixing*; F-M16 was found by the *first real-browser CI run* — catalogued in their sections below and resolved the same way.)
- The reported "hero/thumbnail images on the new game cards look wrong" is confirmed and is broader than the six Pass & Play cards:
  - **Tic-Tac-Toe** cover/hero/social art draws the "winning line" as a horizontal dashed line through the bottom row — which is `X O X`, **not a win**; the actual win on the pictured board is the diagonal, which the art does not mark (and the alt text claims).
  - **Dots & Boxes** and **Reversi** covers use player colors that don't match the game (P2 light-pink instead of light-blue; teal discs instead of black discs), and their alt texts contradict the pixels.
  - The same failure class hit the solo games shipped around the same time: **Klondike** and **FreeCell** covers clip their card art off the canvas; **Tile Garden** covers render literal `01F 33F` / `01F 33C` text (emoji code points that the SVG rasterizer couldn't draw); **Word Search** and **Mini Sudoku** covers are placeholder title cards.
- Copy that predates the current 17-game catalog still says the arcade has "ten games / four solo titles" on the About page, the Media boilerplate, and two featured articles (one of which also claims the homepage grid shows "all nine solo titles" — it shows the six featured games); the local-storage explainer article lists only the original four games' keys; the accessibility statement predates Pass & Play; "Every game has a field guide" is false (11 of 17 games have guides); and Mini Sudoku advertises **pencil marks that do not exist in the game**.

Nothing here blocks play. Nothing touches the no-account / local-data / no-dark-patterns promise. But the art and copy findings are exactly what users will notice on first contact, and several are one-line generator or content fixes.

**Resolution (same day):** the investigation-only mode was lifted and **all 37 findings were fixed in this PR** — seven artwork-generator rewrites plus a full regeneration of all 17 packages, Mini Sudoku and Word Search gameplay hardening (which surfaced the two new Major findings F-M14/F-M15), copy corrections across About/Media/Accessibility/My Arcade/arcade/guides/game pages/three articles/one collection, the storage-key truth (five dead clear keys removed, two planned persistences implemented), two missing changelog entries, five internal docs, two new e2e gameplay specs, an html-validate config, and a CI art-drift gate. The first real-browser CI run then failed 8 of 434 tests; the failures isolated one more Major finding (F-M16 — puzzle engines were not seed-reproducible across JS engines), the remaining F-M15 focus-restore gap, the `is-locked` render clobber, and three test-side bugs — all closed before merge. §9 maps every finding to its fix; §10 is the regression re-scan.

---

## 2. Critical findings

**None.** Specifically verified and found clean:

- All 17 games build, mount (registry), and pass unit tests; the six Pass & Play engines are pure functions with bounded rules (no AI, no timers, no network — matching the published promise).
- No data loss paths: Pass & Play writes exactly one bounded record per game (`nocharge:passplay:match:<id>`, 2 KB cap, defensive parser); Clear Game Data uses an explicit allowlist that never touches `nocharge:consent` or Google-owned storage.
- No security/CSP regressions: strict meta CSP with explicit Google ad/analytics origins, `ads.txt` line matches `ADSENSE_ADS_TXT_LINE` exactly, `.well-known/security.txt` present, `referrer` policy set, no third-party script beyond the documented Google tags.
- No dark patterns in the new games: no timers, streaks, leaderboards, or forced progression in any of the six (also asserted by the e2e dark-pattern scan in `tests/e2e/pass-and-play.spec.ts` / `my-arcade.spec.ts`).
- All 92 routes return 200 (unknown URLs return the custom no-index 404), no missing local assets anywhere in the built HTML.

---

## 3. Major findings

### F-M1 — Tic-Tac-Toe cover art marks the wrong winning line (all four assets)
- **Where:** `public/game-art/tic-tac-toe/{cover-square,cover-landscape,guide-header,social-card}.{webp,jpg}`, rendered on the home/arcade/recently-played/my-arcade cards, the game-page hero, and the OG/Twitter card.
- **What:** The board depicted is `X O X / O X O / X O X` — the only winning line is the **diagonal** (X at r1c1, r2c2, r3c3). The art instead draws a dashed "winning line" **horizontally through the bottom row**, i.e. through `X O X`, which is not a win. The alt text ("…blue X marks complete a winning diagonal") contradicts the pixels, and the engine (`findWinner`) of course highlights the diagonal in real play — so card, hero, and actual game all disagree.
- **Root cause:** `scripts/generate-pass-play-art.mjs` hard-codes the indicator at `y0 + 2*cell + cell/2` (a full-width horizontal line at row 3) instead of the diagonal of the marks it draws.
- **Why Major:** this is the lead Pass & Play game (registry order 5, home-page highlight, collection lead). A user who reads the card sees a board where the marked line doesn't win.

### F-M2 — Klondike cover art is clipped / off-centre (square + landscape)
- **Where:** `public/game-art/klondike/cover-square.*` (800×800) and `cover-landscape.*` (1280×720, the game-page hero) and `social-card.*`.
- **What:** Square: the 4th card of the fan starts at x ≈ 664 with width ≈ 176 and is **cut off at the right canvas edge**; the top half of the canvas is empty. Landscape: the fan is centred at 60 % of the width, leaving the entire left half of the hero empty.
- **Root cause:** `scripts/generate-klondike-art.mjs` computes card offsets (`cx + cardW*1.5` etc.) without checking the bounding box; `cx = w*0.6` in landscape mode.
- **Why Major:** broken composition on a featured signature game's hero image.

### F-M3 — FreeCell cover art is clipped (square) and empty (landscape)
- **Where:** `public/game-art/freecell/cover-square.*`, `cover-landscape.*`, `social-card.*`.
- **What:** Square: the row of 8 card stacks overflows and is **clipped at both left and right canvas edges**. Landscape hero: eight *empty outlined* card columns (no cards, no free-cell/foundation distinction) floating in a mostly empty frame.
- **Why Major:** the hero and card thumbnails for a signature game read as broken/unfinished.

### F-M4 — Tile Garden cover art contains literal glyph artefacts
- **Where:** `public/game-art/tile-garden/cover-square.*`, `cover-landscape.*`, `social-card.*` (all four motif sizes).
- **What:** Tier-1/2 tiles display the text **"01F 33F"** and **"01F 33C"** — the Unicode code points of 🌱 (U+1F33F) and 🌼 (U+1F33C) rendered by the SVG rasterizer (sharp/librsvg has no emoji font) as fallback glyphs. The in-game board renders the same emoji fine in browsers.
- **Root cause:** `scripts/generate-tile-garden-art.mjs` embeds emoji in `<text>` and rasterizes without an emoji-capable font.
- **Why Major:** the hero/cards for a featured game show nonsense text on five tiles.

### F-M5 — Word Search and Mini Sudoku covers (and icons) are placeholder title cards
- **Where:** `public/game-art/word-search/*` and `public/game-art/mini-sudoku/*` (covers, guide headers, social cards, `icon.svg`, plus committed `*.svg` source files).
- **What:** Instead of a depiction of the game (a letter grid; a 6×6 number grid), both games' covers are a generic generator output: the game **name in large text over a dark blob** ("WORD SEARCH", "MINI SUDOKU"). Their `icon.svg` files are 256×256 versions of the same card (illegible at the 44 px size used on guide pages). The front-matter alt text ("Programmatic word-search illustration in the Quiet Arcade palette") does not describe what the image actually is.
- **Why Major:** both are featured games; the cards look like un-shipped placeholders next to the rest of the arcade, and the alt text is wrong on top of it.

### F-M6 — Reversi cover art uses the wrong disc colours; alt text disagrees
- **Where:** `public/game-art/reversi/*` (all four assets).
- **What:** The art draws the two disc colours as **teal (#2dd4bf, the page accent) and cream**, while the actual game renders **black (#10130f) and white (#e8e3d8)** discs (`rev__cell--black/--white` in `src/games/reversi/styles.css`). The alt text says "black and white discs", so the alt, the art, and the game are three different things. The in-game legal-move hint is a small solid teal dot; the art shows a dashed ring (see F-m4).
- **Root cause:** `scripts/generate-pass-play-art.mjs` reuses `accent` for the "black" disc.

### F-M7 — Dots & Boxes cover art uses the wrong Player-2 colour; alt text disagrees
- **Where:** `public/game-art/dots-and-boxes/*` (all four assets).
- **What:** Player 2's claimed box and its edges are drawn in **light pink (#ffd3ea)**; in the game Player 2 draws in **light blue (#7dd3fc)** (`PLAYER_COLORS` in `src/games/dots-and-boxes/main.ts`). The alt says "pink and blue drawn edges" — the image shows pink and light-pink, so both players appear to be the same pink.
- **Root cause:** the generator's `highlight` colour is a lighter tint of the accent rather than the game's P2 colour.

### F-M8 — Stale game-count copy: "ten games / four solo titles" on four public surfaces
The arcade now has **17 games (11 solo + 6 Pass & Play)**, but:
- `src/pages/about.astro`: "The current arcade catalog is Memory Match, Word Tile Rush, Color Flip, and Beacon Lattice." (omits 13 games, including all of Pass & Play)
- `src/pages/media.astro` boilerplate (the recommended external description, "Last reviewed: 2026-08-21"): "The current library has ten original games: the solo titles Memory Match, Word Tile Rush, Color Flip, and Beacon Lattice, plus the Pass & Play family…"
- `src/content/articles/what-quiet-arcade-means-at-nocharge.md` (featured article): "The Arcade offers ten browser games now: four solo titles (…) and six Pass & Play games."
- `src/content/articles/five-new-single-player-games-for-quiet-arcade.md` (featured, published 2026-08-22): "The Quiet Arcade now has nine solo games and six pass-and-play games. The homepage grid shows all nine solo titles." — nine was the pre-PR #28 count (Word Search + Mini Sudoku shipped 2026-08-23), and the homepage grid renders the **six featured games** only (`featuredGames` in `src/pages/index.astro`), never "all solo titles".
- **Why Major:** the About page is the identity page; the Media boilerplate is what partners/publishers copy; both featured articles sit on the public article index. All four understate the library, and the grid claim is verifiable in one click.

### F-M9 — Accessibility statement predates Pass & Play (and the new solo games)
- **Where:** `src/pages/accessibility.astro` ("Last reviewed: August 17, 2026" — five days before PR #25 shipped).
- **What:** The keyboard paragraph names only Memory Match, Word Tile Rush, Color Flip, and Beacon Lattice. It omits that **five of the six Pass & Play games are fully keyboard-operable** (Tic-Tac-Toe, Dots & Boxes, Four in a Row, Reversi, Last Token — arrow keys + Enter, with Reversi moving only between legal squares) and that Pass the Picture documents its pointer-only stroke limit — a fact the rest of the site touts. The new solo games' keyboard paths (arrows/WASD, D/U shortcuts, etc.) are also absent.
- **Why Major:** the statement is a public accessibility promise; it currently undersells the site's own documented capabilities.

### F-M10 — "Every game has a field guide" — false (11 of 17 games have guides)
- **Where:** `src/pages/arcade.astro` ("Every game has a field guide." + "…each with a full guide when you want the details") and `src/pages/guides/index.astro` heading "Guides for every arcade game".
- **What:** Guides exist for the 11 solo games only. **All six Pass & Play games have no guide** (and none are draft). No dead links result (game pages gate the guide link on `hasGuide`), but the copy over-promises on the exact section the merge added.
- **Why Major:** wrong copy users can verify in one click.

### F-M11 — My Arcade "Clear game data" confirmation copy says "all four solo games"
- **Where:** `src/pages/my-arcade.astro` (confirm dialog: "This removes best scores for all four solo games, Memory Match fewest moves, Beacon Lattice puzzle progress, …").
- **What:** The clearing flow (shared `CLEARABLE_GAME_DATA_KEYS` in `src/lib/local-game-data.ts`) actually removes score/progress keys for **11 solo games** (memory-match, word-tile-rush, color-flip + turn-based, beacon-lattice, klondike, freecell, nonogram, twenty-forty-eight, tile-garden, word-search, mini-sudoku) plus preferences, Recently Played, and the six Pass & Play records. The "four" count is the pre-PR #26 number. The same stale "four" appears in the page's own comments ("keeps exactly the four games it has always shown") even though the rendered grid iterates all 11.
- **Why Major:** it is a data-deletion confirmation; the user is told what will be removed, and the copy understates it.

### F-M12 — Mini Sudoku advertises pencil marks that do not exist
- **Where:** `src/content/games/mini-sudoku.md` (description: "…with pencil marks…"; controls list: "**Pencil marks** — Keep small candidate notes in a cell while you work"), `src/content/guides/mini-sudoku.md` ("## Pencil marks — Use candidate notes to hold possibilities…"), and the "Pencil marks" control on the live game page.
- **What:** The game (`src/games/mini-sudoku/main.ts`) has **no way to create pencil marks**: the `marks` state is rendered (empty cells show `marks[i]` contents) but nothing ever writes to it — there is no button, no key binding, no touch gesture. `togglePencilMarks` is imported but never called. The documented storage key `nocharge:pref:sudoku-pencil-marks` (in `local-game-data.ts`, `MY_ARCADE_DATA_MODEL.md`, and asserted in `my-arcade` unit tests) is **never written by any code**.
- **Why Major:** a control listed on the game page, in its meta description, and in its guide simply doesn't work — the strongest form of "documented feature missing".

### F-M13 — Local-storage explainer article lists only the original four games' keys
- **Where:** `src/content/articles/how-nocharge-saves-scores-without-an-account.md` ("What the games store" key list; "Clearing only game data" paragraph).
- **What:** The article says "The current implementation can use these NoCharge game keys:" and lists seven — all of them from the original four games (Memory Match ×2, Word Tile Rush, Color Flip ×2, Beacon Lattice ×2) plus the shared mute preference and Recently Played. It omits the score/progress keys of **all seven new solo games** (Klondike, FreeCell, Nonogram, 2048, Tile Garden, Word Search, Mini Sudoku) and the six Pass & Play match records (`nocharge:passplay:match:<id>`). The clearing paragraph says the control removes "the current score keys, Memory Match fewest moves, Beacon Lattice progress, the shared mute preference, and the Recently Played list" — omitting the P&P records that the Privacy page (which is accurate) and the My Arcade dialog's real scope both include.
- **Why Major:** this is the public explainer for the site's core no-account/local-data promise, and a visitor who reads it concludes NoCharge stores far less (and that clearing removes less) than is true. It contradicts the Privacy page and `docs/MY_ARCADE_DATA_MODEL.md` on the same facts.

### F-M14 — Mini Sudoku is unplayable on touch devices (no digit-entry path)
- **Where:** `src/games/mini-sudoku/main.ts` (pre-fix).
- **What:** Cells are `<button>`s, not `<input>`s, and the only digit-entry path was a physical 1–6 keyboard — buttons never open a soft keyboard. On phones and tablets a cell can be *selected* but never *filled*: the game cannot be played at all on the device class where most casual play happens. Every other one of the 17 games has a touch path (native buttons, tap-to-select, or pointer handlers — verified game by game during the fix phase).
- **Why Major:** a featured game that is unfinishable on touch, while the site markets itself on touch-friendly calm play.
- **Found:** during the fix phase (the F-M12 pencil-mark work exposed that the game had no input path at all).
- **Fix (this PR):** on-screen digit pad (1–6 + ✕ erase), shared `clearSelected()` for Backspace and ✕, and the pencil-mark mode (see F-M12). Regression-tested in `tests/e2e/mini-sudoku.spec.ts`.

### F-M15 — Mini Sudoku keyboard play dies after one board mutation (arrows or digits)
- **Where:** `src/games/mini-sudoku/main.ts` (pre-fix; verified pre-existing against `git show HEAD:src/games/mini-sudoku/main.ts`).
- **What:** Every board mutation (arrow move, digit entry, undo, reveal, erase) calls `render()`, which rebuilds all 36 cell buttons (`grid.innerHTML = ''`). The currently focused button is destroyed, focus falls to `<body>`, and the *next* keystroke targets `body` — whose keydown never bubbles through the game root where the listener is attached. So after a single arrow press — or after typing one digit — keyboard play silently stops; "select a cell and type 1–6" fails on the second digit.
- **Why Major:** arrow + 1–6 is the documented keyboard path — the game's accessibility story — and it degrades one keypress in.
- **Found:** during the fix phase (arrow path) while re-reading the keydown path for F-M14; the digit-entry half was caught by the pre-CI defensive review of the new e2e specs (the C/U/R test would have failed on CI).
- **Fix (this PR):** `render()` restores focus to the selected cell whenever focus was inside the grid (covers arrows, digit entry, undo, reveal, erase); arrow handlers additionally focus the newly selected cell explicitly; roving `tabIndex` (selected = 0, others −1). Word Search's `render()` got the same guard — its end-of-selection rebuild killed the arrow cursor after the first word found via Enter. Covered by the "arrow keys keep focus inside the grid across repeated presses" and "typing fills, U undoes, C checks, R reveals" e2e tests.

### F-M16 — Puzzle generators are not seed-reproducible across JS engines (RNG consumed through a side-effecting sort comparator)
- **Where:** `src/games/mini-sudoku/engine.ts` (`shuffle`, used by `solvedGrid` and `createPuzzle`) and `src/games/word-search/engine.ts` (the per-word direction shuffle inside `createPuzzle`).
- **What:** Both engines "shuffled" with `array.sort(() => rng() - 0.5)`. How many times `Array.prototype.sort` invokes a comparator for a given input is implementation-defined, so two JS engines (the browser that rendered the puzzle vs. the test process that re-derives it — or Chrome vs. Firefox for the *same* user) can consume the LCG stream a different number of times, and the same `(difficulty, seed)` produces **different boards**. Each rendered board is internally valid, but the seed contract the game is built on breaks: a saved in-progress puzzle (`nocharge:sudoku:current-puzzle`) may not reproduce in a different engine, `restoreState()`'s validation (`every entry === createPuzzle(d, seed).solution[y][x]`) rejects it, and the user's in-progress puzzle is silently replaced by a fresh one — progress lost.
- **Why Major:** breaks the documented persistence behaviour across engines/browsers and any seed-based reproducibility (tests, shared seeds, replays) for the two seeded games.
- **Found:** by the first real-browser CI run (`32784421863`): "the in-progress puzzle survives a reload" failed on all three attempts — the solution digit derived in the test process "conflicted" with the browser-rendered givens — while the identical flow passed 5,000 seeds inside a single engine (Node simulation), proving the two engines disagreed about the same seed.
- **Fix (this PR):** Fisher–Yates shuffles in both engines — exactly `n−1` rng draws in a fixed order, so seed → puzzle is bit-identical in every JS engine. Re-verified after the change: 5,000-seed simulation of the exact reload-test flow (0 conflicts), exact empty counts at 3,000 seeds per difficulty (easy 12 / medium 16 / hard 20), unique-solution invariant at 3,000 seeds, Word Search 12/12 placements at 3,000 seeds, and same-seed-twice grid identity for both engines; all 325 unit tests still green.

---

## 4. Minor findings

**F-m1 — Five games share one generic placeholder icon.** `freecell`, `klondike`, `nonogram`, `tile-garden`, `twenty-forty-eight` all ship the identical 247-byte `icon.svg` (md5 `1ff8eb1d…` — a plain green rounded square). It is the 44 px "Play" icon on each guide page, where it is indistinguishable between games.

**F-m2 — Word Search and Mini Sudoku icons are title cards.** Their `icon.svg` files are 256 px versions of the placeholder cover (F-M5) — unreadable at 44 px on guide pages.

**F-m3 — Last Token art piles match no preset.** The cover depicts piles of 3/2/5 (the middle pair rendered as two near-overlapping circles that read as a single pale token). The game's presets are 3-4-5, 1-3-5-7, and 3-5. Reads as "mid-game", but never matches a selectable starting position.

**F-m4 — Reversi art hint glyph doesn't match the game.** Art: dashed ring at f3. Game: small solid teal dot in the centre of each legal square. (The pictured position also isn't reachable from the standard opening, which is fine for art — but the marker style should match.)

**F-m5 — Pass the Picture art palette ≠ in-game palette.** The art's 8 swatches (red/yellow/mint/blue/violet/pink/cream/teal) differ from `PICTURE_PALETTE` (dark ink #1f2430, red, amber, green, blue, violet, pink, lime); the art canvas is square, the in-game canvas is 4:3 (960×720). Strokes shown (red/blue/green) are in both, so the cover is plausible — but the swatch row misrepresents the actual colours a player picks.

**F-m6 — Word Search's "full keyboard controls" claim is overstated.** Front-matter description: "…touch selection, and full keyboard controls"; the game has **no keyboard-specific handling at all** (0 `keydown` listeners) — it is operable via Tab/Enter on the 64–100 grid buttons, but has no arrow navigation, unlike every other grid game on the site. The in-page control line ("use the grid buttons") is vague about this.

**F-m7 — Word Search hint reveals the full word to screen readers.** `status.textContent = 'Hint: first letter of ' + <full word>` in an `sr-only` live region, while the page promises a hint that "can identify a starting letter". Sight users see only the start-cell highlight (which also never clears); screen-reader users hear the whole answer.

**F-m8 — Word Search and Mini Sudoku write `localStorage` unguarded.** Both call `localStorage.getItem/setItem` directly in their completion handlers; every other game goes through guarded helpers (`getBrowserStorage()` / `parseStoredScore`). In blocked-storage environments (some private-browsing modes) completing a puzzle can throw instead of recording.

**F-m9 — Word Search / Mini Sudoku grid ARIA.** Both use `role="grid"` on the board but the cells are plain `<button>`s with no `role="gridcell"`/`aria-rowindex`/`aria-colindex`; Word Search declares `aria-rowcount` but not `aria-colcount`. Screen-reader grid semantics are therefore incomplete.

**F-m10 — `html-validate` fails with 6 errors and no config exists in the repo.** (a) Shiki's `<pre style="…">` inline styles on the 2048 article and guide (2 errors); (b) four element ids starting with a digit on `/setup/cable-management-for-a-calm-desk/` (`id="1-group-cables-by-destination"`, …). The historical `AUDIT.md` claims inline styles were "excluded" from validation — no `.htmlvalidate` config is present to exclude anything. The ids work in browsers but fail `valid-id`.

**F-m11 — Changelog has no entries for the shipped solo-game launches.** The public changelog jumps 2026-08-21 (brand) → 2026-08-22 (Pass & Play). There is no entry for the five Quiet Arcade solo games + sound pass (PR #26) or Word Search + Mini Sudoku (PR #28), even though articles, guides, and game pages for all of them shipped. The changelog is the site's "verified public updates" record (per the About page).

**F-m12 — Anachronistic editorial dates.** `what-quiet-arcade-means-at-nocharge.md` is `published/updated: 2026-08-19` but describes the six Pass & Play games that shipped 2026-08-22 — the content post-dates its own metadata.

**F-m13 — Word Search UX edges.** Changing theme or size mid-puzzle silently discards progress (no confirm, no notice); after "Puzzle complete" (sr-only status) there is no explicit New-puzzle control — the theme/size selects double as restart; the completed grid is not visually locked.

**F-m14 — Keyboard collection rationale is thin for Word Search.** `collections/keyboard-friendly-browser-games.md` admits only a game "when its complete play loop is documented and operable from a keyboard"; the Word Search reason ("A calm grid with direct keyboard selection…") asserts "direct keyboard selection" that the game does not implement (see F-m6).

**F-m15 — Last Token round-end plays two sounds at once** (`play('error')` then `play('win')` in `finishRound`). Interpretable as "loser erred / winner won", but it is a double blip where one result sound would be cleaner.

**F-m16 — `docs/MY_ARCADE_DATA_MODEL.md` §4 count is stale.** It says the clear list is "exactly the fifteen game keys … the nine solo keys plus the six" Pass & Play records; the allowlist now holds 10 score keys + 13 named progress keys + 8 preference keys + Recently Played + 6 match records.

**F-m17 — No gameplay e2e spec for Word Search / Mini Sudoku.** All other 15 games have gameplay specs (mount, moves, win, keyboard, storage). The two newest games are only covered by `sound-events.spec.ts` checks plus unit-level engine tests.

**F-m18 — Unreferenced art shipped to production.** `hero-square.{jpg,webp}` (klondike, freecell, nonogram, twenty-forty-eight, tile-garden, word-search, mini-sudoku), `landscape-800/1200/1600` (word-search, mini-sudoku), the committed `*.svg` sources for word-search/mini-sudoku covers, and the six Pass & Play `source.svg` files are all copied to `dist/` but referenced by no page. Dead weight, and the source SVGs expose the art's vector sources publicly.

**F-m19 — Nonogram cover mis-described in the review doc.** `docs/NEW_SOLO_GAMES_VISUAL_REVIEW.md` calls it a "5×5 pixel grid with heart pattern"; the raster shows a plus/cross pattern. (Symptom of the no-visual-review process in §Method.)

**F-m20 — Four internal docs still describe pre-PR #26/#28 catalogs.** `docs/ART_ASSETS.md` says raster covers are reproducible with `art:memory/word/color/beacon/passplay` only — `package.json` also carries `art:klondike`, `art:freecell`, `art:nonogram`, `art:2048`, `art:tile-garden`, `art:word-search`, `art:mini-sudoku` (plus `art:solo-new`). `docs/CONTENT_DEPTH_REVIEW.md` ("/arcade/ … Compare ten games by genre"), `docs/MANUAL_ACCESSIBILITY_CHECKLIST.md` ("checks for all ten games (four solo plus the six Pass & Play games)"), and `docs/BRAND_GUIDE.md`'s screenshot table ("for all four solo games; none for the six Pass & Play games") all describe the 4/10/15-game eras. Internal-only staleness, but the accessibility checklist is the record of which checks were actually performed.

**F-m21 — Clear-allowlist keys that no game code ever writes.** `CLEARABLE_GAME_DATA_KEYS` (`src/lib/local-game-data.ts`, asserted in `src/lib/my-arcade/my-arcade.test.ts`) listed seven keys that no game ever wrote: five `nocharge:<id>:high` keys (klondike, freecell, nonogram, twenty-forty-eight, tile-garden) — those games record progress under *named* keys (`games-won`, `best-moves`, `puzzles-revealed`, `best-tile`, `best-tier`) and never call `saveScore()` — plus `nocharge:word-search:last-list` and `nocharge:sudoku:current-puzzle`, two persistence features that were planned but never implemented. Dead clear entries are harmless at clear time, but the data model and its unit tests described storage that does not exist. **Fix (this PR):** the two persistences were implemented (Word Search saves/restores its last theme list; Mini Sudoku saves the in-progress puzzle on every render and validates any restore against the puzzle's unique solution), so those two keys are now real; the five dead `*:high` keys were removed from `GAME_SCORE_IDS` and from both unit-test lists; `docs/MY_ARCADE_DATA_MODEL.md` §4 was rewritten to the true key inventory (F-m16).

---

## 5. Inventory

### 5.1 Games (17) — `src/games/` + `src/content/games/`

| # (order) | Slug | Title | Genre | Featured | Guide | Art status | Notes |
|---|---|---|---|---|---|---|---|
| 1 | memory-match | Memory Match | Memory | ✓ | ✓ | OK (baseline) | Original four; screenshots in guide |
| 2 | word-tile-rush | Word Tile Rush | Word | ✓ | ✓ | OK | Original four |
| 3 | color-flip | Color Flip | Reflex/Calm | ✓ | ✓ | OK | Original four; visual + turn-based modes |
| 4 | beacon-lattice | Beacon Lattice | Logic | ✓ | ✓ | OK | Original four; only genuine gameplay captures |
| 5 | tic-tac-toe | Tic-Tac-Toe | Pass & Play | — | — | **F-M1** | PR #25; 3×3 / 4×4 / match modes |
| 6 | dots-and-boxes | Dots & Boxes | Pass & Play | — | — | **F-M7** | PR #25; 4×4 / 6×6 |
| 7 | four-in-a-row | Four in a Row | Pass & Play | — | — | OK | PR #25; 7×6 / 6×5 |
| 8 | reversi | Reversi | Pass & Play | — | — | **F-M6, F-m4** | PR #25; 8×8, hints, auto-pass |
| 9 | last-token | Last Token | Pass & Play | — | — | F-m3, F-m15 | PR #25; 3 presets, misère |
| 10 | pass-the-picture | Pass the Picture | Pass & Play | — | — | F-m5 (minor) | PR #25; co-op canvas, local PNG |
| 11 | klondike | Klondike Solitaire | Solitaire | — | ✓ | **F-M2, F-m1** | PR #26; shared solitaire engine |
| 12 | freecell | FreeCell | Solitaire | — | ✓ | **F-M3, F-m1** | PR #26 |
| 13 | nonogram | Nonogram | Logic | — | ✓ | OK (F-m19 doc) | PR #26 |
| 14 | twenty-forty-eight | 2048 | Logic | — | ✓ | OK (F-m1) | PR #26 |
| 15 | tile-garden | Tile Garden | Merge | — | ✓ | **F-M4, F-m1** | PR #26; emoji tiles |
| 16 | word-search | Word Search | Word | ✓ | ✓ | **F-M5, F-m2** | PR #28 |
| 17 | mini-sudoku | Mini Sudoku 6×6 | Logic | ✓ | ✓ | **F-M5, F-m2, F-M12** | PR #28 |

Registry order = display order everywhere (arcade, collections, My Arcade). 6 featured games drive the home grid; 3 Pass & Play highlights (tic-tac-toe, dots-and-boxes, pass-the-picture) drive the home Pass & Play section.

### 5.2 Guides (11)
beacon-lattice, color-flip, freecell, klondike, memory-match, mini-sudoku, nonogram, tile-garden, twenty-forty-eight, word-search, word-tile-rush. All map to existing games; none for the six Pass & Play games (see F-M10).

### 5.3 Articles (25)
- **Game articles (19):** freecell, how-diagonal-letter-paths (word-tile-rush), how-exact-coverage (beacon-lattice), how-move-counting (memory-match), how-to-find-forced-beacon (beacon-lattice), keyboard-and-accessible-play (beacon-lattice), keyboard-strategy (memory-match), klondike, managing-a-rising-word-game-grid (word-tile-rush), memory-match-systematic-board-scan, mini-sudoku, nonogram, tile-garden, timing-a-color-change (color-flip), twenty-forty-eight, understanding-the-four-color-cycle (color-flip), visual-mode-versus-turn-based (color-flip), word-search, word-tile-rush-longer-word-scoring.
- **Platform articles (6):** designing-browser-games-for-more-ways-to-play, five-new-single-player-games-for-quiet-arcade (F-M8), how-nocharge-saves-scores-without-an-account (F-M13), how-nocharge-tests-browser-games, pass-and-play-two-players-one-device, what-quiet-arcade-means-at-nocharge (F-M8/F-m12).
- 17 of 25 are `featured: true`.

### 5.4 Collections (5)
browser-games-without-accounts (17 games), games-for-a-short-break (14), keyboard-friendly-browser-games (16; F-m14), pass-and-play (6), untimed-or-reduced-pressure-browser-games (16). All member games exist; all reasons ≥ 20 chars (schema-enforced); build-time validation in `collection-validation.ts`.

### 5.5 Quiet Setup (18 articles)
Feed-validated (18 items), 19 direct paid Amazon links with `tag=nocharge-20` + new-tab policy, per-article artwork, validators green.

### 5.6 Changelog (10 entries at audit time → 12 after fixes)
2026-08-15 ×4 (launch, adsterra-era consent, artwork, accessibility), 08-18 AdSense replacement, 08-19 beacon + editorial, 08-21 brand + My Arcade, 08-22 Pass & Play. **Missing at audit: solo-game launches (F-m11) — both entries added in this PR (2026-08-22 solo games + sound pass; 2026-08-23 Word Search + Mini Sudoku).**

### 5.7 Public routes (92 built pages)
Top-level: `/`, `/about/`, `/accessibility/`, `/advertising/`, `/arcade/`, `/articles/` (+25), `/changelog/`, `/collections/` (+5), `/games/` (+17), `/guides/` (+11), `/help/`, `/media/`, `/my-arcade/`, `/privacy/`, `/setup/` (+18), `/terms/`, `/404` (custom, no-index, no ads). Non-HTML: `/feed.xml` (10 items), `/setup/feed.xml` (18 items), `/sitemap.xml` (91 URLs), `/sitemap-setup.xml`, `/health.json`, `/manifest.webmanifest`, `/robots.txt`, `/ads.txt`, `CNAME` (nocharge.net), `/icons/*`, `/brand/*`, `/social/*`, `/game-art/*`, `/editorial-art/*`, `/setup-art/*`, `/game-assets/*` (blip/pop/win.wav), `/apple-touch-icon.png`, favicon set, `/.well-known/security.txt`.

### 5.8 Art packages
17 game packages (icon, cover-square, cover-landscape, guide-header, social-card — webp+jpg each; plus the four original games' diagram SVGs and screenshot pairs). At audit time these also shipped unreferenced hero-square/landscape-800–1600/svg files (F-m18) — **all 45 removed in this PR**, canonical vectors moved to `scripts/art-sources/<slug>/source.svg` (see `docs/ART_ASSETS.md`, 2026-08-24 section). 21 editorial-art sets, 19 setup-art sets, brand kit + PWA icons + media kit (all validated).

---

## 6. Per-page audit

| Route | Status | Findings |
|---|---|---|
| `/` | 200 ✓ | Hero, 6 featured cards, Pass & Play section (3 cards + See all), guides, articles, FAQ, CTA. FAQ keyboard list is accurate but omits Pass & Play (acceptable). Recently Played strip works. No findings. |
| `/arcade/` | 200 ✓ | 17 cards (11 solo + 6 P&P with "2 players" pill), anchor nav, `games.length` fact (17, correct). **F-M10** ("Every game has a field guide"). |
| `/games/<slug>/` ×17 | 200 ✓ each | Hero art (F-M1/2/3/4/5/6/7 per game), controls section, About, facts, related games/articles, VideoGame schema + per-game social card. Mini Sudoku: **F-M12** in controls list. Word Search: F-m6 in description/controls. |
| `/guides/` | 200 ✓ | 11 cards. **F-M10** ("Guides for every arcade game"). |
| `/guides/<slug>/` ×11 | 200 ✓ each | Guide header art (carries F-M1/2/3/4/6/7 where present), Play aside icon (F-m1, F-m2), diagrams/screenshots for the original four. Mini Sudoku guide explains the missing pencil marks (F-M12). |
| `/articles/` | 200 ✓ | 25 cards; featured filter + game/platform grouping correct. |
| `/articles/<slug>/` ×25 | 200 ✓ each | Article schema with game social image; affiliate policy intact (8+10 paid articles, new-tab, disclosure). what-quiet-arcade: **F-M8, F-m12**. five-new-single-player-games: **F-M8**. saves-scores: **F-M13**. |
| `/collections/` | 200 ✓ | 5 cards. |
| `/collections/<slug>/` ×5 | 200 ✓ each | Build-time membership validation; reasons render; pass-and-play lists all six. keyboard collection: F-m14. |
| `/setup/` + `/setup/<slug>/` ×18 | 200 ✓ | Feed + validators green; affiliate new-tab cue present. cable-management: **F-m10** (4 numeric ids). |
| `/changelog/` | 200 ✓ | 10 entries, date-desc. **F-m11** (missing launch entries). |
| `/my-arcade/` | 200 ✓, no ads | Continue-playing (Recently Played), 11 solo cards, P&P section (empty-state + records), storage explanation, Clear control. **F-M11** (clear copy "four solo games"). |
| `/about/` | 200 ✓, no ads | **F-M8** ("current arcade catalog is" the original four). |
| `/help/` | 200 ✓, no ads | Pass & Play help section accurate (handoff, session names, local records, PTP pointer note). |
| `/accessibility/` | 200 ✓, no ads | **F-M9** (stale keyboard inventory; review date predates PR #25). |
| `/advertising/` | 200 ✓, no ads | Accurately describes the single-banner model, Google consent platform, no own ad toggle. |
| `/media/` | 200 ✓, no ads | **F-M8** (boilerplate "ten original games: four solo…"). Kit + brand assets validated. |
| `/privacy/` | 200 ✓, no ads | Local-data section covers Pass & Play keys, exclusions correct (consent + Google storage untouched); Clear control shares the allowlist. |
| `/terms/` | 200 ✓, no ads | No findings. |
| `/404` | 404 ✓ | Custom, no-index, no ads, two escape links. |
| `/health.json` | 200 ✓ | `{status:"ok", site, release, builtAt}`; release fixed at 1.0.0 (CI never sets `PUBLIC_RELEASE`). |
| `/feed.xml`, `/setup/feed.xml` | 200 ✓ | Validators pass (10 / 18 items, no affiliate content in general feed). |
| `/sitemap.xml`, `/sitemap-setup.xml` | 200 ✓ | 91 + setup URLs; ad-free pages correctly excluded/included; robots.txt points at both. |
| Static files | 200 ✓ | `ads.txt` matches publisher config exactly; `CNAME` = nocharge.net; manifest + icon set validated; `security.txt` present. |

Ad placement is consistent by design: banner on all indexable pages except the 11 pages that explicitly pass `showAds={false}` (404, about, accessibility, advertising, changelog, media, my-arcade, privacy, terms, setup index + setup articles). No page has two banners; the banner is in-flow and labelled.

---

## 7. Per-game audit

### Pass & Play (PR #25) — six games
Shared infrastructure (`src/games/shared/pass-play.ts`, `HandoffScreen.astro`): handoff dialog with focus trap, Escape/Enter-continue, focus return, session-only names (never persisted — verified in code and by e2e), one bounded record per game, `keepVisible` only for Pass the Picture, forced-colors treatment. Engines are pure and unit-tested; e2e suite (`pass-and-play.spec.ts`, 39 tests) covers moves, handoff, names, records, keyboard, axe, reduced-motion, pause-recovery. **No functional findings in any of the six** — the findings are art/copy:

| Game | Functional | Art | Copy/other |
|---|---|---|---|
| Tic-Tac-Toe | ✓ (3×3/4×4/match, alternating opener, first-to-3, bounded record) | **F-M1** wrong winning line in all 4 assets | — |
| Dots & Boxes | ✓ (chain rule, 4×4/6×6, 320 px scroll contained) | **F-M7** P2 colour wrong | — |
| Four in a Row | ✓ (7×6/6×5, alternating opener, drop anim gated by reduced motion) | OK (colours match; mid-game state, no false win) | — |
| Reversi | ✓ (standard start verified: black d5/e4, white d4/e5; auto-pass; legal-move hints) | **F-M6** disc colours + alt; F-m4 hint glyph | — |
| Last Token | ✓ (misère, 3 presets, alternating opener) | F-m3 piles vs presets | F-m15 double sound |
| Pass the Picture | ✓ (2–5 passes, shared-visible handoff, undo restores author's pass, local PNG download) | F-m5 palette/canvas mismatch | — |

### Solo games

| Game | Functional | Art | Copy/other |
|---|---|---|---|
| Memory Match | ✓ (baseline; native buttons; best-moves key) | OK | — |
| Word Tile Rush | ✓ (timer starts on first letter; Submit button) | OK | — |
| Color Flip | ✓ (visual + turn-based, pause, focus-on-Play-again) | OK | — |
| Beacon Lattice | ✓ (24 puzzles, progress, only genuine gameplay captures) | OK | — |
| Klondike | ✓ (shared solitaire engine, D/U shortcuts, games-won + best-moves) | **F-M2** clipped/off-centre; F-m1 icon | — |
| FreeCell | ✓ (multi-card move formula, U undo, games-won) | **F-M3** clipped/empty; F-m1 icon | — |
| Nonogram | ✓ (completion recorded once — PR #26 fix verified in code) | OK; F-m19 doc mismatch | — |
| 2048 | ✓ (arrows/WASD, U undo, best-tile) | OK | F-m1 icon; F-m10 (shiki inline style in article) |
| Tile Garden | ✓ (keyboard placement fixed in PR #26) | **F-M4** glyph artefacts; F-m1 icon | — |
| Word Search | Playable (Tab/Enter; themes; hint; puzzles-solved counter) | **F-M5** placeholder cover; F-m2 icon | F-m6 keyboard claim, F-m7 hint, F-m8 unguarded storage, F-m9 ARIA, F-m13 UX edges, F-m14 collection, F-m17 no e2e spec |
| Mini Sudoku | Playable (digits/arrows/Backspace, check/reveal/undo, unique-solution generator) | **F-M5** placeholder cover; F-m2 icon | **F-M12 pencil marks missing**, F-m8, F-m9, F-m17 |

Pause/resume note (not a finding): Word Search and Mini Sudoku controllers implement no-op pause — acceptable because both are untimed; the shared toolbar overlay still blocks the board.

---

## 8. Recommendations (prioritized fix list)

**Batch 1 — Artwork (the reported issue; all are generator/content fixes, no gameplay risk)**
1. **R1 (F-M1):** Fix the tic-tac-toe motif in `scripts/generate-pass-play-art.mjs` to draw the winning indicator along the actual diagonal of the depicted marks (or change the marks so the horizontal line wins), then regenerate the four assets. Add a sanity check to the generator (or a test) that the marked line is a winning line per `findWinner`.
2. **R2 (F-M2, F-M3):** Re-tune `generate-klondike-art.mjs` / `generate-freecell-art.mjs` bounding-box math so nothing clips at any canvas size, and centre the landscape compositions (or deliberately frame the negative space). Regenerate.
3. **R3 (F-M4):** In `generate-tile-garden-art.mjs`, replace emoji `<text>` with vector shapes (or install/point to an emoji font before rasterizing). Regenerate; verify no code-point text survives in the output.
4. **R4 (F-M5):** Produce real covers for Word Search and Mini Sudoku (letter grid with a highlighted word; 6×6 grid with clues) and matching icons; correct the two `alt:` strings.
5. **R5 (F-M6, F-M7, F-m4, F-m3, F-m5-PTP):** Align Pass & Play art with the games: Reversi black/white discs + solid-dot hint marker; Dots & Boxes P2 in #7dd3fc; Pass the Picture swatches equal to `PICTURE_PALETTE` and 4:3 canvas; Last Token piles matching a real preset. Regenerate.
6. **R6 (F-m1, F-m2):** Replace the five shared placeholder icons (and the two title-card icons) with per-game icons.

**Batch 2 — Copy corrections (low risk, high trust impact)**
7. **R7 (F-M8, F-M11, F-M13):** Update the About catalog list, the Media boilerplate, the what-quiet-arcade article, and the five-new-single-player-games article (nine-solo count; "homepage grid shows all nine solo titles" — the grid renders the six featured games) to the current 17-game library (or phrase as "starts with…"); refresh the saves-scores article's key list and Clear-game-data paragraph to the current allowlist (11 solo games' score/progress keys + preferences + six P&P match records); update My Arcade clear-dialog copy to the actual key scope.
8. **R8 (F-M9):** Re-review the accessibility statement against the current 17 games (five fully keyboard Pass & Play games, PTP's documented pointer limit, new solo keyboard paths); bump the review date.
9. **R9 (F-M10):** Either soften to "Solo games each have a field guide; Pass & Play rules are documented on their game pages" or schedule the six Pass & Play guides.
10. **R10 (F-m12):** Fix the Mini Sudoku date: either implement pencil marks (input path + optional persistence) or remove the feature from the description, controls list, and guide.
11. **R11 (F-m11, F-m12, F-m16, F-m20):** Add the missing changelog entries (solo games + sound, Word Search + Mini Sudoku), correct the what-quiet-arcade metadata date, and refresh the stale internal docs: `MY_ARCADE_DATA_MODEL.md` key count, `ART_ASSETS.md` art-script list, `CONTENT_DEPTH_REVIEW.md` and `MANUAL_ACCESSIBILITY_CHECKLIST.md` game counts, `BRAND_GUIDE.md` screenshot table.

**Batch 3 — Word Search / Mini Sudoku hardening + process**
12. **R12 (F-m6, F-m7, F-m13, F-m14):** Add real keyboard navigation to Word Search (arrow-cursor + Enter, matching the rest of the arcade) or downgrade the copy to what exists; make the hint announce only the first letter; clear stale hint highlights; add a visible New-puzzle affordance on completion; tighten the keyboard-collection rationale.
13. **R13 (F-m8, F-m9):** Route both games through the shared guarded storage helpers; complete the grid ARIA (gridcell roles/indices, colcount) or drop `role="grid"`.
14. **R14 (F-m10):** Add an `.htmlvalidate` config (exclude Shiki inline styles as the historical audit intended) and fix the four numeric ids in the cable-management article.
15. **R15 (F-m17):** Add gameplay e2e specs for Word Search and Mini Sudoku (mount, solve flow, keyboard, storage) to match the other 15 games.
16. **R16 (F-m18):** Remove or reference the unreferenced art (hero-square set, landscape-800/1200/1600, committed cover SVGs, Pass & Play `source.svg`) — keep source SVGs in `scripts/` or a non-public location if they should exist at all.
17. **R17 (process, addresses the root cause of F-M1…F-M7, F-m19):** Add a visual-review step for generated artwork to the PR checklist: the art generators are deterministic, so a PR that regenerates art should diff the outputs and at least one reviewer must open the rasters (the current "DOM assertions only" reviews are exactly how all of these shipped). Cheap automation: a CI job that re-runs the generators and fails if committed assets drift from the generators.

**Suggested sequencing:** Batch 1 + R7–R10 are the user-visible fixes (≈ the "fixes come next" scope). Batch 3 is hardening. None of the findings require schema, storage-key, or routing changes, so the fix PRs can land independently without regressing currently-working behaviour.

**Status:** every recommendation above was implemented in this PR (see §9); R14 is the only one whose mechanics changed — `Astro` has no `{#anchor}` heading syntax (tested; the literal braces would render), so the numeric ids were removed at the source instead of remapped.

---

## 10. Re-scan after fixes (regression proof)

Run 2026-08-24 immediately after all fixes, against a fresh `npm run build` and the live preview of `dist/`:

| Check | Result |
| --- | --- |
| `npx vitest run` | 31 files, **325 tests passed** — engines, storage helpers, my-arcade readers and the rewritten clear-list assertions all green |
| `npx astro check` | 0 errors, 0 warnings (34 hints) |
| `npm run build` | **92 pages** built |
| `npm run check:links` | 92 HTML files, 0 broken internal links |
| `npm run validate:sitemap` | 91 public routes |
| `npm run check:assets` | budget passed (8 scripts / 180,205 B; largest image 145,650 B) |
| `npm run validate:html` | **0 problems** (was 6 — F-m10 resolved by `.htmlvalidate.json` + un-numbered headings) |
| `npm run validate:feed` | Setup feed 18 items; general (changelog) feed **12 items** = 10 at audit + the two new entries (F-m11) |
| `validate:brand` / `validate:media-kit` / `validate:brand-media` | all passed (media-kit byte-identical; 92 pages of metadata audited) |
| `npm run validate:setup` | 18 articles, 19 direct paid links |
| `inspect:structured-data` / `inspect:favicons` | passed |
| `npx playwright test --list` | **434 tests in 31 files compile**, including the 14 new Word Search / Mini Sudoku gameplay tests; the full run (and axe/mobile checks) is CI's job — no browser binary exists in this sandbox |
| 94-route live crawl of the built site | 0 missing routes, 0 missing local assets, 0 pages without h1/title, 0 status issues |
| Content greps over `dist/` | About + Media "eleven solo titles" / "seventeen original browser games"; "Last reviewed: August 24, 2026" (accessibility); "Each solo game has a field guide" (/arcade/); "Field guides for the solo arcade games" (/guides/); eleven-game clear dialog with the test-asserted consent sentence verbatim; both new changelog slugs present; named progress keys + `nocharge:passplay:match:*` in the saves-scores article; **zero** `{#…}` brace artifacts and **zero** digit-leading ids in built HTML |
| Art determinism | all 12 generators run back-to-back twice; md5 over every SVG + WebP/JPEG output **identical** between runs, so the new CI drift check cannot flap |
| Puzzle-engine determinism (F-M16) | after the Fisher–Yates change: 5,000-seed simulation of the exact reload-test flow (save → re-derive solution in a separate engine context → fill the first empty) = **0 conflicts**; easy/medium/hard remove exactly 12/16/20 cells at 3,000 seeds each, all unique-solution; Word Search places 12/12 words at 3,000 seeds; same seed twice → identical grids in both engines |
| Art inventory | 17/17 `scripts/art-sources/<slug>/source.svg`; 17/17 distinct `icon.svg`; none of the 45 removed files is referenced by any code, test, script, or built page (grep + crawl) |

**Verdict:** no regressions introduced. The only behavioural changes a user sees are the fixes themselves: the new art, the digit pad / pencil marks / U-C-R keys / focus-retention in Mini Sudoku, the arrow-cursor / hint / New-puzzle behaviour in Word Search, the corrected copy, the two new changelog entries, and the single `win` sound at Last Token round end (asserted by the updated `sound-events.spec.ts`). The 14 new gameplay tests use only deterministic discovery (seed extraction from saved state, DOM-grid word scanning, backtracking solve) so they cannot depend on a particular random puzzle. The first real-browser CI run (32784421863; 6 of 434 failed, after the focus-restore commit had already cured 3 of the previous run's 8) did exactly its job: it isolated F-M16 (the engines' sort-based shuffles consumed a different number of rng draws in Chromium than in the test process, so a saved-seed puzzle did not reproduce in the other engine), the `is-locked` render clobber (F-m13 completed), and three spec bugs above (case-sensitive word scan; the `confirm()` click deadlock; the pinned review date). All are fixed in this PR; the latest CI run is the green gate.

## 9. Fixes applied in this PR (finding → fix)

Applied 2026-08-24 after the user lifted the investigation-only constraint. All 37 findings are resolved; "evidence" is the §10 re-scan unless a hand check is named (artwork was, per the R17 process, opened as rasters after every regeneration).

### 9.1 Artwork (R1–R6, R16)

All 17 packages regenerated from deterministic generators (md5-identical SVG and raster on re-run — no `Date`/`Math.random` in any generator).

| Finding | Fix | Evidence |
| --- | --- | --- |
| F-M1 | `generate-pass-play-art.mjs`: the winning indicator is drawn corner-to-corner along the actual diagonal of the depicted marks | Regenerated tic-tac-toe package; raster opened — diagonal runs through the three X's |
| F-M2 | `generate-klondike-art.mjs`: the fan's *rotated* bounding box is now computed per frame; the stack is shifted so margins are symmetric at 800×800, 1280×720 and 1200×630 (≥ 82 px on every edge). Re-verification during regeneration caught a **second** clip the original generator had (4th card 31 px off the bottom of the landscape frame, 51 px on the social card; the square sat low) — same fix removes it | All 16 rotated corners asserted geometrically per frame + rasters opened |
| F-M3 | `generate-freecell-art.mjs`: eight tableau columns with visible top-card ranks (A 2 3 K Q J 10 4) and a 4 + 4 free-cell/foundation row, all inside the canvas | Square + landscape rasters opened |
| F-M4 | `generate-tile-garden-art.mjs`: vector-drawn plants per tier (sprout / leafy / daisy / blossom) — no emoji `<text>` anywhere in the package | Raster opened: four distinct vector plants, all four tiers visible, no `01F 33F` text |
| F-M5 | `generate-new-game-art.mjs` rewritten: Word Search cover is a real 8×8 letter grid with the QUIET row highlighted; Mini Sudoku cover is a real 6×6 grid with givens, 3×2 box lines and pencil notes; both get per-game icons | Covers + icons opened; `alt:` corrected in `src/content/games/{word-search,mini-sudoku}.md` |
| F-M6 | `generate-pass-play-art.mjs`: discs now black `#10130f` / white `#e8e3d8` with rims, matching `src/games/reversi/styles.css` | Raster opened |
| F-M7 | Dots & Boxes P2 drawn in the game's `#7dd3fc` | Raster opened |
| F-m1, F-m2 | Seven new per-game icons (klondike, freecell, nonogram, twenty-forty-eight, tile-garden, word-search, mini-sudoku); the five shared placeholder icons and the two title-card icons are gone | All 17 `icon.svg` present and distinct |
| F-m3 | Last Token motif is the 3-4-5 preset as coin stacks, middle pile's top coin highlighted | Raster opened |
| F-m4 | Reversi hint marker is the small solid teal dot (`r = cell × 0.09`) matching the in-game legal-move hint | Raster opened |
| F-m5 | Pass the Picture motif: 4:3 paper, swatch row exactly `PICTURE_PALETTE`, in-game stroke colours | Raster opened |
| F-m18 | 45 unreferenced files `git rm`'d (five `hero-square` pairs, `landscape-800/1200/1600` for 2048 + Mini Sudoku, ten public SVG twins); the canonical vectors now live in `scripts/art-sources/<slug>/source.svg` — outside `public/`, never shipped | Crawl shows no missing references; `check:assets` green; `dist/` no longer carries the dead files |

**Process (R17):** new `deploy.yml` step "Check generated art sources for drift" re-runs all twelve generator commands and fails on `git diff --exit-code -- scripts/art-sources` (rasters deliberately excluded — font rasterisation differs across environments); `.github/PULL_REQUEST_TEMPLATE.md` requires a human to open regenerated rasters. This addresses the root cause of F-M1…F-M7 and F-m19 (the "DOM assertions only, never hand-opened images" review process).

### 9.2 Game code (R12–R15, F-M12/M14/M15/M16, F-m21)

| Finding | Fix |
| --- | --- |
| F-M12 | Pencil marks **implemented** (rather than de-listed): Marks toggle button (`aria-pressed`, persists `nocharge:pref:sudoku-pencil-marks`), digits route to `togglePencilMarks` in mark mode, notes rendered with `has-marks`, cleared on new puzzle/restore, ✕ clears. The documented feature now exists, so the description, controls list and guide stay true. The same cross-check found the guide's **U/C/R key claims** also unimplemented — U (undo), C (check) and R (reveal) bindings were added to the game (ignored while the difficulty select has focus) so the guide is true |
| F-M14 | On-screen digit pad (1–6 + ✕ erase) with shared `clearSelected()` for Backspace and ✕ |
| F-M15 | `render()` restores focus to the selected cell whenever focus was inside the grid — covering arrows, digit entry, undo, reveal and erase (a first pass fixed only the arrow path; the pre-CI review of the new e2e specs caught that typed digits still dropped focus to `<body>`). Word Search's `render()` got the same guard (its end-of-selection rebuild killed the arrow cursor). Explicit re-focus in the arrow handlers; roving `tabIndex`. The guard shipped in the commit before the first real CI run, and that run confirmed it: all three Mini Sudoku keyboard tests passed there (their first-run failures had been this bug) |
| F-M16 | Fisher–Yates shuffles in `src/games/mini-sudoku/engine.ts` (`solvedGrid`/`createPuzzle`) and `src/games/word-search/engine.ts` (per-word direction choice) — exactly `n−1` rng draws in a fixed order, so seed → puzzle is bit-identical in every JS engine. The old `sort(() => rng() - 0.5)` consumed a variable, implementation-defined number of draws, which is what made the saved-seed reload test fail in CI (Chromium's V8 and the test process' Node V8 derived different puzzles from the same seed). Re-verified: 5,000-seed reload-flow simulation (0 conflicts), 3,000-seed distributions (exact empties + unique solutions; 12/12 Word Search placements), same-seed-twice grid identity |
| F-m6 | Word Search: real arrow-key cursor navigation (roving focus, Enter/Space select) matching the rest of the arcade; game-page description/controls and the collection reason now state it (F-m14 fixed too) |
| F-m7 | Hint announces `Hint: starting letter X` only (was: the full word in the sr-only region); stale `.is-hint` highlight cleared before the new one |
| F-m8 | Both completion counters go through guarded try/catch helpers (`recordSolved()`); Mini Sudoku save/restore fully guarded |
| F-m9 | `role="grid"` dropped from both boards (cells are fully labelled buttons; complete semantics without gridcell/rowindex boilerplate), `aria-rowcount` dropped with it |
| F-m13 | Word Search: explicit **New puzzle** button with `confirm` when progress exists (theme/size switches confirm too); completed grid gets `.is-locked` (pointer-events off, dimmed). The first CI run caught the lock never sticking: `render()` — called unconditionally at the end of the very click handler that completes the puzzle — removed the class on its rebuild; `render()` now only clears it when the puzzle is not complete (cleared again on `init()`, so New puzzle / theme / size switches start unlocked) |
| F-m15 | Last Token: single `play('win')` at round end (redundant `play('error')` removed); `sound-events.spec.ts` expectation updated to `['place', 'win']` |
| F-m17 | New `tests/e2e/word-search.spec.ts` (7 tests) and `tests/e2e/mini-sudoku.spec.ts` (7 tests): mount, pointer find/solve, full solve → win + storage counter, arrow/Enter keyboard play, hint, new-puzzle confirm, theme persistence, digit pad, arrow focus retention (F-M15 regression), C/U/R keys, pencil marks, reload persistence |
| F-m21 | Implemented the two dead-key persistences — `nocharge:word-search:last-list` (saved on switch, restored on mount) and `nocharge:sudoku:current-puzzle` (saved on every render; restore validates difficulty, 6×6 shape, 0–6 integers and every entry against `createPuzzle(d, seed).solution`) — and removed the five dead `*:high` keys from `GAME_SCORE_IDS` + both test lists |
| First CI run (test-side) | `tests/e2e/word-search.spec.ts`'s `findPlacement` compared lower-cased words against the upper-case DOM letters, so it *always* threw — red-lining all four Word Search tests that scan the grid; now case-insensitive. The same spec's New-puzzle test awaited a click whose `confirm()` was already open before answering the synchronous dialog (deadlock → 30 s timeout); the dialog is now answered inside the event's promise, before the click's await. `tests/e2e/brand-media.spec.ts` pinned the pre-fix `Last reviewed: 2026-08-21`; now `2026-08-24`, matching the F-M8 fix |

Both games also: current-puzzle/last-list state survives reload; `restart` controller now reinitialises cleanly; no schema, routing, or CSP changes.

### 9.3 Copy and content (R7–R11, R14)

| Finding | Fix |
| --- | --- |
| F-M8 | About: catalog now "seventeen games: eleven solo titles — … — and six Pass & Play games … listed in full on the Arcade page". Media: boilerplate lists all 11 solo titles ("seventeen original browser games — eleven solo titles and six Pass & Play"), "Last reviewed: 2026-08-24". what-quiet-arcade: "seventeen browser games now: eleven solo titles (…)". five-new-single-player-games: the "nine solo / grid shows all nine" claim is replaced with 11 + 6 and "the homepage grid features a selection of titles — … — while the full catalog lives on the Arcade page" |
| F-M9 | Accessibility statement rewritten to cover all 17 games (Klondike/FreeCell D/U, Nonogram F/X/Space, 2048 arrows/WASD/U, Tile Garden cursor, Word Search arrows + Enter, Mini Sudoku arrows + keyboard/digit pad + U/C/R, the five keyboard Pass & Play games, Pass the Picture's documented pointer-only limit); "Last reviewed: August 24, 2026" |
| F-M10 | `/arcade/` guide heading → "Each solo game has a field guide."; `/guides/` → "Field guides for the solo arcade games". (The "full guide" line inside `/arcade/`'s solo-only section is accurate there and was left.) |
| F-M11 | My Arcade clear dialog → "This removes best scores and saved progress for all eleven solo games — including Memory Match fewest moves and Beacon Lattice puzzle progress — the shared sound preference, Recently Played, and the six Pass & Play match records. It does not change your analytics consent choice, …" (the `my-arcade.spec.ts`-asserted consent sentence preserved verbatim); stale page comments corrected |
| F-M13 | saves-scores article: key list rewritten to the real keys (named per-game keys, `nocharge:pref:*` group, Recently Played, six bounded `nocharge:passplay:match:*` records); clearing paragraph now includes the six P&P records; reviewed 2026-08-24 |
| F-m11 | Two changelog entries added — 2026-08-22 (five solo games + sound pass, `launch`) and 2026-08-23 (Word Search + Mini Sudoku, `launch`) → 12 entries, date-desc order intact |
| F-m12 | what-quiet-arcade and five-new-single-player-games `updated: 2026-08-24` (content and metadata now in the same era) |
| F-m14 | Keyboard collection Word Search reason → "Arrow keys move a focus cursor across a calm, untimed grid and Enter selects cells — complete play without a pointer." (true after the F-m6 fix) |
| F-m16 | `MY_ARCADE_DATA_MODEL.md` §4 rewritten: thirty-one keys — five `:high`, eleven named progress keys, eight preference keys, Recently Played, six bounded match records |
| F-m19 | `NEW_SOLO_GAMES_VISUAL_REVIEW.md`: nonogram described as the "plus/cross pattern" |
| F-m20 | `ART_ASSETS.md` (full repro list + 2026-08-24 regeneration section), `CONTENT_DEPTH_REVIEW.md` ("seventeen games"), `MANUAL_ACCESSIBILITY_CHECKLIST.md` ("all seventeen games (eleven solo plus the six Pass & Play games…)"), `BRAND_GUIDE.md` screenshot table ("original four solo games only; none for the seven later solo games or the six Pass & Play games" + "generated decorative art is never presented as a live-game screenshot for any game") |
| F-m10 | `.htmlvalidate.json` created: `html-validate:recommended` with `no-inline-style` off (Shiki token colours — the historical exclusion intent, finally with a real config). The four numeric ids fixed at the source: the cable-management step headings lost their "1.–4." prefixes (no anchor references exist anywhere in the repo; Astro has no `{#anchor}` syntax — tested, the braces would render literally). `npm run validate:html` → **0 problems** |
| Guide drift | Word Search guide: controls rewritten (arrow-cursor + Enter/Space, Show word list / Hint / New-puzzle behaviours); Mini Sudoku guide: digit pad, Marks toggle, U/C/R documented — both now match the shipped code (`updated: 2026-08-24`) |

---

## Appendix — evidence pointers

- Winning-line math: `src/games/tic-tac-toe/engine.ts` `findWinner` vs. `scripts/generate-pass-play-art.mjs` tic-tac-toe motif (dashed line at `y0 + 2*cell + cell/2`).
- Colour sources: `src/games/dots-and-boxes/main.ts` (`PLAYER_COLORS`), `src/games/reversi/styles.css` (`rev__cell--black/--white`), `src/games/pass-the-picture/engine.ts` (`PICTURE_PALETTE`), `src/games/pass-the-picture/main.ts` (canvas 960×720).
- Emoji artefact: `scripts/generate-tile-garden-art.mjs` (`tierEmoji` in `<text>`) vs. `src/games/tile-garden/main.ts` (in-browser emoji, unaffected).
- Placeholder icons: identical md5 `1ff8eb1dc5b7c5f080f5e6fca3252aea` across five `icon.svg` files; usage in `src/pages/guides/[slug].astro` (`guide-play__icon`, 44 px).
- Pencil marks: `src/content/games/mini-sudoku.md` (controls list), `src/content/guides/mini-sudoku.md` (§Pencil marks), `src/games/mini-sudoku/main.ts` (`marks` never written), `src/lib/local-game-data.ts` (`sudoku-pencil-marks`), `src/lib/my-arcade/my-arcade.test.ts` (key asserted in clear list).
- Stale counts: `src/pages/about.astro`, `src/pages/media.astro:77,90`, `src/content/articles/what-quiet-arcade-means-at-nocharge.md:16`, `src/content/articles/five-new-single-player-games-for-quiet-arcade.md:56-58`, `src/pages/my-arcade.astro:227`.
- Stale storage-key list (F-M13): `src/content/articles/how-nocharge-saves-scores-without-an-account.md:22-30` (seven keys, original four only) and `:54` (clear paragraph omits P&P records) vs. `CLEARABLE_GAME_DATA_KEYS` in `src/lib/local-game-data.ts` and the accurate Privacy page.
- Stale internal docs (F-m20): `docs/ART_ASSETS.md:3` (missing the seven post-PR #26 art scripts in `package.json`), `docs/CONTENT_DEPTH_REVIEW.md:8` ("ten games"), `docs/MANUAL_ACCESSIBILITY_CHECKLIST.md:7` ("all ten games, four solo plus six Pass & Play"), `docs/BRAND_GUIDE.md:32` (screenshot table describes the four-game era).
- Guide coverage: 11 files in `src/content/guides/` vs. 17 games; arcade CTAs at `src/pages/arcade.astro` (arcade-guide-cta) and `src/pages/guides/index.astro` (all-guides-heading).
- html-validate failures: `npm run validate:html` (6 errors) — Shiki inline styles in `dist/articles/twenty-forty-eight-…` and `dist/guides/twenty-forty-eight`; numeric ids in `dist/setup/cable-management-for-a-calm-desk`.
- Crawl: 94 HTML routes, 0 missing assets/routes (this audit's scratch crawler, not committed).
- CI gate: `.github/workflows/deploy.yml` — art-drift check (12 generator commands + `git diff --exit-code -- scripts/art-sources`, added in this PR) → `npm run check` → `npm run build` → `playwright test --project=chromium` → GitHub Pages.

**Fix-phase evidence (this PR):**
- Art regeneration: `scripts/art-sources/` (17 canonical `source.svg` files, outside `public/`); determinism verified by md5-comparing SVG + raster output across two consecutive runs; every regenerated raster hand-opened (see §9.1).
- html-validate: `.htmlvalidate.json` (recommended ruleset, `no-inline-style` off for Shiki); the cable-management headings un-numbered in `src/content/setup/cable-management-for-a-calm-desk.md` (no anchor references exist in the repo).
- New gameplay specs: `tests/e2e/word-search.spec.ts`, `tests/e2e/mini-sudoku.spec.ts` (14 tests; `npx playwright test --list` = 434 tests in 31 files).
- Process: `.github/PULL_REQUEST_TEMPLATE.md` (art/storage/game-count checklist).
- Storage truth: `src/lib/local-game-data.ts` (`GAME_SCORE_IDS` back to the five real `:high` keys), `src/lib/my-arcade/my-arcade.test.ts` (clear list = the real keys), the two implemented persistences in `src/games/word-search/main.ts` / `src/games/mini-sudoku/main.ts`.
- Pre-existing F-M15 verification: `git show HEAD:src/games/mini-sudoku/main.ts` (arrow handler re-rendered without re-focus).
- F-M16: CI run 32784421863 annotations (the reload test's "Filled N" vs. "That digit conflicts with this row, column, or box." on all three attempts) vs. the 5,000-seed single-engine simulation passing identically — the disagreement can only live in the two engines' `Array.prototype.sort` comparator-call counts; the Fisher–Yates fix removes the class of issue (scratch simulation, not committed).
