# Shattered Foil visual parity review

Captures compare the inspected original deployment with the NoCharge rebuild at 1440×1000. All images are unmodified browser captures compressed to WebP.

| Surface | Original | Rebuilt |
| --- | --- | --- |
| Entry | [original](./pr-7/parity/original-entry.webp) | [rebuilt](./pr-7/parity/rebuilt-entry.webp) |
| Studio | [original](./pr-7/parity/original-studio.webp) | [rebuilt](./pr-7/parity/rebuilt-studio.webp) |
| Modes | [original](./pr-7/parity/original-modes.webp) | [rebuilt](./pr-7/parity/rebuilt-modes.webp) |
| Glass Atelier | [original](./pr-7/parity/original-atelier.webp) | [rebuilt](./pr-7/parity/rebuilt-atelier.webp) |
| Daily Window | [original](./pr-7/parity/original-daily.webp) | [rebuilt](./pr-7/parity/rebuilt-daily.webp) |
| Journey | [original](./pr-7/parity/original-journey.webp) | [rebuilt](./pr-7/parity/rebuilt-journey.webp) |
| Settings/music | [original](./pr-7/parity/original-settings.webp) | [rebuilt](./pr-7/parity/rebuilt-settings.webp) |
| Timeline | [original](./pr-7/parity/original-timeline.webp) | [rebuilt](./pr-7/parity/rebuilt-timeline.webp) |
| Atmospheres | [original](./pr-7/parity/original-atmospheres.webp) | [rebuilt](./pr-7/parity/rebuilt-atmospheres.webp) |
| Mobile studio | [original](./pr-7/parity/original-mobile.webp) | [rebuilt](./pr-7/parity/rebuilt-mobile.webp) |

## Intentional differences

- The NoCharge header, breadcrumb, ad policy, guide link, footer, and platform consent manager replace the original standalone shell and duplicate privacy dialog.
- The original advertises five modes but uses shared Klondike move validation and fallback layouts for some modes. The rebuild uses separate pure rules modules.
- IndexedDB replaces scattered original localStorage preference keys and adds validated export/import.
- The rebuild does not copy original inline SVG/CSS/audio tables because the source repository has no declared license file. It recreates copper framing, jewel glass, named card backs, atmospheres, and melodic identity with new code and assets.
- Motion is reduced and continuous shader-like movement is omitted when it would conflict with reduced-motion or gameplay clarity.
