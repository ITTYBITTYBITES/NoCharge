# Functional QA Test Matrix for Published Games

**Verification Date:** August 25, 2026  
**Scope:** Complete functional gameplay verification, engine unit tests, desktop and mobile interaction testing, accessibility, persistence, audio behavior, pause/recovery lifecycle, and mobile stage compatibility for all 17 published games on NoCharge.

---

## Summary Matrix

| Game | Route | Engine / Unit Tests | Desktop Playwright E2E Tests | Mobile Playwright E2E Tests | Manual Real-Device Checks Required | Mobile Stage & Game Mode Strategy |
|---|---|---|---|---|---|---|
| **Memory Match** | `/games/memory-match/` | `src/games/memory-match/engine.test.ts` (11 tests) | `tests/e2e/games.spec.ts`, `tests/e2e/platform-maturity.spec.ts` | `tests/e2e/mobile-games.spec.ts` (320, 360, 375, 390, 412) | VoiceOver on iOS Safari card announcements; Android Chrome rapid double-tap | 4×4 grid fits 320px portrait without scrolling; Game Mode launch via Play button |
| **Word Tile Rush** | `/games/word-tile-rush/` | `src/games/word-tile-rush/engine.test.ts` (9 tests) | `tests/e2e/games.spec.ts`, `tests/e2e/platform-maturity.spec.ts` | `tests/e2e/mobile-games.spec.ts` | Touch drag trajectory on low-end capacitive touchscreens | 6×8 grid fits 320px portrait; pointer drag with 1-step backtrack |
| **Color Flip** | `/games/color-flip/` | `src/games/color-flip/engine.test.ts` (12 tests), `checkpoint-rules.test.ts` (8), `color-selection.test.ts` (10) | `tests/e2e/color-flip-redesign.spec.ts`, `tests/e2e/games.spec.ts` | `tests/e2e/mobile-games.spec.ts` | High-contrast display mode on OLED vs LCD screens | 5×5 viewport grid with G/B/A/R shortcuts; turn-based untimed mode alternative |
| **Beacon Lattice** | `/games/beacon-lattice/` | `src/games/beacon-lattice/quality.test.ts` (47), `patterns.test.ts` (39), `progress.test.ts` (2), `screenshots.test.ts` (3) | `tests/e2e/beacon-lattice.spec.ts`, `tests/e2e/beacon-screenshots.spec.ts` | `tests/e2e/mobile-games.spec.ts` | Touch target accuracy on compact 5×5 and 7×7 grids | Responsive grid sizing; exact coverage calculation |
| **Tic-Tac-Toe** | `/games/tic-tac-toe/` | `src/games/tic-tac-toe/engine.test.ts` (15 tests), `src/games/shared/pass-play.test.ts` (18) | `tests/e2e/pass-and-play.spec.ts` | `tests/e2e/mobile-games.spec.ts`, `tests/e2e/pass-and-play.spec.ts` | Physical two-player device handoff handling | 3×3 and 4×4 modes fit 320px without scrolling; Pass & Play handoffs |
| **Dots & Boxes** | `/games/dots-and-boxes/` | `src/games/dots-and-boxes/engine.test.ts` (11 tests), `src/games/shared/pass-play.test.ts` (18) | `tests/e2e/pass-and-play.spec.ts` | `tests/e2e/mobile-games.spec.ts`, `tests/e2e/pass-and-play.spec.ts` | Thin edge line hit-testing on small screens (6×6 mode) | Responsive `--dab-unit` scaling fits 320px without horizontal scroll |
| **Four in a Row** | `/games/four-in-a-row/` | `src/games/four-in-a-row/engine.test.ts` (11 tests), `src/games/shared/pass-play.test.ts` (18) | `tests/e2e/pass-and-play.spec.ts` | `tests/e2e/mobile-games.spec.ts`, `tests/e2e/pass-and-play.spec.ts` | Column drop button tap size and gravity animation fluidity | 7×6 standard and 6×5 small boards fit 320px without scrolling |
| **Reversi** | `/games/reversi/` | `src/games/reversi/engine.test.ts` (13 tests), `src/games/shared/pass-play.test.ts` (18) | `tests/e2e/pass-and-play.spec.ts` | `tests/e2e/mobile-games.spec.ts`, `tests/e2e/pass-and-play.spec.ts` | Disc flip visual cue visibility in outdoor daylight | 8×8 standard board fits 320px; toggleable legal moves cues |
| **Last Token** | `/games/last-token/` | `src/games/last-token/engine.test.ts` (8 tests), `src/games/shared/pass-play.test.ts` (18) | `tests/e2e/pass-and-play.spec.ts` | `tests/e2e/mobile-games.spec.ts`, `tests/e2e/pass-and-play.spec.ts` | Button row tap target spacing when piles have 1 token left | Misère play rules; token rows fit 320px without scroll |
| **Pass the Picture** | `/games/pass-the-picture/` | `src/games/pass-the-picture/engine.test.ts` (9 tests), `src/games/shared/pass-play.test.ts` (18) | `tests/e2e/pass-and-play.spec.ts` | `tests/e2e/mobile-games.spec.ts`, `tests/e2e/pass-and-play.spec.ts` | Apple Pencil / stylus vs finger drawing stroke precision | 4:3 canvas aspect ratio fits 320px; pointer-only drawing documented |
| **Klondike** | `/games/klondike/` | `src/games/klondike/engine.test.ts` (14 tests) | `tests/e2e/solo-new-games.spec.ts` | `tests/e2e/mobile-games.spec.ts` | Single-tap vs double-tap foundation auto-move feel | Mobile no-scroll layout: 7-column grid with proportional card overlap; Game Mode launch |
| **FreeCell** | `/games/freecell/` | `src/games/freecell/engine.test.ts` (14 tests) | `tests/e2e/solo-new-games.spec.ts` | `tests/e2e/mobile-games.spec.ts` | 8-column layout readability on small screens (320px) | Mobile no-scroll layout: 8-column grid with proportional cascade overlap; Game Mode launch |
| **Nonogram** | `/games/nonogram/` | `src/games/nonogram/engine.test.ts` (12 tests) | `tests/e2e/solo-new-games.spec.ts` | `tests/e2e/mobile-games.spec.ts` | Clue number legibility and touch drag cell marking | 5×5 and 10×10 puzzles fit 320px; text clues accessibility alternative |
| **Twenty Forty-Eight** | `/games/twenty-forty-eight/` | `src/games/twenty-forty-eight/engine.test.ts` (11 tests) | `tests/e2e/solo-new-games.spec.ts` | `tests/e2e/mobile-games.spec.ts` | Touch swipe gesture threshold vs scroll on mobile Safari | Responsive 4×4 grid fits 320px; swipe and arrow keys |
| **Tile Garden** | `/games/tile-garden/` | `src/games/tile-garden/engine.test.ts` (12 tests) | `tests/e2e/solo-new-games.spec.ts` | `tests/e2e/mobile-games.spec.ts` | Cascade animation frame rate on battery saver mode | Responsive 8×8 grid fits 320px without internal scroll; center 2×2 bloom zone cues |
| **Word Search** | `/games/word-search/` | `src/games/word-search/engine.test.ts` (21 tests) | `tests/e2e/word-search.spec.ts` | `tests/e2e/mobile-games.spec.ts`, `tests/e2e/word-search.spec.ts` | Diagonal touch drag selection precision | Responsive 8×8 and 10×10 grids fit 320px without internal scroll; touch drag path |
| **Mini Sudoku** | `/games/mini-sudoku/` | `src/games/mini-sudoku/engine.test.ts` (4 tests) | `tests/e2e/mini-sudoku.spec.ts` | `tests/e2e/mobile-games.spec.ts`, `tests/e2e/mini-sudoku.spec.ts` | Keypad touch target responsiveness and pencil mark clarity | 6×6 grid with 2×3 blocks; keypad fits 320px without scroll |

---

## Detailed Game Functional Coverage

### 1. Memory Match
- **Mechanics Verified:**
  - Card flip animation with 3D transform and face-up state.
  - Mismatch reset delay with pause recovery preserving remaining delay.
  - Successful pair match locking both cards into matched state with audio feedback.
  - All 8 pairs matched triggers completion overlay with move count and best score.
  - Move count increments only on second flip of a pair.
  - Restart resets cards to face down, reshuffles symbols, clears moves, and resets matched count.
- **Input Methods:** Mouse click, touch tap, keyboard `Tab` + `Enter`/`Space`.
- **Persistence:** Best moves stored in `nocharge:memory-match:best-moves`; overall score stored in `nocharge:game:memory-match:best`.
- **Accessibility:** Live region announcements for moves, individual card aria-labels ("Card X of 16, hidden" / "Card X of 16, [symbol]" / "matched").

### 2. Word Tile Rush
- **Mechanics Verified:**
  - Adjacent path selection (8 directions: horizontal, vertical, diagonal).
  - Backtracking one step removes the last selected tile.
  - Word validation against embedded offline dictionary (min length 3).
  - Scoring: `length^2 * 10` points per word.
  - Gravity column collapse upon word submission.
  - Grid progression (periodic row drop shifting rows up and spawning a new bottom row).
  - Loss condition triggered when top row (row 0) contains any letter upon row drop.
  - Timer paused during tab hidden, pause menu, and word composition.
- **Input Methods:** Pointer drag across letters, keyboard cell selection + Submit button, Backspace / Clear button.
- **Persistence:** Best score stored in `nocharge:game:word-tile-rush:best`.

### 3. Color Flip
- **Mechanics Verified:**
  - Round start color selection (Green, Blue, Amber, Rose) with keyboard shortcuts (G, B, A, R).
  - Tap-to-step movement to orthogonal adjacent tiles.
  - Matching color tile steps increment score by 1 and shift visible 5×5 viewport grid.
  - Non-matching tile step ends the game immediately.
  - Rotation modes: `never`, `every-10`, `every-5` cycling through 4 colors in sequence.
  - Undo restores previous player position, grid state, score, steps, and rotation counter.
  - Turn-based accessible text alternative mode with Cycle Color and Step Forward controls.
- **Input Methods:** Touch tap, mouse click, keyboard (G/B/A/R, Space/Enter, Arrow keys).
- **Persistence:** Rotation preference in `color-flip-rotation`; best score in `nocharge:game:color-flip:best`.

### 4. Beacon Lattice
- **Mechanics Verified:**
  - Valid beacon placement (Cross, Diagonal, Horizontal, Vertical, Omni).
  - Beacon removal and replacement.
  - Coverage calculation (exact = 1, gap = 0, overlap >= 2) per cell.
  - Puzzle solved when all required cells have exact coverage (1) and par is reported.
  - Hint / progress tracking across 24 curated puzzles.
  - Undo step-by-step and Restart puzzle.
- **Input Methods:** Pointer click/tap on lattice cells and beacon palette, keyboard arrow navigation + number keys.
- **Persistence:** Solved puzzle records stored locally in `nocharge:beacon-lattice:progress`.

### 5. Tic-Tac-Toe
- **Mechanics Verified:**
  - 3×3 (3-in-a-row) and 4×4 (4-in-a-row) board sizes.
  - Turn alternation (X opens odd rounds, O opens even rounds).
  - Winning line detection across rows, columns, and both diagonals.
  - Draw detection when board is full without a winner.
  - Match mode: First to 3 round wins within 5 rounds.
  - Pass & Play handoff screens between turns.
- **Input Methods:** Touch tap, mouse click, keyboard grid navigation.
- **Persistence:** Match records saved to session/local storage for My Arcade history.

### 6. Dots & Boxes
- **Mechanics Verified:**
  - Edge placement (horizontal and vertical lines).
  - Box claiming when 4th enclosing edge is drawn.
  - Multi-box claim: one edge completing two adjacent boxes simultaneously.
  - Extra turn granted to current player upon claiming a box (no handoff).
  - Game completion when all 16 (4×4) or 36 (6×6) boxes are claimed; winner declared by highest count.
- **Input Methods:** Touch tap, mouse click, keyboard directional navigation between lines.
- **Persistence:** Pass & Play match record saved.

### 7. Four in a Row
- **Mechanics Verified:**
  - Gravity drop: discs fall to the lowest unoccupied cell in the chosen column.
  - Invalid full-column move rejected safely.
  - Win detection in all 4 axes (horizontal, vertical, positive diagonal, negative diagonal).
  - Draw detection when all columns are full.
  - Standard (7×6) and Small (6×5) board configurations.
- **Input Methods:** Touch tap on column headers / buttons, keyboard Left/Right + Enter to drop.
- **Persistence:** Pass & Play match record saved.

### 8. Reversi
- **Mechanics Verified:**
  - Classic 4-disc center opening.
  - Legal move calculation (must outflank at least one opponent disc in 1 to 8 directions).
  - Disc flipping across all valid outflanked lines.
  - Automatic pass turn when active player has no legal moves.
  - Game over when neither player can move or board is full; highest disc count wins.
  - Toggleable legal move visual hints.
- **Input Methods:** Touch tap, mouse click, keyboard navigation jump to nearest legal cell.
- **Persistence:** Pass & Play match record saved.

### 9. Last Token
- **Mechanics Verified:**
  - Legal take counts: 1, 2, or 3 tokens from a single pile only.
  - Misère rules: The player who takes the last remaining token on the table loses the round.
  - Turn alternation after every take.
  - Presets: 3-4-5 (3 piles), 1-3-5-7 (4 piles), 3-5 (2 piles).
- **Input Methods:** Touch tap, mouse click, keyboard arrow navigation between piles and amounts.
- **Persistence:** Pass & Play match record saved.

### 10. Pass the Picture
- **Mechanics Verified:**
  - Drawing input on responsive 4:3 canvas (pointer down, move, up/leave).
  - 8-color palette selection and single fixed stroke width.
  - Configurable pass counts (2, 3, 4, 5 passes per player, alternating turns).
  - Intermediate handoff screen concealing previous drawing until next player is ready.
  - Undo last stroke and Clear current pass.
  - Final combined reveal screen and Save Drawing image export.
- **Input Methods:** Touch and mouse pointer drawing (explicitly documented as pointer-only; not keyboard-driven).
- **Persistence:** Exportable canvas image.

### 11. Klondike
- **Mechanics Verified:**
  - 7 tableau columns dealt with top card face up.
  - Stock draw (Draw 1 or Draw 3) and unlimited stock recycling.
  - Alternating color, descending rank tableau building.
  - Foundation building (Ace to King by suit).
  - Moving single cards and valid multi-card sequences.
  - Kings (rank 13) allowed on empty tableau columns.
  - Auto-move to foundations for safe low cards.
  - Unlimited Undo and Win detection (all 52 cards on foundations).
- **Input Methods:** Touch tap-to-select and tap-to-place, mouse click, keyboard.
- **Persistence:** Games won count, best moves, draw mode preference (`draw-1` / `draw-3`).

### 12. FreeCell
- **Mechanics Verified:**
  - 8 tableau columns dealt with all 52 cards face up.
  - 4 open free cells and 4 foundation piles.
  - Single card movement to/from free cells.
  - Multi-card tableau sequence moves bounded by `(freeCells + 1) * 2^emptyCols`.
  - Foundation building (Ace to King by suit).
  - Auto-move to foundation for safe cards.
  - Unlimited Undo and Win detection.
- **Input Methods:** Touch tap / click selection, keyboard.
- **Persistence:** Games won count in `nocharge:freecell:games-won`.

### 13. Nonogram
- **Mechanics Verified:**
  - Grid cell states: `unknown`, `filled`, `empty` (cross).
  - Row and column numerical clues computed from puzzle solutions.
  - Interactive cell toggling (`unknown` -> `filled` -> `empty` -> `unknown`) and drag painting.
  - Row / column satisfaction feedback.
  - Solved detection when user filled cells match solution.
  - Reveal and Undo controls.
  - 12 5×5 and 12 10×10 unique puzzles.
- **Input Methods:** Touch drag / tap, mouse click, keyboard (F = fill, X = mark empty, arrow navigation).
- **Persistence:** Solved puzzle records.

### 14. Twenty Forty-Eight
- **Mechanics Verified:**
  - 4 directions: Up, Down, Left, Right.
  - Tile merging: Equal adjacent numbers double into a single tile.
  - Single-merge rule: [2, 2, 2, 2] merges into [4, 4, 0, 0] in one move.
  - Score increases by value of newly formed tiles.
  - Random tile spawn (90% 2, 10% 4) after every valid move.
  - Undo restores previous grid, score, and moves.
  - Win trigger at 2048 with continue option; Game Over when grid is full with no possible merges.
- **Input Methods:** Touch swipe, arrow keys, on-screen directional buttons.
- **Persistence:** Best tile achieved in `nocharge:2048:best-tile`, high score.

### 15. Tile Garden
- **Mechanics Verified:**
  - Tile placement on 8×8 grid from next-tile queue.
  - 2×2 matching tile merge: merges land on the **top-left** coordinate of the 2×2 block.
  - Cascading merges across higher plant tiers (Seed -> Sprout -> Plant -> Flower).
  - Garden mode: Win condition met when a Flower is formed on any center 2×2 cell (coords (3,3), (3,4), (4,3), (4,4)).
  - Meadow mode: Endless play without center win restriction.
  - Sketch mode: Free placement without auto-merging; clear tile support.
  - Undo restores exact pre-merge board and move count.
- **Input Methods:** Touch tap, mouse click, keyboard arrows + Enter.
- **Persistence:** Mode preference, best gardens.

### 16. Word Search
- **Mechanics Verified:**
  - Touch drag line selection across letter grid with pointer capture.
  - Two-click fallback (click start cell, click end cell).
  - Keyboard selection (arrow keys, Enter to select endpoints).
  - 8 directions supported: horizontal, vertical, diagonal, and reverse.
  - Grid sizes: 8×8 (8 columns) and 10×10 (10 columns).
  - Themes: Animals, Nature, Space, Colors with word length fitting constraints.
  - Hint feature highlights the first letter of an unfound word.
  - Puzzle completion triggers win overlay.
- **Input Methods:** Touch drag, mouse click, keyboard navigation.
- **Persistence:** Puzzles solved count.

### 17. Mini Sudoku
- **Mechanics Verified:**
  - 6×6 grid with six 2×3 blocks.
  - Digit entry 1–6 via on-screen pad and physical number keys.
  - Immediate conflict detection against row, column, and 2×3 block with polite aria announcements.
  - Erase / Clear cell function.
  - Pencil marks / Notes toggle mode allowing multiple candidate digits per cell.
  - Check, Reveal, and Undo functionality.
  - Unique solution validation for Easy (12 removed), Medium (16 removed), Hard (20 removed).
  - Puzzle completion triggers win state.
- **Input Methods:** Touch keypad, mouse click, keyboard (1–6, Backspace, U = undo, C = check, R = reveal).
- **Persistence:** Saved puzzle state in `nocharge:sudoku:current-puzzle`, solved count in `nocharge:sudoku:puzzles-solved`, pencil mark mode pref.

---

## Shared Platform & Lifecycle Functional Requirements

1. **Mounting:**
   - Every game initializes cleanly into its container without unhandled exceptions.
   - Primary `Play [Game Title]` action launches Game Mode on mobile.
   - Shared game toolbar provides Pause/Resume, Mute toggle, and Settings modal.
   - Shared and in-game Restart controls reset all game-specific state cleanly.

2. **Pause & Recovery:**
   - Backgrounding tab or switching visibility automatically pauses active games.
   - Manual pause and visibility pause maintain independent pause reasons.
   - Returning to tab does not auto-resume if game was manually paused.
   - Timed games (Word Tile Rush) do not accumulate missed timer ticks while paused.

3. **Audio Architecture:**
   - Web Audio synthesizer generates procedural sounds without network audio asset requests.
   - AudioContext unlocking includes `.catch(() => {})` handlers to prevent unhandled promise rejections on mobile browsers.
   - Shared mute state persists in `localStorage` across page reloads and between games.

4. **Accessibility:**
   - Skip links, landmark regions, logical tab index, visible high-contrast focus rings.
   - Screen reader live regions for status announcements without noise.
   - Full support for `prefers-reduced-motion` and `forced-colors`.
   - Zero Axe violations on all game routes.

5. **Mobile Viewport Geometry:**
   - Tested and verified at:
     - 320 × 568 (iPhone SE 1st gen)
     - 360 × 800 (Android compact)
     - 375 × 812 (iPhone X/11/12 mini)
     - 390 × 844 (iPhone 13/14)
     - 412 × 915 (Pixel / Galaxy standard)
   - Zero horizontal document-level overflow on all game routes.
   - Zero internal horizontal or vertical scrolling in primary game boards.
