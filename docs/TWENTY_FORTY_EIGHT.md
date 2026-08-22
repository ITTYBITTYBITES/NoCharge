# Twenty Forty-Eight (2048)

## Rules

Classic 4×4 grid. Slide all tiles in one direction. Equal adjacent tiles merge into their sum. New tile spawns after each successful move (90% chance 2, 10% chance 4). Game ends when no slide produces change. Win at 2048 (cosmetic; can continue).

## My Arcade Keys

| Key | Description |
|-----|-------------|
| `nocharge:2048:best-tile` | Highest tile value achieved |

## Accessibility

- Arrow keys and WASD for sliding; U for undo.
- Touch swipe support.
- `prefers-reduced-motion` respected: tiles snap without animation.
- Every cell has aria-label with position and value.

## What We Don't Claim

- Display "Best: 1024" as a factual record only.
- Never claim any tile value is "good" or "optimal."
- No daily challenge, no streak, no leaderboard.
