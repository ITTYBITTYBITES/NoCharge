# NoCharge visual identity proposal · Batch 01 replacement (R2)

**Review state:** Proposed · awaiting explicit user review\
**Production state:** Not approved · not integrated\
**Scope:** Ten unique, manually authored SVG assets, grounded in the existing NoCharge V2 website. These files are kept in the asset library only; no website component, route, or production asset has been changed.

## Design direction: modular wayfinding

The existing site already establishes the right foundation: a warm paper canvas, dark editorial typography, a lime NoCharge mark, coral highlights, rounded cards, large headings, and five clear destination paths. The first Batch 01 artwork direction is rejected and archived; this replacement deliberately avoids its illustration-led/orbit treatment.

R2 proposes an orderly system of **rounded tiles, a solid geometric N, restrained section colors, and strong live typography**. The five-tile homepage composition reflects the actual five homepage destinations; four companion marks map to Arcade, App Experiences, Tools, and Guides. Graphics are functional and sparse, not stock illustrations, fake screenshots, or free-floating decoration.

## Website inspection and placement basis

Inspected the running site (`http://127.0.0.1:5173/`), its homepage and navigation source/CSS, and desktop/mobile screenshots. At 1440 px, the header is 84 px tall, the content column is 1220 px, the home hero art slot is 500 × 450 px (1.111:1), and destination-row icon tiles are 52 px square. At 390 px, the header is 68 px, page margins are 18 px, the home hero art slot is 302 × 290 px, row-icon tiles are 42 px square, and the mobile menu opens in two columns. Both tested widths had no horizontal overflow or browser errors.

The asset sizes reflect those placements: logo variants suit the current 42 px desktop / 36 px mobile mark; the homepage composition uses the exact desktop-art ratio and remains close to the mobile slot; the favicon is 64 × 64 to match the existing browser-icon dimensions; and social artwork is 1200 × 630, matching the current Open Graph dimensions. The featured-card treatment is a transparent 720 × 420 art-slot graphic, not a screenshot or replacement card component.

## Palette

These colors are drawn from the current design tokens and destination panels, not invented independently:

| Role | Value | Use |
|---|---|---|
| Ink | `#20252b` | Wordmarks, symbols, primary graphic strokes |
| Paper | `#f7f6ef` | Site canvas and the intentional social-image backdrop |
| Strong paper | `#fffefa` | Light card and logo-surround surface |
| Signature lime | `#d8f27c` | Primary mark tile and selective emphasis |
| Deep olive | `#3a4f17` / `#626c33` | High-contrast text on lime / existing eyebrow accent |
| Coral | `#ff775d` | Small wayfinding accent; not a second dominant color |
| Sky | `#b9e6f1` | Tools section tint |
| Lilac | `#d9cef7` | Guides section tint |
| Yellow | `#f4d975` | Discover section tint |
| Mint | `#cce8d6` | Optional supporting tint already present in the system |

The category strip and hero composition use the current panel tints: Arcade `#d9f18a`, Experiences `#f8cfbd`, Tools `#c1e8f1`, Guides `#ded5f8`, and Discover `#f5df83`. Lime and ink remain the identity anchors; the other colors are reserved for their existing section roles.

## Type, logo, and symbol rules

- Keep the site's existing system-first sans-serif stack: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. The assets do not load remote fonts or turn text into outlines.
- The wordmark is editable SVG `<text>`: **No** at a heavy weight, **Charge** at a medium weight, with tight but readable tracking. Preserve exact spelling and title case.
- Use NC01 as the standalone wordmark on spacious, large-format brand surfaces; NC02 as the standalone mark; NC03 when both name and mark must fit a compact header/footer; NC04 only for favicon/browser-icon contexts.
- Give the logo clear space of at least one quarter of the mark-tile width. Keep the symbol upright and undistorted; do not add outlines, gradients, glows, or unapproved wording. The favicon's lime tile reaches the icon canvas edges, with transparent rounded corners; the standalone symbol and lockup have transparent canvas around the tile.

## Geometry, backgrounds, and combinations

- Use a 1:1 rounded-square tile as the core module. Existing site cards use roughly 18–30 px corner radii; reproduce that softness proportionally rather than introducing sharp, unrelated shapes.
- Align repeated tiles and marks to a regular grid with generous gaps. Keep coral to small markers; don't use all section colors in every asset.
- NC05's five equal color-coded tiles are a homepage-only summary composition. NC08 is the reusable four-section identity strip. NC06 is a low-contrast, transparent repeat tile; NC07 is a hairline divider; NC09 is a subtle card-art-slot frame. Treat all three as optional placement-specific assets, not decoration to apply everywhere.
- Keep backgrounds transparent unless the use requires a filled surface. NC10's warm-paper background is deliberately opaque because social preview services expect a dependable share image. NC04 uses an edge-to-edge lime tile with transparent rounded corners.
- When sizing, use `contain` rather than cropping the vector marks. For the mobile home-hero slot, center the near-square NC05 composition and leave clear space; no text is embedded in it.

## The ten proposals

| ID | Source file | Dimensions | Intended placement |
|---|---|---:|---|
| NC01-R2 | `nc01-r2-primary-wordmark.svg` | 520 × 120 | Primary text-only wordmark for large brand placements |
| NC02-R2 | `nc02-r2-brand-symbol.svg` | 120 × 120 | Standalone recognizable brand symbol / avatar |
| NC03-R2 | `nc03-r2-compact-logo-lockup.svg` | 340 × 100 | Compact mark + wordmark lockup for header/footer |
| NC04-R2 | `nc04-r2-browser-icon.svg` | 64 × 64 | Favicon and browser shortcut icon |
| NC05-R2 | `nc05-r2-homepage-hero-composition.svg` | 600 × 540 | Homepage hero visual for the five real destination paths |
| NC06-R2 | `nc06-r2-repeating-brand-pattern.svg` | 240 × 120 | Seamless, subtle section-background pattern |
| NC07-R2 | `nc07-r2-section-divider.svg` | 1200 × 96 | Optional divider between major site sections |
| NC08-R2 | `nc08-r2-section-identity-strip.svg` | 680 × 156 | Shared Arcade, Experiences, Tools, and Guides identity strip |
| NC09-R2 | `nc09-r2-feature-card-treatment.svg` | 720 × 420 | Transparent frame/accent for featured or promotional card art slots |
| NC10-R2 | `nc10-r2-social-sharing-artwork.svg` | 1200 × 630 | Social sharing artwork; editable SVG source plus PNG review/output derivative |

## Implementation and review notes

- All ten source files are original, hand-authored, editable SVG. No image-generation tool was used. Wordmark and social text remain live vector text.
- The `optimized/` directory contains lossless minified SVG copies. The vectors are already small (about 0.5–2 KB); minification saves roughly 4–18%. NC10 also has a 1200 × 630 PNG raster derivative for social-preview compatibility. These derivatives are not additional assets.
- The batch is **pending review only**. No proposal is classified as approved or production-ready, and none is integrated into `public/` or website components.
- Two Second Witness and Coo's Cafe remain free to establish their own later identities; this platform system does not prescribe their branding.
