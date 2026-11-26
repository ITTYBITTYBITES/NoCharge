# NoCharge live-site visual audit · R3 reference

**Observed:** 2026-11-16 · direct browser inspection of `https://nocharge.net/`\
**Purpose:** establish the real design authority before proposing R3 assets.\
**Scope boundary:** inspected the live rendered pages and publicly served CSS/assets only. No repository was cloned or inspected; no live website files or behavior were changed.

## What was rendered and checked

Loaded the live homepage, `/arcade/`, `/games/memory-match/`, `/guides/`, and `/tools/` in Chromium at **1440 × 1000** and **390 × 844**; also rendered full-page Guides and Tools views. The inspected pages returned HTTP 200, had no reported JavaScript exceptions, and did not overflow horizontally at either width. Scrolled the Arcade catalog so lazy-loaded images were requested: it contains **26 unique 800 × 800 WebP cover artworks** (52 image instances across repeated lists), all loaded successfully; no broken image request was observed.

Reference screenshots from the live rendering are saved beside this audit under `reference/` (home desktop/mobile, brand header, arcade desktop/mobile, Guides desktop, Tools desktop). Screenshots are evidence of the live design, not new NoCharge artwork.

## Actual brand identity and assets

- **Logo / wordmark:** the header has an inline 64 × 64 SVG mark, displayed at 2rem (32 px), followed by the live editable text `NoCharge` at weight 700. The mark is a charcoal rounded square (`#121212`, radius 14 in its 64-unit viewBox) with three rounded emerald squares and an open, rounded green path (6-unit stroke). It is **not an N-shaped monogram**. The footer repeats the mark at 1.1rem. Preserve this exact mark and wordmark treatment; R3 does not redraw either.
- **Browser / install identity:** the live HTML links `favicon.svg`, `favicon.ico`, 16 × 16 and 32 × 32 PNG favicons, a 180 × 180 Apple touch icon, and 192/512 px regular and maskable PWA icons. `manifest.webmanifest` uses `#121212` for background and theme. The fetched icon files returned HTTP 200. These are already usable; no replacement is proposed.
- **Social sharing:** the live `og:image` and Twitter image is `/social/nocharge-default.jpg`, JPEG **1200 × 630**. It contains the actual green mark, live NoCharge name, and existing tagline on a charcoal / dark-green atmospheric background. It already performs the requested share-image job, so R3 does not make a competing one.
- **Game artwork:** the Arcade lists 26 distinct square WebP cover images at 800 × 800. These show recognisable gameplay—cards and diamonds, letter tiles, colored puzzle tiles, grids, board pieces, and other real game states—rather than generic stock illustration. The existing card artwork and source files remain untouched.

## Icon and font system actually present

- The shared CSS has no discovered `@font-face` rule or downloaded WOFF/TTF/OTF resource. It declares `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`; no separate font file is supplied by the inspected pages.
- There is **no detected external icon-font or icon-library dependency** on the audited pages. Icons are authored inline: the brand SVG and a search SVG (`viewBox="0 0 24 24"`, rendered 18 px, 2.2 px rounded stroke). The homepage's “What to expect” list uses concise arrow, target, and diamond glyphs. The guide index uses game-specific emoji/symbol markers. The Tools hub has no image or SVG in its main content; the Guides hub uses text/emoji rather than a shared external icon set.
- This leaves a narrow, real gap: standalone, scalable semantic marks for the existing *category/section labels* do not exist. The 800 px cover art is correctly game-specific and too detailed to substitute for an 18–24 px category icon. The existing search icon, wordmark, guide-card glyphs, covers, and social artwork remain intact.

## Color and component rules

Values are from the live page's `:root` tokens and computed styles:

| Token / role | Live value |
|---|---|
| Page background `--bg` | `#121212` |
| Primary text `--text` | `#e0e0e0` |
| Muted text `--muted` | `#9a9a9a` |
| Panel `--panel` | `#1c1c1c` |
| Raised panel `--panel-2` | `#242424` |
| Hairline `--line` | `#ffffff14` |
| Accent `--accent` | `#0f9d58` |
| Strong accent `--accent-strong` | `#12b66a` |
| Soft accent `--accent-soft` | `#0f9d5829` |
| Danger | `#e05a5a` |
| Standard radius `--radius` | `12px` |
| Panel shadow `--shadow` | `0 18px 48px #00000059` |
| Font `--font` | `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| Main content max `--max` | `72rem` / 1152 px |

The page background is charcoal with subtle green radial atmosphere. Cards are charcoal panels with a very low-contrast white border and 12 px corners; the shared panel shadow is deep and soft. Primary actions are green pills (`#0f9d58`, dark text `#04130e`, 999 px radius); ghost actions use the panel line and no fill. Navigation is quiet/muted until hover or active; the active underline is green. Game-specific card/link accents also use restrained blue, amber, teal, violet, and rose, but the shared NoCharge anchor remains green.

The desktop header is about 74 px tall; at 390 px the compact header is 64 px. Header content is capped at 72rem. The homepage heading is about 92.8 px at 1440 px and 44 px at 390 px, weight 780, line-height 1.05. Main copy and headings retain a strong white-on-charcoal hierarchy.

## Consequence for R3

R3 is limited to **ten text-free, transparent SVG category/section icons**, not a new identity. Each uses the search icon's 24-unit coordinate system and rounded 2.2-unit line language, with only the existing muted gray and green accent. Subjects come from actual NoCharge categories and interaction models. No new tiles, background patterns, invented logo, new wordmark, replacement favicon, replacement game art, or competing share artwork are included.

The ten source files are proposals for optional small markers beside existing text labels/section headings. They are not integrated; the current labels and current per-game guide glyphs remain authoritative unless the user separately instructs otherwise.

## Public reference URLs inspected

- Homepage: `https://nocharge.net/`
- Arcade: `https://nocharge.net/arcade/`
- Guides: `https://nocharge.net/guides/`
- Tools: `https://nocharge.net/tools/`
- Live shared stylesheet: `https://nocharge.net/_astro/BaseLayout.BjtF0ltQ.css`
- Homepage stylesheet: `https://nocharge.net/_astro/index.DvDWU7Hi.css`
- Arcade stylesheet: `https://nocharge.net/_astro/arcade.R4v0FD2K.css`
- Existing favicon: `https://nocharge.net/favicon.svg`
- Existing social image: `https://nocharge.net/social/nocharge-default.jpg`
- Existing cover example: `https://nocharge.net/game-art/memory-match/cover-square.webp`
