# Pass & Play architecture and design notes

Reviewed 2026-08-22 against `src/games/shared/pass-play.ts`, the six game modules under `src/games/`, and the site integration in `src/pages/`.

Pass &amp; Play is NoCharge's family of local two-player games: turn-based, one device, no accounts, no network play, no leaderboards, no timers, and no computer opponents anywhere. Family name in all user-facing copy is **Pass &amp; Play**, tagline **"Two players, one device."** The word "multiplayer" is deliberately never used in user-facing copy, because these games are strictly local.

## 1. The shared handoff system

| Piece | Location | Responsibility |
|---|---|---|
| `src/games/shared/pass-play.ts` | Session-only names, tally/score text, bounded match records, `HANDOFF_SCREEN_TEMPLATE`, `createHandoffScreen()` | Single source of truth for handoff markup and shared logic |
| `src/components/HandoffScreen.astro` | Renders the template once as an inert `<template data-handoff-screen>` plus global `.pp-handoff` styles | Lets game code clone server-rendered markup; the constant remains the fallback so the two can never drift |
| `src/games/shared/pass-play-chrome.css` | Shared HUD (mode buttons, live status, result panel) styles | Consistent chrome across the six games |

Behavior contract of `createHandoffScreen(mount, options)`:

- Heading "Pass to {Player name}" with editable Player 1 / Player 2 name inputs. Names are normalized (whitespace collapsed, capped at 18 characters) and stored **only in module memory** — never in `localStorage`, `sessionStorage`, cookies, or the URL. Reloading restores "Player 1 / Player 2".
- Match tally when a match is running (`formatMatchTally`): "Ada leads 2–1" or "Tied 1–1"; 0–0 is announced as "Tied 0–0" rather than being silent.
- A Continue button (`min-height: 48px`) receives focus on open; Tab cycles inside the dialog; Escape and Enter-in-a-name-field continue; focus returns to the previously focused element on close.
- A polite live region announces "{name}, it is your turn." one frame after the dialog mounts.
- By default the backdrop is **opaque** — the previous player's view of the board is covered. `keepVisible: true` (used only by Pass the Picture) makes it translucent so a shared surface stays visible while still blocking board input.
- `hideSelectors` hides arbitrary elements inside the game root while the handoff is open and restores them on close. It is **reserved for future hidden-information games; none of the current six games use it.**

All two-player flows in the six games go through this one component.

## 2. Per-game design notes

### Tic-Tac-Toe (`src/games/tic-tac-toe/`)
Modes: 3×3 (3 in a row), 4×4 (4 in a row), Match (first to 3 round wins, best of 5, 3×3 rounds). The first player alternates every round (`openingMarkForRound`). X is Player 1, O is Player 2. Cells are at least 64px for tabletop play; arrow keys move between cells and Enter/Space places. Copy never claims optimal play or any winning strategy for any variant.

### Dots & Boxes (`src/games/dots-and-boxes/`)
Boards of 4×4 and 6×6 boxes. Drawing the fourth side of a box claims it and grants another move on the same turn (standard rule) — no handoff fires while a player keeps completing boxes. The 6×6 board may scroll horizontally below ~360px; edge buttons are never smaller than the 4×4 board's. Box-completion flash is a single animation, disabled under `prefers-reduced-motion`.

### Four in a Row (`src/games/four-in-a-row/`)
Standard 7×6 board plus a 6×5 small board. Discs fall to the lowest empty cell; the drop animation is skipped entirely for reduced-motion players (they get the resting disc immediately). Column buttons above the board are the single input surface for touch, pointer, and left/right + Enter keyboard play. The opening player alternates each game. The generic name is used everywhere; the trademarked name never appears.

### Reversi (`src/games/reversi/`)
8×8 board, classic four-disc start (black d5/e4, white d4/e5; black = Player 1 moves first). A move must outflank and flip at least one opponent disc; a player with no legal move passes automatically with an announcement; the game ends when the board is full or neither player can move; most discs wins. Legal-move markers are on by default with a toolbar toggle, and arrow keys move only between squares that are legal for the current turn. Called "Reversi" only, never the trademarked alternative; no optimal-play claims.

### Last Token (`src/games/last-token/`)
Misère take-away: remove 1–3 tokens from one pile per turn; the player who takes the last token loses. Presets 3-4-5, 1-3-5-7, and quick 3-5. Rounds are instant; the opener alternates. Every legal take is a labeled button, so no move needs pointer input. The underlying game is mathematically solved; the product therefore shows **no strategy hints, no math, and no optimality claims anywhere** — rules only.

### Pass the Picture (`src/games/pass-the-picture/`)
A shared canvas; players alternate one stroke per pass, 2–5 passes each (default 3). Eight-color palette, one stroke width, undo-last-stroke (which restores the undone stroke's pass to its author). The handoff uses `keepVisible` — the drawing is shared, not secret. The end screen shows the picture with "Download this picture", which serializes the canvas to a local PNG download. Nothing is uploaded. Drawing is pointer-based by nature; the page documents the keyboard limitation plainly (colors, undo, and restart are keyboard-operable; strokes are not).

## 3. Match records — exact keys and bounds

Each game writes exactly one bounded record per game id (overwrite-in-place, never appended):

```
nocharge:passplay:match:tic-tac-toe
nocharge:passplay:match:dots-and-boxes
nocharge:passplay:match:four-in-a-row
nocharge:passplay:match:reversi
nocharge:passplay:match:last-token
nocharge:passplay:match:pass-the-picture
```

Value shape (JSON): `{ gameId, mode, result, score, finishedAt }` where `result` is `p1 | p2 | draw | shared` (`shared` only for Pass the Picture's cooperative picture) and `score` is a two-number array whose meaning is the game's own final score. `parsePassPlayMatchRecord` treats anything missing, malformed, oversized (> 2 KB), or out of range as absent. Player names are never part of any record. `src/lib/local-game-data.ts` includes all six keys in the single Clear-game-data allowlist, so Privacy and My Arcade clear them in one confirmed flow. My Arcade reads them read-only in `src/lib/my-arcade/passplay.ts`; see `docs/MY_ARCADE_DATA_MODEL.md`.

## 4. Site placement

- `/arcade/` is **one page with two sections** ("Solo games" and "Pass &amp; Play") joined by a top anchor nav. The solo section markup is unchanged from before this family existed.
- The homepage renders a Pass &amp; Play section (below the Arcade grid, above Guides/Articles) only while pass-and-play content exists, with a "See all" link to `/collections/pass-and-play/`.
- A "2 players" pill marks pass-play-capable cards on the homepage grid and in Recently Played; the arcade page's section heading already says it, so the pill is not repeated there.
- `/my-arcade/` is one page with two sections: the existing solo dashboard and a "Shared on this device" Pass &amp; Play section showing only each game's most recent record.

## 5. Future split trigger (documented — deliberately NOT implemented)

Keep Pass &amp; Play as a second section of `/arcade/` until either:

1. Pass &amp; Play exceeds **8 games**, or
2. its section becomes the **majority of the arcade page's listed games.

Whichever happens first triggers promoting the family to its own `/arcade/pass-and-play/` route with a two-card teaser on `/arcade/` plus a "See all" link. Until then there is exactly one arcade page, and no second page or route should be created.

## 6. Accessibility and lifecycle requirements for every Pass &amp; Play game

- Full keyboard play (arrows + Enter/Space) except Pass the Picture's pointer-based strokes, which are documented as such.
- Integration with the shared toolbar/lifecycle: pause, restart, fullscreen/immersive, persistent mute, consent-modal pausing, and hidden/stale-tab recovery come from `GameShell` + `mountGameShell`, exactly like the solo games.
- `prefers-reduced-motion` respected for every animation; forced-colors-safe boards; visible focus; 320/390px reflow; no timers, penalties, forced progression, or dark patterns.
- Gameplay screenshots shown publicly must be actual mounted-DOM captures (see `docs/PASS_AND_PLAY_VISUAL_REVIEW.md`), never manual rasterization.
