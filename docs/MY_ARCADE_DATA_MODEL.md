# My Arcade local data model

Audit of every value NoCharge already stores in the visitor's browser, and the read-only model
[`/my-arcade/`](../src/pages/my-arcade.astro) derives from it.

This document contains **no real visitor data and no screenshots of local storage**. Every value shown below is an
invented representative example written for this audit.

Reviewed 2026-08-21 against `src/games/`, `src/components/ConsentManager.astro`, and `src/pages/privacy.astro`; extended 2026-08-22 for the six `nocharge:passplay:match:*` keys read by the Pass &amp; Play section.

## 1. Scope of the audit

- Storage mechanisms in use: `window.localStorage` only.
- No NoCharge game uses IndexedDB, `sessionStorage`, the Cache API, or its own cookies. The only `document.cookie`
  access in the repository is the analytics tag cleanup in `src/layouts/BaseLayout.astro`, which is unrelated to game
  data and is not read by My Arcade.
- Third-party storage (Google Analytics, AdSense, and Google Privacy & messaging) is written and owned by Google. My
  Arcade never reads it and never removes it.

## 2. Existing keys

| Key | Owner (source of truth) | Data shape | Meaning | Safe to display | Cleared by Clear Game Data | Malformed data already fails safely | Migration / compatibility layer needed |
|---|---|---|---|---|---|---|---|
| `nocharge:memory-match:best-moves` | `src/games/memory-match/main.ts` | Decimal integer string, e.g. `"14"` | Fewest moves used to clear the 4×4 board (8 pairs). A move is counted when a second card is revealed. Lower is better. | **Yes** — this is the metric the game itself labels "Best" | Yes | Yes — the game guards with `Number.isFinite`; the reader additionally rejects `<= 0`, non-finite, and over-long values | No |
| `nocharge:memory-match:high` | `src/games/shared/storage.ts` via `saveScore`, written by Memory Match as `max(0, 1000 - moves * 10)` | Decimal integer string, e.g. `"860"` | A derived higher-is-better mirror so Memory Match has a value in the shared score store. It is not a score any player is shown. | **No** — displaying it would invent a metric the game never presents | Yes | Yes — `parseStoredScore` falls back to `0` | No |
| `nocharge:word-tile-rush:high` | `src/games/word-tile-rush/main.ts` via `saveScore` | Decimal integer string, e.g. `"4200"` | Highest score saved from a run. Each accepted word adds `length² × 10`. | **Yes** | Yes | Yes — `parseStoredScore` plus reader range checks | No |
| `nocharge:color-flip:high` | `src/games/color-flip/main.ts` via `saveScore` (`GAME_ID`) | Decimal integer string, e.g. `"12"` | Best Visual-mode score: tiles matched at the dashed checkpoint during a timed canvas run. | **Yes**, labelled with the mode | Yes | Yes | No |
| `nocharge:color-flip-turn-based:high` | `src/games/color-flip/main.ts` via `saveScore` (`TURN_BASED_GAME_ID`) | Decimal integer string, e.g. `"7"` | Best Turn-based (untimed) score: correct colour steps before a wrong step. Stored separately from Visual mode. | **Yes**, labelled with the mode | Yes | Yes | No |
| `nocharge:beacon-lattice:high` | `src/games/beacon-lattice/progress.ts` (`saveProgress` calls `saveScore(GAME_ID, completed.length)`) | Decimal integer string, e.g. `"2"` | Mirror of the number of solved puzzles. | **No** — the progress record below is the authoritative source, so the mirror is not read | Yes | Yes | No |
| `nocharge:pref:beacon-lattice-progress` | `src/games/beacon-lattice/progress.ts` | JSON object `{ currentId: string, completed: string[], bests: Record<string, number>, lastSolved: Record<string, number> }` | `completed` = puzzle ids solved at least once. `currentId` = the puzzle the game will reopen. `bests[id]` = the player's own lowest recorded beacon count for that puzzle. `lastSolved[id]` = the beacon count of the most recent solve. | **Yes**, partially: solved count, the open puzzle's title, and the player's own fewest recorded beacon count for that puzzle | Yes | Yes — `normalizeProgress()` coerces every field and returns defaults for anything unexpected | No. Records written before `bests`/`lastSolved` existed normalize to `{}` and are covered by a unit test |
| `nocharge:pref:game-muted` | `src/games/shared/audio.ts` | JSON boolean, e.g. `true` | The shared persistent mute preference. | **No** — it is a preference, not a result, and showing it would add noise without helping anyone return to a game | Yes | Yes — `parseStoredPref` falls back | No |
| `nocharge:pref:recently-played` | `src/games/shared/recently-played.ts` | JSON array of at most 4 objects `{ gameId: string, playedAt: number }`, newest first | The last meaningful play per game. Written only by `signalMeaningfulGameInteraction`, which each game dispatches after a real in-game action. | **Yes** — the game identity and a restrained date | Yes | Yes — `parseRecentlyPlayed` drops non-objects, non-string ids, and non-finite or negative timestamps, then dedupes and re-sorts | No |
| `nocharge:consent` | `src/components/ConsentManager.astro` | JSON `{ version: number, analytics: boolean, updatedAt: string }` | The separate NoCharge analytics consent choice. | **Never displayed and never read** by My Arcade | **No — deliberately excluded** | Yes (own `try`/`catch`) | Not applicable |
| `nocharge:passplay:match:tic-tac-toe` | `src/games/tic-tac-toe/main.ts` via `savePassPlayMatchRecord` | JSON object, e.g. `{"gameId":"tic-tac-toe","mode":"3×3 · 3 in a row","result":"p1","score":[1,0],"finishedAt":1787390175327}` | The most recent Tic-Tac-Toe match. Overwritten in place — there is no history and no second key. | **Yes**, as the Pass &amp; Play section row: mode, result, match score, date | Yes | Yes — `parsePassPlayMatchRecord` rejects malformed, oversized (> 2 KB), or out-of-range values, and a record naming another game under the key is ignored | No |
| `nocharge:passplay:match:dots-and-boxes` | `src/games/dots-and-boxes/main.ts` | Same shape; `mode` is `"4×4 boxes"` or `"6×6 boxes"`; `score` is the final box count | The most recent Dots &amp; Boxes game. | **Yes** | Yes | Yes | No |
| `nocharge:passplay:match:four-in-a-row` | `src/games/four-in-a-row/main.ts` | Same shape; `mode` is `"7×6 · standard"` or `"6×5 · small"`; `score` is `[1,0]`/`[0,1]`/`[0,0]` | The most recent Four in a Row game. | **Yes** | Yes | Yes | No |
| `nocharge:passplay:match:reversi` | `src/games/reversi/main.ts` | Same shape; `mode` is `"8×8 board"`; `score` is the final black–white disc count | The most recent Reversi game. | **Yes** | Yes | Yes | No |
| `nocharge:passplay:match:last-token` | `src/games/last-token/main.ts` | Same shape; `mode` is the preset label; `score` is `[1,0]` or `[0,1]` | The most recent Last Token round. | **Yes** | Yes | Yes | No |
| `nocharge:passplay:match:pass-the-picture` | `src/games/pass-the-picture/main.ts` | Same shape with `result:"shared"`; `score` is strokes drawn per player | The most recent Pass the Picture drawing. Cooperative — there is no winner to display. | **Yes** (shown as "Shared picture") | Yes | Yes | No |
| Google Privacy & messaging / AdSense / Analytics storage | Google | Owned by Google | Advertising and analytics consent and measurement | **Never read** | **No — never touched** | Not applicable | Not applicable |

### Per-game summary of what My Arcade shows

| Game | Source key(s) read | Metric label(s) shown | Why nothing else is shown |
|---|---|---|---|
| Memory Match | `nocharge:memory-match:best-moves` | **Fewest moves** | `:high` is a derived mirror, not a player-facing score. There is no stored completion count, no time, and no streak, so none is displayed. |
| Word Tile Rush | `nocharge:word-tile-rush:high` | **Best score** | The game stores only a best score. Words played, longest word, and time survived are not persisted, so they are not invented. |
| Color Flip | `nocharge:color-flip:high`, `nocharge:color-flip-turn-based:high` | **Best score, Visual mode** and **Best score, Turn-based mode** | The two modes are genuinely separate keys, so they are shown separately and each only when it exists. There is no combined Color Flip score. |
| Beacon Lattice | `nocharge:pref:beacon-lattice-progress` | **Puzzles solved** (`n of 24`), **Puzzle open**, **Fewest beacons recorded** | Authored `par` is an editorial target, not a proven optimum, so it is never shown or implied. Solved ids that no longer exist in the puzzle catalogue are dropped rather than counted. |
| Recently Played | `nocharge:pref:recently-played` | Game identity and a `Today` / `Yesterday` / `Aug 21` date | Exact times, seconds, session counts, and "time played" are not stored and are not implied. |
| Pass &amp; Play games (six rows) | the six `nocharge:passplay:match:*` keys | **Mode**, **Result** (Player 1 / Player 2 / Draw / Shared picture), **Match score**, **Date played** | Only the single most recent record per game is stored and shown — never a history. Player names are session-only and never stored, so a row can never contain one. Pass the Picture has no winner; its cooperative result is labelled "Shared picture" rather than inventing a draw. |

## 3. Read-only aggregation layer

`src/lib/my-arcade/`

| Module | Responsibility |
|---|---|
| `types.ts` | `GameId`, `ReadableStorage`, `LocalGameSummary`, `LocalDashboard`. Nothing here is persisted. |
| `readers.ts` | One reader per documented key. Reuses `parseStoredScore`, `parseStoredPref`, `normalizeProgress`, and `parseRecentlyPlayed` instead of restating any scoring rule. |
| `summary.ts` | Turns readings into labelled display metrics and the whole-page model. |
| `format.ts` | Pure date and number formatting. |
| `mount.ts` | DOM controller for `/my-arcade/`. Reads once per render and keeps nothing. |
| `passplay.ts` | Read-only reader for the Pass &amp; Play section: reads exactly the six `nocharge:passplay:match:*` keys (never enumerating storage), reuses the game's own parser, and returns one display row per game with a valid record. |

Guarantees, each covered by a unit test in `src/lib/my-arcade/my-arcade.test.ts`:

- Only the documented keys above are read. Storage is never enumerated, so a key this audit does not list can never
  reach the page.
- Cookies, IndexedDB, and Google consent/CMP storage are never inspected.
- Nothing is written, removed, or uploaded during a read. The normalized model is derived on every render and is
  **never stored back**, so there is no second "My Arcade database".
- Values that are missing, malformed, oversized (over 64 KB, or over 32 characters for a score), or outside a
  plausible range are treated as "no saved result" rather than displayed.
- A blocked or throwing `localStorage` produces the storage-unavailable state, never an exception during page
  initialisation.

## 4. Clear Game Data

`src/lib/local-game-data.ts` is the single allowlist. `/privacy/` and `/my-arcade/` both import it, so the two
controls cannot diverge.

It removes exactly the fifteen game keys in the table above: the nine solo keys plus the six bounded
`nocharge:passplay:match:*` records, so one confirmed flow clears both My Arcade sections together. It deliberately
does **not** remove `nocharge:consent`, Google's Privacy & messaging storage, or any other origin storage. A unit
test asserts the exact list and the untouched keys, and `tests/e2e/my-arcade.spec.ts` asserts the same thing in a
real browser.

## 5. Recently Played rules preserved

My Arcade reuses `nocharge:pref:recently-played` and creates no second history key. The existing rules are unchanged:
at most four records, newest first, a repeat play updates the existing record, and only a valid in-game action
records play. Page views, toolbar controls, consent interactions, and advertisement interactions do not. Opening
`/my-arcade/` performs reads only, so it cannot add a game, change ordering, change a timestamp, or emit the
meaningful-play event.

## New metric keys (PR #26, 2026-08-22)

Five new solo games added their metric keys to the allowlist:

| Key | Owner | Data shape | Meaning | Cleared by Clear Game Data |
|---|---|---|---|---|
| `nocharge:klondike:games-won` | `src/games/klondike/main.ts` | Decimal integer string | Total Klondike deals completed | Yes |
| `nocharge:klondike:best-moves` | `src/games/klondike/main.ts` | Decimal integer string | Fewest moves for a won Klondike deal | Yes |
| `nocharge:freecell:games-won` | `src/games/freecell/main.ts` | Decimal integer string | Total FreeCell deals completed | Yes |
| `nocharge:nonogram:puzzles-revealed` | `src/games/nonogram/main.ts` | Decimal integer string | Nonogram puzzles completed | Yes |
| `nocharge:2048:best-tile` | `src/games/twenty-forty-eight/main.ts` | Decimal integer string | Highest tile value reached | Yes |
| `nocharge:tile-garden:best-tier` | `src/games/tile-garden/main.ts` | Decimal integer string (0-3) | Highest growth tier reached | Yes |
| `nocharge:pref:color-flip-rotation` | `src/games/color-flip/main.ts` | JSON string: `"never"`, `"every-10"`, `"every-5"` | Color rotation preference | Yes |

All new keys use exact prefixes documented above. The `CLEARABLE_GAME_DATA_KEYS` allowlist in `src/lib/local-game-data.ts` is the single source of truth.

## Sound and new puzzle keys

Sound preferences use exact localStorage prefixes `nocharge:pref:sound-enabled`, `nocharge:pref:sound-volume`, and `nocharge:pref:ambient-sound`; `nocharge:pref:game-muted` remains the master mute. Word Search uses `nocharge:word-search:puzzles-solved` and `nocharge:word-search:last-list`. Mini Sudoku uses `nocharge:sudoku:puzzles-solved`, `nocharge:sudoku:current-puzzle`, and `nocharge:pref:sudoku-pencil-marks`. Clear Game Data removes these keys and never removes consent storage.
