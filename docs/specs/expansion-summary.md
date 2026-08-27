# Expansion specs — summary

Each shipped item has a short spec here. Full DoD per item is in `IMPLEMENTATION_STATUS.md`;
behavior and acceptance criteria are listed below so a future editor can verify against code.

## Games

### minesweeper
- Routes: `/games/minesweeper/`, `/guides/minesweeper/`, article `/articles/minesweeper-calm-clearing-on-nocharge/`.
- Behavior: 9×9 (10 mines), 16×16 (40), 16×30 (99); first reveal safe (neighbourhood protected when it fits — stated in guide); flag mode + F key; chord on Enter/double-click when flags match count; untimed; elapsed seconds recorded only after a win.
- Storage: `nocharge:minesweeper:games-won`, `nocharge:minesweeper:best-time`, `nocharge:pref:minesweeper-last-size`.
- A11y: roving tabindex, row/column labels, non-color states, yes keyboard.
- Acceptance: `src/games/minesweeper/engine.test.ts` (6 tests) — mine counts, first-click safety, flag blocking, win detection, chord rules.

### hangman
- Routes: `/games/hangman/`, `/guides/hangman/`, article `/articles/hangman-accessible-letter-entry/`.
- Behavior: 4 themes, 6-miss figure + text count, alphabetical on-screen keyboard, type-any-letter input, no timer.
- Storage: `nocharge:hangman:games-solved`, `nocharge:pref:hangman-last-theme`.
- Acceptance: `src/games/hangman/engine.test.ts` — win/loss, repeat/non-letter rejection, reveal format.

### lights-out
- Routes: `/games/lights-out/`, guide, article `/articles/lights-out-solvable-by-construction/`.
- Behavior: 5×5 toggle cross; generator = press-from-solved (invertible by construction); untimed; moves metric.
- Storage: `nocharge:lights-out:puzzles-solved`, `nocharge:lights-out:best-moves`.
- Acceptance: engine tests — toggle neighbours, solvable non-trivial generation, win+move counting.

### simon
- Routes: `/games/simon/`, guide, article `/articles/simon-calm-pattern-same-rules/`.
- Behavior: 4 pads, 12-pad target; Calm pattern = static highlight + longer gaps + announced names; rules identical.
- Storage: `nocharge:simon:best-length`, `nocharge:pref:simon-calm`.
- Acceptance: engine tests — sequence, wrong-pad loss, target win, out-of-range rejection.

### sudoku-9x9
- Routes: `/games/sudoku-9x9/`, guide, two articles (uniqueness; 6×6 vs 9×9).
- Behavior: 9×9, easy/medium/hard = 42/34/28 givens; solver-verified uniqueness; pencil marks; check/reveal-cell; current-puzzle resume.
- Storage: `nocharge:sudoku9:current-puzzle`, `nocharge:sudoku9:puzzles-solved`, shared `pref:sudoku-pencil-marks`.
- Acceptance: engine tests — valid grid, given counts, uniqueness, move validation, pencil toggle.

### gomoku
- Routes: `/games/gomoku/`, guide, article `/articles/gomoku-free-style-variant/`.
- Behavior: 15×15 free-style; five-or-more wins; no overline restriction/captures/opening rules (stated); Pass & Play handoff with visible board.
- Storage: `nocharge:passplay:match:gomoku` (one record).
- Acceptance: engine tests — occupied-cell rejection, row/line wins, diagonal detection, size constants.

### nine-mens-morris
- Routes: `/games/nine-mens-morris/`, guide, article `/articles/nine-mens-morris-rules-variant/`.
- Behavior: 24-point classic board; 9 stones; mills remove one; mill-stone protection unless forced; flying at 3; blocked player loses; explicit removal-pending state.
- Storage: `nocharge:passplay:match:nine-mens-morris`.
- Acceptance: engine tests — placement, removal, protection, sub-3 loss, adjacency, flying, blocked detection.

### word-loom
- Routes: `/games/word-loom/`, guide, article `/articles/word-loom-original-word-game-design/`; daily slot live on `/daily/`.
- Behavior: original 5-letter word game; 6 guesses; symbol+color feedback (✓ ~ ✗) with announced labels; duplicate-letter cap documented; daily = device-local date seed; practice mode; streak on device only.
- Storage: `nocharge:daily:word-loom:streak`, `nocharge:daily:word-loom:solved`.
- Acceptance: engine tests — perfect guess, present/absent, duplicate cap, seed stability, date format.
- IP: no trademark name/trade dress; original naming, word list, and ruleset documented.

### checkers
- Routes: `/games/checkers/`, guide, article `/articles/checkers-variant-and-mandatory-captures/`.
- Behavior: English draughts 8×8, 12 pieces; men forward, kings any diagonal (no flying); mandatory captures; multi-jump continues the same turn; simple capture rule (longest chain NOT forced — stated).
- Storage: `nocharge:passplay:match:checkers`.
- Acceptance: engine tests — setup, forward move, mandatory-capture blocking, promotion, multi-jump continuation, capture targets.

## Tools (all client-side, no uploads)

- `game-finder`: five questions → alphabetical shortlist from catalog facts; not a ranking.
- `session-planner`: minutes × players × input → matching games with estimated runs.
- `random-activity`: uniform random pick; no claims; nothing stored.
- `storage-inspector`: read-only scan of `nocharge:*` keys with known-doc lookup; clear CTA on Privacy.
- `contrast-checker`: WCAG ratios + Quiet Arcade palette pairs.
- `reduced-motion-tester`: live media query read + what NoCharge changes; explanation of limits.
- `touch-target-checker`: draw-and-measure CSS px vs 24/44 thresholds; spacing demo.
- `nonogram-clue-calculator`: arrangement enumeration + forced cells; cap 200 arrangements; educational.
- `solitaire-comparator`: Klondike/FreeCell/planned Spider table.
- `sudoku-helper`: candidate display for 6×6/9×9; hidden-single teaching; labeled reveal.
- `focus-order-demo`: real buttons, visible focus, tab-order lesson.
- `word-scoring`: linear vs length-squared curves + explanation of Word Tile Rush family.
- Ambient Mixer: `?texture=&vol=` query params (no auto-play).
- Zoom Visualizer v2: device presets + one-click 400% reflow (320 CSS px).

## Content/IA

- `/learn/` hub + 8 definitional pages + `/learn/glossary/` (DefinedTermSet).
- 6 new collections; updated keyboard-friendly with verified flag; Pass & Play completeness.
- `/daily/` hub (Word Loom slot live; crossword/sudoku slots planned).
- Registry facts page (build-time generated), game release log on `/changelog/`, accessibility test matrix.
- 12 new articles; setup hub pairings (topic → tool → 3 games); llms.txt + llms-full.txt build-time endpoints.
- Privacy storage key table (auto from allowlist, with drift test).

Catalog totals after this expansion: 26 games, 26 guides, 47 articles, 11 collections, 15 tools, 366 public pages.
