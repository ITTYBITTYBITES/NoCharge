# NoCharge brand guide

This guide is the durable record of the NoCharge identity: how the symbol was
designed, which files are canonical, when each variant is used, and how the
public messaging is phrased. It is the reference for the media page
(`/media/`), the downloadable brand package (`/public/brand/`), the media kit
(`/public/media/nocharge-media-kit.zip`), and the favicon/PWA icon package.

Last reviewed: 2026-08-21.

---

## 1. Initial audit (2026-08-21)

Before designing, the repository and production identity were audited:

| Item | Previous state | Finding |
| --- | --- | --- |
| Header mark | Letter `N` in a green gradient tile (`src/styles/global.css` `.brand__mark`) | Provisional letter mark; not a constructed symbol |
| `public/favicon.svg` | Green `N` on charcoal tile using `#0f9d58` | Read as a generic green letter tile; too close to common "green G/N" app icons; not distinct from Google-family marks |
| `favicon.ico` | None | Missing |
| `favicon-16/32/48` | None | Missing |
| Apple touch icon | None (BaseLayout linked `/icons/icon-192.png`) | Missing dedicated 180×180 file |
| PWA icons | `icon-192.png`, `icon-512.png` | Present but single-purpose entries |
| Maskable icons | None | Missing safe-zone variants |
| `manifest.webmanifest` | Accurate name/colors; icons declared `purpose: "any maskable"` on non-maskable assets | Mixed purpose claims; `display: "standalone"` over-stated browser behavior |
| Default OG image | `public/social-card.png` (provisional) | Provisional raster, no text-safe zones, no brand symbol |
| Route social images | Game pages used per-game `social-card.jpg`; Setup used `setup-art/*-1200.jpg`; everything else fell back to the default | Game and Setup routes were correct and preserved; generic routes pointed at the provisional card |
| `og:image:width/height` | Hard-coded `1200×630` on every page | Setup artwork is `1200×675`; corrected via per-page dimensions |
| `twitter:site` | None anywhere | Correct: no handle invented |
| Brand name/description conflicts | "Quick browser games, clear player guides, and no account required" vs "a quieter place to play" and "Quick games. Clear guides. No clutter." | Consistent enough; the audit introduced one canonical one-line description (below) and aligned the media page and manifest with it |
| Game screenshots | `screenshot-desktop.webp`/`screenshot-mobile.webp` for all four games | Only Beacon Lattice's are genuine mounted-DOM captures (see `docs/BEACON_LATTICE_CAPTURE.md`); Memory Match, Word Tile Rush, and Color Flip screenshots are generated previews and are **not** published as gameplay |
| Feeds | `/setup/feed.xml` only | General feed missing; built `/feed.xml` from the changelog collection |
| Sitemap | Covered all public routes except `/media/` | `/media/` added |

### Assets retained

- Game icons, covers, screenshots, guides, and social cards (per-game cards
  remain the social images for game routes).
- Editorial illustrations and Quiet Setup artwork (still used as social images
  on Setup routes).
- Existing `#121212` theme/background and `#0f9d58` accent tokens.

### Assets replaced

- `public/favicon.svg` (provisional letter mark → constructed symbol).
- `public/social-card.png` (provisional default card → deterministic
  `public/social/nocharge-default.{jpg,webp}`).
- Header/footer letter `N` mark → inline SVG symbol.
- Manifest icon purposes and display mode.

### Missing assets added

`favicon.ico` (16/32/48), `favicon-16/32/48x16/32/48.png`,
`apple-touch-icon.png` (180×180), `icons/icon-maskable-{192,512}.png`,
`/public/brand/*` (symbol, lockups, monochrome, press PNGs),
`/public/social/*` (default card, avatar).

---

## 2. Brand strategy

The identity expresses **Quiet Arcade**: browser-native play, clear guides, no
account required, calm and low-pressure interaction, practical utility, and a
small but growing original library. The name NoCharge already communicates the
pricing idea, so the symbol deliberately does **not** depict money, payment, a
crossed-out dollar sign, coins, cards, or "free" stickers, and it must never
suggest gambling, esports, cryptocurrency, shopping, or children's
entertainment.

### Chosen direction — "four tiles, one open doorway"

The symbol is four rounded tiles in a 2×2 grid — one tile per current arcade
game — with the bottom-left tile drawn as an open frame whose outer corner is
cut by a gap. The three solid tiles are the arcade; the open corner is the
entrance. It reads as *a quiet arcade you can walk into*: immediate access,
no barrier, no account, no payment.

Why it fits:

- **Four small tiles** map to the four current games and scale naturally as
  the library grows.
- **An open path/doorway** expresses immediate access without a barrier.
- **Negative space** carries the meaning; nothing about the mark depicts money.
- It stays **distinct** from Beacon Lattice's icon (a grid with a central
  cross), Google/Amazon/GitHub/Cloudflare marks, generic game-controller
  icons, and payment/no-fee icons.
- It survives **16×16**: chunky tiles, 1 px gutters, one 2 px doorway gap
  (verified by `scripts/inspect-favicons.mjs`).

### Concept process

Five symbol concept references were generated in a single batch (≤ 5 images)
with the Arena image-generation tool as a warm-up direction exploration. All
five were rejected for the final mark because generated rasters are not
suitable as a logo (unpredictable geometry at 16 px). The approved direction
was then **reconstructed by hand as clean SVG geometry** on a 64-unit grid.
No generated raster is used as the logo, and none is committed to the
repository.

### Final-logo construction

- Canonical source: `public/brand/nocharge-symbol.svg` (viewBox `0 0 64 64`).
- Grid: tiles `22×22`, corner radius `6.5`, gutters `4`, margins `8`;
  bottom-left door frame uses `stroke-width 6` with an `8`-unit corner gap.
  The grid is designed so 16 px = 4 units and 32 px = 2 units (pixel-aligned
  without re-rasterizing a large icon).
- The mark uses `currentColor`, so it adapts to any context. Raster exports
  use the documented palette below.
- Hand-constructed: 4 rects/shapes + 1 path, no scripts, no external
  resources, no embedded raster, no metadata elements.
- The relationship to the small-size favicon: the favicon is the same geometry
  at 75% footprint on the `#121212` tile; no simplified 16 px variant was
  needed because the 16 px measurements passed (door gap open, door stroke
  visible, tiles solid).

---

## 3. Palette

| Token | Value | Use |
| --- | --- | --- |
| Charcoal | `#121212` | Site background, favicon/PWA tile, social card background, lockup-dark text on light |
| Brand green | `#0f9d58` | Primary symbol colour on dark backgrounds; favicon mark |
| Accent strong | `#12b66a` | Hover/active accents (site token, not a logo colour) |
| Deep green | `#0b7a44` | Symbol on light backgrounds (lockup-light) |
| Off-white | `#f2f2f2` / `#f4f4f4` | Wordmark on dark backgrounds |
| Near-black | `#121212` | Wordmark on light backgrounds |
| Black / white | `#000000` / `#ffffff` | Monochrome symbol variants |

Do not recolor the mark outside these variants.

---

## 4. Typography

- The live site header uses **real HTML text** `NoCharge` with the site font
  stack (Inter first, then system UI fonts). The site does not depend on
  rasterized wordmark text and loads no third-party font service.
- Downloadable lockups are **editable SVG text** using the same documented
  system font stack, weight 700:
  `Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto,
  'DejaVu Sans', 'Liberation Sans', sans-serif`.
  No unlicensed font is embedded.
- Raster press lockups (`nocharge-lockup-*-1200.png`) are rendered with
  DejaVu Sans Bold (a free, widely available system font on Linux runners and
  the local toolchain) so the export is reproducible.
- The wordmark is always written **`NoCharge`** (no spaces, no tagline inside
  the lockup).

---

## 5. Clear space, minimum sizes, and usage rules

- Clear space: keep at least one tile-width (25% of the symbol height) clear
  on all sides of the symbol, and half the symbol height around lockups.
- Minimum sizes: symbol 16 px (favicon) / 24 px in UI; lockups should not be
  reproduced below 120 px wide on screen; the 16 px favicon is the proven
  floor.
- Do not distort, rotate, outline, recolor, redraw, or recombine the symbol
  with other marks.
- Do not place the symbol on busy imagery or on colours that drop the doorway
  gap.
- Do not imply endorsement or sponsorship by NoCharge.
- Do not present generated concept art or previews as gameplay. The only
  genuine mounted-DOM gameplay capture currently published is Beacon
  Lattice's.

---

## 6. Approved descriptions

**One line (media page / elevator):**
> NoCharge is a small browser arcade with original games, practical guides,
> and no account requirement.

**Short biography (profile bio length):**
> NoCharge publishes small browser games with clear guides — no account
> required, scores saved only in this browser.

**Medium description (site, About, media page):**
> NoCharge is a Quiet Arcade: four original browser games with clear rules,
> complete guides, and supporting articles, plus a small shelf of practical
> setup reading. Every game opens and plays directly in the browser — no
> account, download, or installation. Best results and Recently Played are
> kept in the local storage of the device you use, and My Arcade shows a quiet
> summary of what this browser has already saved.

**Press boilerplate (media page):**
> NoCharge is a small browser arcade that publishes original games, clear
> player guides, and practical articles about playing well in the browser.
> The current library has four original games — Memory Match, Word Tile Rush,
> Color Flip, and Beacon Lattice — each playable immediately without an
> account, download, or installation. The site pairs the arcade with a
> reference shelf: a definitive guide for every game, focused articles on
> specific mechanics and platform topics, and Quiet Setup, a collection of
> practical desk-and-device guides. Scores and progress are saved in the local
> browser storage of the device you play on; there is no account system, no
> cloud save, and no synchronization between browsers or devices. NoCharge is
> a general-audience site and is not directed to children.

---

## 7. Voice

Calm, direct, specific, modest, useful. No hype. State what the site actually
does and never promise outcomes, rankings, or scale.

### Avoid claims

- Ad-free (NoCharge shows one labeled AdSense banner on eligible pages)
- Tracking-free (optional analytics exists behind consent)
- Works everywhere / fully accessible / certified accessible (accessibility
  is a reviewed target, not a certification)
- Best browser games / number-one arcade / viral
- Thousands of players / traffic or revenue numbers
- Guaranteed privacy / zero data collection
- Amazon partner or Amazon-sponsored (NoCharge is an Amazon Associates
  participant with disclosed paid links on Quiet Setup, nothing more)

---

## 8. Terminology

- **NoCharge** — the site and brand (always written as one word, this casing).
- **Quiet Arcade** — the product approach: calm, clear, low-pressure play.
- **Browser games** — games that open and play in the browser without install.
- **No account required** — there is no account system at all.
- **Saved in this browser** — local browser storage on the current device.
- **Recently Played** — the local recent-play list.
- **My Arcade** — the browser-local dashboard; never call it a secure private
  account, cloud profile, or synchronized profile.
- **Quiet Setup** — the practical desk-and-device guide section.
- **Affiliate disclosure / Paid link** — Quiet Setup labels its Amazon links;
  no affiliate links appear on the Media page or in feeds.

---

## 9. Favicon export method and icon package

- `npm run art:brand` (`scripts/generate-brand-assets.mjs`) reads the
  canonical symbol SVG and regenerates every raster:
  - `/favicon.svg`, `/favicon.ico` (16/32/48 PNG entries), `/favicon-16x16.png`,
    `/favicon-32x32.png`, `/favicon-48x48.png`
  - `/apple-touch-icon.png` (180×180, full-bleed square)
  - `/icons/icon-{192,512}.png` (rounded tile, `any`)
  - `/icons/icon-maskable-{192,512}.png` (full-bleed, mark inside the central
    80 % safe zone)
  - `/public/brand/*.png` press exports, `/public/social/*` card and avatar
- The script fails clearly when Sharp or the text font is unavailable, never
  writes game or editorial artwork, and never generates gameplay screenshots.
- `npm run inspect:favicons` renders deterministic small-size and mask
  previews into `artifacts/brand-previews/` for review (see
  `docs/BRAND_VISUAL_REVIEW.md`).
- `scripts/validate-brand.mjs` enforces dimensions, ICO entries, maskable safe
  zone, manifest accuracy, and the absence of invented handles.

## 10. Social-card and media-kit generation

- The default social card (`public/social/nocharge-default.{jpg,webp}`,
  1200×630) and avatar (512×512) are composed deterministically from the
  canonical geometry and SVG text — no image generation, no fake gameplay, no
  browser chrome, no statistics. Text sits inside platform safe zones.
- `npm run kit:media` builds `public/media/nocharge-media-kit.zip`
  deterministically (fixed timestamps, stable ordering, deflate). Contents:
  brand SVGs + 512 PNG, dark/light lockup PNGs are *not* duplicated into the
  kit (they are separate downloads); the kit ships the symbol set, social
  card, avatar, four covers, the one genuine screenshot, README.txt and
  FACTS.txt. `scripts/validate-media-kit.mjs` checks the archive contents
  against the committed sources.
- Game screenshots in the kit are genuine mounted-DOM captures only. Memory
  Match, Word Tile Rush, and Color Flip do not yet have genuine captures, so
  they are omitted and the gap is documented on `/media/`.

## 11. Correct and incorrect uses

| Correct | Incorrect |
| --- | --- |
| Symbol alone on clear space | Stretching, rotating, or mirroring the mark |
| Black on light, white on dark, brand green on dark, deep green on light | Adding gradients, shadows, or new colors to the mark |
| Wordmark `NoCharge` in the documented stack | Replacing letters, changing casing, adding taglines |
| Lockups from the approved files | Cropping the doorway, tightening clear space |
| Genuine gameplay captures labeled as screenshots | Presenting generated previews or concept art as gameplay |

## 12. Asset inventory

See `docs/ART_ASSETS.md` for the full inventory, sizes, and regeneration
commands. Brand-specific files are listed in §9 above and in the
`public/brand/`, `public/social/`, and `public/icons/` directories.

## 13. Alt-text decisions

- The header symbol is decorative next to the real `NoCharge` text: hidden
  with `aria-hidden`, and the link carries the accessible name
  `NoCharge home`.
- Media page asset previews get descriptive alt text (e.g., cover alt reuses
  each game's artwork alt). Download links are labeled with the file type and
  format, so the page remains usable with images disabled.

## 14. Review cadence and owner responsibilities

- Review the brand package when the library, palette, or header changes.
- `npm run validate:brand`, `npm run validate:media-kit`, and the post-build
  `npm run validate:brand-media` run in the release checklist.
- Social profile registration, handle verification, and platform terms remain
  owner actions (see `docs/SOCIAL_MEDIA_OWNER_CHECKLIST.md`); the repository
  must not declare unverified handles.
