# FreeCell Solitaire

## Rules

All 52 cards face-up in 8 columns (7+7+7+7+6+6+6+6 by round-robin). 4 free cells, 4 foundations.

- **Tableau:** Alternating colors descending. Any card on empty columns.
- **Foundations:** By suit ascending A→K.
- **Multi-card moves:** (empty free cells + 1) × 2^(empty columns).
- **Auto-move:** Safe cards auto-move to foundations.

## Controls

Tap/click a card to select it, then tap a destination card, column, free cell, or foundation to move. A second tap on a selected card sends it to its foundation; only a selected top card may move to a free cell or foundation, so a mid-run selection never sends the wrong card. Card input uses native `click`, so a touch that turns into a scroll never moves a card; `touch-action: manipulation` keeps taps delay-free.

## RNG

Same `SeededRng` infrastructure as Klondike. Seeds stored in `state.seed`.

## My Arcade Keys

| Key | Description |
|-----|-------------|
| `nocharge:freecell:games-won` | Total games won (integer) |

## Accessibility

- All cards have aria-labels (rank, suit, column position).
- Free cells and foundations are keyboard-operable buttons.
- Undo is a standard button.

## What We Don't Claim

- No winnability percentage.
- No "most FreeCell deals are solvable" claim (even though this is widely believed).
