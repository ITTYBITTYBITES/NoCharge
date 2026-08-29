# Klondike Solitaire

## Rules

Standard Klondike: 7 tableau columns (1–7 cards), 4 foundations, stock + waste.

- **Tableau:** Alternating colors descending. Kings on empty columns.
- **Foundations:** By suit ascending A→K.
- **Draw mode:** Draw-1 (default) or draw-3, toggleable at any time.
- **Auto-move:** Safe cards (aces and low ranks) auto-move to foundations.

## Controls

Tap/click a card to select it, then tap a destination card, column, or foundation to move. A second tap on a selected card sends it to its foundation. Card input uses native `click`, so a touch that turns into a scroll never moves a card; `touch-action: manipulation` keeps taps delay-free. The waste shows its last cards fanned inside the fixed slot — under-cards stay face up and never stack over the tableau.

## RNG

Each deal uses `SeededRng` with a documented seed stored in `state.seed`. Seeds are generated from `Math.random()` via `randomSeed()`.

## My Arcade Keys

| Key | Description |
|-----|-------------|
| `nocharge:klondike:games-won` | Total games won (integer) |
| `nocharge:klondike:best-moves` | Lowest move count for a won game |
| `nocharge:pref:klondike-draw-mode` | Preferred draw mode (1 or 3) |

## Accessibility

- All cards have aria-labels (rank, suit, face state).
- Stock, waste, tableau columns, and foundations are keyboard-operable.
- Undo and draw-toggle are standard buttons.
- No animation is essential to gameplay.

## What We Don't Claim

- No winnability percentage.
- No "X% of deals are solvable."
- No optimal-strategy claims.
