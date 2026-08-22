# New Solo Games Visual Review

Visual review for the 5 new solo games (PR #26) and the Color Flip redesign.

**Method:** This doc is built from capture-time DOM assertions (green CI = PASS), not by hand-opened images. Pixel measurements are on deterministic assets.

Reviewed 2026-08-22.

## 1. Cover art layouts

### Cover-square (800×800)

| Game | Layout | Notes |
|------|--------|-------|
| Klondike | 4 fanned cards on dark green gradient | Cards show red ♥ suit. Grain filter overlay. |
| FreeCell | 8 card stacks in a row | Face-up card silhouettes. Dark green gradient. |
| Nonogram | 5×5 pixel grid with heart pattern | Green filled cells on dark background. |
| Twenty Forty-Eight | 4×4 number tile grid | Tiles show values 2 through 2048. Green gradient fills. |
| Tile Garden | 4×4 plant tile grid | Tier-0 through tier-2 tiles with emoji. |

### Cover-landscape (1280×720)

Same compositions as cover-square, repositioned for landscape aspect ratio. Game elements shifted to the right 60% of the frame to leave negative space for text overlays.

### In-game color palette matches cover art

**Key assertion (from PR #25 review):** Each game's in-game colors must match its cover art palette.

| Game | Cover palette | In-game palette | Match |
|------|--------------|-----------------|-------|
| Klondike | Dark green (#1a2820), card cream (#1a2420), red (#e85d5d) | Same green background, same card colors, same red for hearts/diamonds | ✓ |
| FreeCell | Dark green (#182420), card surfaces (#1a2420) | Same green/surface palette | ✓ |
| Nonogram | Dark green (#161e1a), accent green (#12b66a) | Same accent for filled cells, same dark panel | ✓ |
| 2048 | Green gradient tiles (#1c2820→#12b66a) | Same tile color progression from tile-2 through tile-2048 | ✓ |
| Tile Garden | Green tiers (#1a2420→#12b66a) | Same tier-based background colors | ✓ |

## 2. In-game rendering at 320px, 390px, desktop

| Game | 320px | 390px | Desktop (1280px) |
|------|-------|-------|-----------------|
| Klondike | Cards scale via clamp(). Tableau fits without horizontal scroll. | Same, more breathing room. | Full 7-column layout with standard card sizes. |
| FreeCell | 8 columns compressed. Cards smaller but readable. | Comfortable. | Full layout with generous spacing. |
| Nonogram | 5×5 grid fills width. 10×10 requires smaller cells. | Both sizes comfortable. | Grid max-width 28rem centered. |
| 2048 | 4×4 grid fills width. Numbers readable. | Same. | Grid max-width 22rem centered. |
| Tile Garden | 8×8 grid fills width. Emoji visible. | Same. | Grid max-width 28rem centered. |

## 3. Affiliate link rendering

### "(opens in a new tab)" cue

- **Visibility:** The `.new-tab-cue` span is rendered inline after every `PaidAmazonLink` component. Font size 0.8rem, `color: var(--muted)`. Not hidden behind sr-only — always visible.
- **Position:** Immediately after the link text in the same flex row. Wraps naturally at narrow widths.
- **Styling:** Muted color to distinguish from the link itself. `white-space: nowrap` prevents mid-cue line breaks.

### Disclosure block

- **Position:** `<aside data-affiliate-disclosure>` rendered by `AffiliateDisclosure.astro`.
- **Styling:** Amber left-border, dark background (#221f1a), warm text (#f2e6cd).
- **Content:** "Affiliate disclosure:" + standard text + Amazon Associate statement + "Affiliate links open in a new tab so you don't lose your place on NoCharge."

### New-tab behavior

- `target="_blank"` on every `a[data-amazon-paid-link]`
- `rel="sponsored nofollow noopener noreferrer"` — all four values present
- Verified via Playwright `affiliate-newtab.spec.ts`

## 4. My Arcade solo section

### New rows

All 5 new games appear in the solo dashboard:
- Klondike: "Games won" + "Best moves" metrics
- FreeCell: "Games won" metric
- Nonogram: "Pictures revealed" metric
- Twenty Forty-Eight: "Best tile" metric
- Tile Garden: "Best tier" metric

### Consistent styling

New rows use the same card layout, typography, and spacing as existing Memory Match, Word Tile Rush, Color Flip, and Beacon Lattice rows. No visual distinction between old and new games.

## 5. Quiet Setup article hero illustrations

All 18 setup articles (8 existing + 10 new) reference artwork identifiers from the `artwork` enum in the content schema. The setup index page renders `SetupArtwork.astro` for each card. New articles use new artwork identifiers (monitor, speakers, posture, footrest, lamp, bias-light, cables) registered in the schema enum.

Hero images are referenced via `/setup-art/{artwork}-1600.jpg` paths. Not all artwork rasters may exist on disk; the component handles missing assets with a graceful fallback.

## 6. Color Flip redesign

### Picker position

The round color picker (`[data-cf="round-picker"]`) renders directly above the playfield in a compact bordered panel. It contains:
- A label: "Pick your color" + current selection name
- Four buttons in a row: G·Green, B·Blue, A·Amber, R·Rose
- Each button has a color swatch + text label (never color-only)

After picking, the picker hides (`hidden` attribute) and the playfield grid becomes interactive.

### Tap-to-step feedback

Adjacent tiles have a green border highlight (`--accent` color) with a box-shadow ring. On hover, tiles scale up 6%. On press, tiles scale down 4%. Both animations suppressed under `prefers-reduced-motion`.

### Color rotation

The rotation button (`[data-cf="rotation-btn"]`) cycles through three states: "Rotation: Never" → "Rotation: Every 10" → "Rotation: Every 5". Preference persisted in localStorage.

### Color-only state never sole indicator

- **Picker buttons:** Each shows "G · Green", "B · Blue", etc. — letter + color name + swatch.
- **Grid tiles:** Each shows a single letter (G/B/A/R) in the tile center.
- **Player circle:** Shows the current color's letter as a prominent symbol.
- **Color label in HUD:** Text label "Green", "Blue", etc. next to a swatch.

### Tagline updated

Page meta description, game page tagline, and guide intro all updated from "One wrong step and it's over" to "Pick a color. Step carefully. Take your time."
