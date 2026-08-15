# NoCharge art direction

This is the implementation reference for the **Quiet Arcade** visual system. It is intentionally short: use it when making components and game asset packages.

## Platform palette

| Token | Value | Use |
| --- | --- | --- |
| Charcoal 950 | `#121212` | Page background |
| Charcoal 900 | `#171a18` | Artwork background |
| Charcoal 800 | `#1c1c1c` | Primary panels |
| Charcoal 700 | `#242424` | Raised panels and card faces |
| Mist 100 | `#e0e0e0` | Primary text |
| Mist 400 | `#9a9a9a` | Secondary text |
| Emerald 500 | `#0f9d58` | Platform actions |
| Emerald 400 | `#12b66a` | Focus, links, and luminous details |
| Emerald 200 | `#91e8ba` | Small highlights on dark artwork |
| Coral 500 | `#e05a5a` | Errors and destructive states only |

Game accents identify a title; they do not replace the platform emerald for global actions. Each game gets one AA-tested primary accent and, if needed, one lighter highlight. Use the accent for artwork paths, metadata, and restrained borders. Never use it as the only carrier of state.

## Type and spacing

Use the existing system sans-serif stack. The functional type scale is `12 / 14 / 16 / 18 / 21 / 28 / 40 / 56px`; responsive display text may interpolate between adjacent steps. Body copy stays at 16px with at least 1.55 line height.

Use a 4px spacing base: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px`. Prefer these values over one-off gaps.

## Shape language

Radii are `6px` for small controls, `12px` for cards and panels, `18px` for artwork frames, and `999px` only for pills. Game icons use a square view box, rounded outer geometry, consistent 1.5–2px strokes at 48px, and a small number of bold geometric forms. Memory Match derives its mark from two offset, paired cards and a shared diamond glyph.

## Illustration and texture

- Use large dark negative space, paired geometric forms, thin luminous paths, and soft—not saturated—glow.
- Build depth with two or three tonal planes rather than photorealistic lighting.
- Use original abstract forms only; no stock imagery, borrowed game art, or visual imitation of another title.
- Texture is optional and must remain subtle: monochrome grain at 2–4% opacity, never behind body text, and never large enough to become visible compression noise.
- Do not bake body copy into raster artwork. Social artwork may contain a short brand/title lockup only when a platform requires it.

## Motion

- Control feedback: `120–180ms`.
- Card and artwork transitions: `200–300ms`.
- Content reveal: no more than `300ms` and only when it helps orientation.
- Do not continuously animate artwork on mobile or near active gameplay.
- Animate opacity and transforms, not layout dimensions. Respect `prefers-reduced-motion` without exception.

## Image ratios and naming

Each game package lives at `public/game-art/<game-slug>/` and uses lowercase kebab-case names:

- `icon.svg` — `1:1`
- `cover-square.webp` — `1:1`, source size 800×800
- `cover-landscape.webp` — `16:9`, source size 1280×720
- `social-card.webp` — `1200×630`
- `guide-header.webp` — `2:1`, source size 1280×640
- Matching `.jpg` files provide the safe fallback for artwork rendered through `<picture>`.
- `screenshot-mobile.webp` — portrait capture, 720×1280 target
- `screenshot-desktop.webp` — landscape capture, 1440×900 target
- `controls-diagram.svg` and `scoring-diagram.svg` — responsive vector diagrams

AVIF may be added when it is at least 15% smaller than the equivalent WebP at comparable visual quality. Components must still provide a normal `img` fallback.

## Performance budgets

| Asset | Maximum transfer size |
| --- | ---: |
| SVG icon or diagram | 20 KB |
| Square cover | 90 KB |
| Landscape cover | 130 KB |
| Guide header | 130 KB |
| Social card | 160 KB |
| Mobile screenshot | 140 KB |
| Desktop screenshot | 180 KB |

The homepage must not preload game-card artwork. Below-the-fold media is lazy-loaded. Only an image confirmed to be the page LCP may use eager loading and `fetchpriority="high"`. Every raster image has explicit width and height to prevent layout shift.

## Artwork accessibility

- Provide useful alt text when the image adds information or establishes the game identity.
- Use empty alt text for repeated or purely decorative artwork; never repeat an adjacent heading verbatim.
- Diagrams need alt text plus a visible caption or nearby prose that communicates the same instructions.
- Keep essential labels in HTML whenever possible. If labels are required in SVG, preserve readable text and do not rely on color alone.
- Check text and controls layered over artwork to WCAG 2.2 AA. Artwork itself must not reduce focus visibility.
- Avoid rapid flashes, dense visual vibration, and color-only distinctions.
