# Color Flip

## Visual Mode Redesign (2026-08-22)

The visual mode was redesigned from a real-time scrolling reflex game to a calm tap-to-step tile puzzle.

### What changed

1. **One color per round:** At round start, player picks a single color from a compact picker above the playfield. The picker then disappears. No color switching during gameplay (unless rotation is enabled).

2. **Tap-to-step:** Replaced continuous real-time movement with a 5×5 grid. Player occupies the center. Tap adjacent tiles to step. Matching color scores; wrong color ends the round.

3. **No reflex timing:** The step cooldown and real-time scrolling from the old visual mode are removed. Players take their time.

4. **Color rotation:** Optional difficulty toggle — Never (default, calmest), Every 10 steps, Every 5 steps. When enabled, the player's color rotates to the next in the cycle after N successful steps.

### What didn't change

- **Turn-based mode:** Completely unchanged. Same Cycle color / Step forward controls. Same scoring. Same accessibility features.
- **Shared infrastructure:** Audio, storage, recently-played, pause/recovery all unchanged.
- **Turn-based storage key:** `nocharge:color-flip-turn-based:high` unchanged.

### Tagline update

- **Old:** "One wrong step and it's over."
- **New:** "Pick a color. Step carefully. Take your time."

The old tagline contradicted Quiet Arcade's calm/no-pressure identity. The new tagline reflects the redesigned gameplay.

## Rules

- 5×5 grid, player centered.
- Pick one color at round start.
- Tap adjacent (orthogonal) tiles to step.
- Matching color: score +1, continue.
- Wrong color: round ends.
- Grid shifts after each step to keep player centered; new tiles fill edges.

## Color Rotation

| Mode | Behavior |
|------|----------|
| Never (default) | Color stays fixed for the entire round |
| Every 10 steps | Color rotates after 10th, 20th, 30th... step |
| Every 5 steps | Color rotates after 5th, 10th, 15th... step |

Rotation cycle: Green → Blue → Amber → Rose → Green.

Preference persisted at `nocharge:pref:color-flip-rotation`.

## My Arcade Keys

| Key | Description |
|-----|-------------|
| `nocharge:color-flip:high` | Best visual-mode score |
| `nocharge:color-flip-turn-based:high` | Best turn-based score |
| `nocharge:pref:color-flip-rotation` | Rotation preference |

## Accessibility

- **Color never sole indicator:** Letter labels (G, B, A, R) on tiles and player circle.
- **Keyboard:** Arrows step, G/B/A/R pick color, U undoes.
- **Large tap targets:** Adjacent tiles ≥44px with visible highlight.
- **prefers-reduced-motion:** Step animations suppressed.
- **forced-colors:** Adjacent tiles use Highlight token.
- **320px reflow:** Picker fits above playfield without horizontal scroll.
- **200%/400% zoom:** Tested and working.

## What We Don't Claim

- No rotation level is "easier" or "harder" — preference depends on play style.
- No score is "good" or "optimal."
- Best score is a personal record, not a performance evaluation.
