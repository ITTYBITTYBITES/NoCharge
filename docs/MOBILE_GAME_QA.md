# Manual mobile game QA

Check Android Chrome and iOS Safari, portrait and landscape.

## Categories

- Tableau / cards: Klondike, FreeCell
- Fixed grid: Twenty Forty-Eight, Tile Garden, Mini Sudoku, Word Search, Nonogram
- Canvas / stage: Color Flip, Beacon Lattice, Memory Match, Word Tile Rush
- Pass-and-play: Tic-Tac-Toe, Dots and Boxes, Four in a Row, Reversi, Last Token, Pass the Picture

## Touch and layout

- Direct-tap buttons and cells are at least 44×44 CSS px when space allows.
- Board edges stay tappable. Selected-card lift is not cropped.
- Wide solitaire boards scroll horizontally inside the game board, not the page.
- The document does not scroll sideways.

## Shared chrome

- Compact bar: Pause/Resume, one Mute control, Game settings.
- Settings: sound on/off, volume, ambient, New game, Focus / full screen.
- No duplicate Mute + Sound-on controls in the same visible bar.
- Restart lives in settings (plus win overlays), not as a second always-visible New game.

## Focus and fullscreen

- Native fullscreen when the browser allows it (`navigationUI: hide` when supported).
- Otherwise **Focus mode** expands the board, hides the large settings form, and shows Exit / Pause / Settings.
- Escape, orientation change, browser back / pagehide restore scroll and focus.

## Audio

- First gesture unlocks sound. Volume 0 and mute stay silent.
- Rapid input does not queue a backlog of move beeps ahead of a win cue.
- Ambient never autoplays.

## Word Search

- 8×8 is eight columns; 10×10 is ten columns.
- Taps, arrow keys, Enter, and Hint map to the visible cells.
- Science / long words never appear on a board they cannot fit.

## Tile Garden

- A 2×2 merge lands on the **top-left** cell of that block.
- Garden wins only with a flower on a center cell. Meadow does not win. Sketch does not auto-merge.
