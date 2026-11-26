# NoCharge V2 asset library

This tree separates source artwork, optimized derivatives, review packages, and future brand-specific assets. It is independent of the live website bundle; unapproved artwork is not imported by `src/` and is not copied into `public/`.

## Directory map

```text
assets/
  brand/nocharge/batch-01/       R1 generated artwork; visual direction rejected, history retained
    source/       10 original PNG files, preserved unchanged
    optimized/    10 WebP derivatives, preserved unchanged
    review/       Original review files and dated rejection addendum
  brand/nocharge/batch-01-r2/    R2 visual direction rejected; original package preserved unchanged
  brand/nocharge/batch-01-r3/    Supplemental live-site-matched proposals; awaiting review
    source/       10 hand-authored editable 24×24 SVG category/section icons
    optimized/    10 losslessly minified SVG derivatives (not extra assets)
    review/       Contact sheet, individual previews, visual audit, and live-site reference screenshots
  brand/nocharge/batch-01-r3.1/  R3 color-semantics revision; approved 2026-11-16 for its ten manifest-listed targets
    source/       10 versioned editable SVGs; R3 originals remain unchanged
    optimized/    10 losslessly minified derivatives (not extra assets)
    review/       Theme-adaptation audit, light/dark contact sheet, individual previews, rationale
  brand/nocharge/batch-02-r3.1/  10 new adaptive inline tool-entry icons; generated and integrated under Phase 3B instruction
    source/       10 clean-room 24x24 SVGs mapped only to active non-game V2 tool entries
    optimized/    10 losslessly minified inline-SVG derivatives
  homepage-sections/             reserved
  arcade/game-categories/        reserved
  app-experiences/               reserved
  application-identities/
    two-second-witness/          reserved; no artwork generated
    coos-cafe/                   reserved; no artwork generated
  tools/                         reserved
  guides-discover/               reserved
  shop/independent-storefronts/  reserved; no brand/store artwork generated
  decorative/                    reserved
  manifest.csv                   file-level asset register
```

The Phase 1 `public/favicon.svg` and `public/og-nocharge.png` remain unchanged; they are not replacements for or copies of the current live site's assets. The live assets directly audited for R3 (logo, favicon/PWA family, social image, and game covers) were retained as references and not modified. R1 and R2 remain rejected and unused; R3 remains pending and unused. R3.1 is approved only for the ten manifest-listed targets. Phase 3A renders NC09-R3.1 and NC10-R3.1 at the existing Guides and Tools hub headings; the other eight approved game-related icons remain resolver-registered but unrendered, and their artwork and targets remain untouched. Batch 02 is a separate set of ten clean-room adaptive icons integrated only on the published V2 tool cards and detail headings named in its manifest. No Batch 02 icon is assigned to an Arcade/game entry or target.

## Review and approval states

- **Awaiting review** — a proposal exists; it is not approved or production-ready.
- **Approved** — only after explicit user approval, recorded in the manifest; approval is scoped to the asset's manifest-listed UI target and does not authorize another use.
- **Revision required / rejected** — preserve the prior version and history; create any requested revision as a new versioned file. Never overwrite an approved or rejected file.
- **Integrated** — only when an approved asset is actually rendered in its mapped UI slot after a separate integration instruction. Resolver registration alone is not rendered integration; the manifest records the distinction.

Original Batch 01 (R1) was **rejected as a visual direction by the user on 2026-11-16**. Its ten original PNGs, ten WebP derivatives, contact sheet, and initial notes remain preserved as historical review records; do not reuse, overwrite, or integrate them. The dated decision is in `brand/nocharge/batch-01/review/batch-01-decision-2026-11-16.md` and the manifest records this state.

Replacement Batch 01 (R2) was **rejected as a visual direction by the user on 2026-11-16**. Preserve its complete package unchanged as historical reference; do not reuse, overwrite, or integrate it. The manifest records the rejection.

Replacement Batch 01 (R3) contains exactly ten hand-authored editable SVG proposals for real live-site categories/sections that do not currently have reusable compact icon assets. The existing logo, favicon/PWA icons, social image, per-game art, and guide-card glyphs are retained. The contact sheet, individual-preview page, audit, and reference screenshots are review materials, not additional assets; the ten minified SVGs are derivatives. R3 is **awaiting explicit review** and is not integrated.

R3.1 is a **separate, versioned color-semantics revision** of those same ten R3 drawings for light/dark theme use. The R3 source package is unchanged. R3.1 keeps the subjects and geometry, while neutral strokes inherit `currentColor` and green accents/surface knockouts use CSS variables. Its ten source SVGs and ten optimized derivatives are separately registered in `manifest.csv`. The contact sheet, separate previews, and audit are historical review materials; the manifest is the canonical approval/integration record. The user explicitly approved all ten R3.1 icons on 2026-11-16, each **only for its manifest-listed target**. NC09 and NC10 render at the existing Guides and Tools headings. The other eight approved game-related icons remain resolver-registered but unrendered; their artwork and mapping are untouched. Batch 02 is a separate ten-icon set in the same adaptive visual style, explicitly authorized for the published non-game V2 tool entries named in its manifest. Its integration does not broaden R3.1 permissions or assign any icon to an Arcade/game target.

## Phase 3A typed references and rendering conventions

- `src/assets/iconIds.ts` is the semantic ID allowlist. `src/assets/assetRegistry.ts` is the only mapping from those IDs to approved R3.1 and Batch 02 optimized files. Content and component props carry an `AssetIconId`, never an arbitrary file path or URL; unknown/stale runtime IDs fail closed.
- `src/components/AdaptiveIcon.tsx` renders the locally imported SVG inline so `currentColor`, `--nocharge-icon-accent`, and `--nocharge-icon-surface` inherit the active theme. The component applies explicit positive width/height to both wrapper and SVG and removes source-only title/description nodes before assigning semantics for the current use.
- Beside a visible heading/label, the icon is decorative and hidden from assistive technology. If an icon conveys unique meaning, pass concise `alt` text; the SVG receives `role="img"` and a safely escaped accessible name. With no approved ID, the component renders a high-contrast CSS frame/mark—not a pending, rejected, or unrelated image.
- Inline SVG is present eagerly in the DOM and makes no image request, so no `loading` attribute is used. If a future approved asset is external/raster, it must use a separate image-loading implementation with explicit dimensions and appropriate eager/lazy behavior.
- The base light accent is `#0f7d47` and the dark accent is `#12b66a`; both clear 3:1 non-text contrast on the corresponding NoCharge surfaces. `currentColor` supplies the theme's high-contrast neutral strokes. Event/seasonal palettes inherit these semantic icon tokens, avoiding fixed per-icon seasonal colors. Playwright checks both themes and all 16 event palettes.
- Phase 3A uses NC09-R3.1 only in the existing `/guides/` hub heading and NC10-R3.1 only in `/tools/`. Arcade and Experiences headings use the structural fallback. Daily Puzzle, Memory/Word/Tile/Logic/Cards/Board genres, and Pass & Play are not present in Phase 2 V2, so their approved icons are not displayed; in particular, the `memory` tag is not relabeled as a genre and Word Counter is not misrepresented as a word game.
- `npm run test:assets` verifies manifest approval, resolver allowlisting, source/optimized files, SVG constraints, and mapped usage. `npm run test:assets-browser` verifies inline rendering, dimensions, accessibility, fallback behavior, and accent contrast across Light, Dark, and all 16 seasonal palettes.

## Controlled artwork workflow

Each numbered batch contains exactly ten distinct individual source assets. Retain each source, create optimized derivatives where appropriate, record dimensions, format, file size, intended use, and review/integration status in the manifest, prepare readable previews and a short rationale, validate the result, then stop for explicit review. Do not start another batch or integrate artwork without explicit approval and a separate instruction.

No image-generation or image-processing dependency was added to the website project for R2, R3, or R3.1. Those vectors were constructed directly as SVG. R1 and R2 artwork remains preserved for history and is prohibited from reuse by the user's direction.
