# Sound design

NoCharge uses a small procedural Web Audio sound bank. Oscillators, gains, and filters are created after a user gesture; no audio files, CDN, or third-party audio library is used. The distinction matters: `prefers-reduced-motion` changes visual motion only, while sound has its own controls.

Preference hierarchy is system/browser mute → `nocharge:pref:game-muted` → `nocharge:pref:sound-enabled` → `nocharge:pref:sound-volume`. Ambient is separately selected with `nocharge:pref:ambient-sound`. Defaults are sound enabled, volume 60, and ambient none. The toolbar mute button is the game-muted master override and covers effects and ambient.

Every event has a visual counterpart: move/place is a focus or placement state, flip is the card animation, merge is the tile bloom, hint is a highlight, error is a soft error tint, claim is a claimed box, and win is the existing result panel. Live announcements never depend on audio. We do not market this as immersive audio.

## Controls

Sound on/off exposes `aria-pressed`, volume is a labeled 0–100 slider, and Ambient offers None, Rainfall, Cafe, and White noise. Preferences are local-only. Ambient is filtered procedural noise, ducks during effects, and defaults off.

## Game-event mapping

Every call goes through `shared/audio/play(name)`. Calls queue; they do not overlap. Mode toggles, panel opens, and other non-event UI moments stay silent.

| Game | Named events |
|---|---|
| Memory Match | `flip` on card reveal, `match` on a pair, `win` |
| Word Tile Rush | `place` on a committed word, `win` |
| Color Flip | `step` on a step, `place` on a matched step, `win` |
| Beacon Lattice | `place` on a beacon, `error` when blocked, `win` |
| Klondike | `flip` on a stock reveal, `place` on a move, `win` |
| FreeCell | `flip` on the first move after the deal, `place` on later moves, `win` |
| Nonogram | `place` on a mark, `hint` when a row or column clue is newly satisfied, `error` if a filled mark contradicts the solution, `win` |
| 2048 | `merge` on every merge (score increase), `win` on reaching 2048 |
| Tile Garden | `place` on a drop, `merge` when a 2×2 merge fires, `win` |
| Word Search | `place` on a found word, `hint` on a requested hint, `win` |
| Mini Sudoku | `place` on a fill, `error` on a conflicting fill or a Check that finds a wrong cell, `hint` on Reveal, `win` |
| Tic-Tac-Toe | `place`, `win` |
| Dots & Boxes | `place` on a drawn edge, `claim` when a box is completed, `win` |
| Four in a Row | `place` on a disc drop, `win` |
| Reversi | `place` on a disc, `flip` when opponent discs turn, `win` |
| Last Token | `place` on a take, `error` then `win` when the last token is taken (soft loss, then the other player’s win) |
| Pass the Picture | `place` on a completed stroke, `win` when the picture is finished |

The sound layer remains the only path to an oscillator; game modules never create AudioContext nodes directly.
