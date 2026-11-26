# Batch 02 · adaptive tool-entry icons

**Asset count:** 10 distinct, hand-authored source SVGs plus 10 losslessly minified derivatives.\
**Format / dimensions:** transparent SVG, `viewBox="0 0 24 24"`, explicit 24 × 24 px.\
**Style:** follows the NC09/NC10 R3.1 treatment: neutral linework inherits `currentColor`; green details use `--nocharge-icon-accent`; recessed centers use `--nocharge-icon-surface`.\
**Scope:** the ten mapped Phase 3B tools only. No Arcade/game entry receives Batch 02 artwork.\
**Authorization:** explicitly scoped to the manifest-listed active non-game V2 tool targets on 2026-11-16.\
**Integration:** each semantic ID is assigned to one published tool entry and rendered inline in its `ContentCard` and detail-page heading by `AdaptiveIcon`; no external image request is made.

## Asset map

| Manifest ID | Tool path | Semantic ID | Subject | Source | Optimized derivative |
|---|---|---|---|---|---|
| NC11-B02-R3.1 | `/tools/discovery-wheel/` | `discovery-wheel-tool` | Segmented selector wheel | `source/nc11-b02-r3-1-discovery-wheel.svg` | `optimized/nc11-b02-r3-1-discovery-wheel-min.svg` |
| NC12-B02-R3.1 | `/tools/game-finder/` | `game-finder-tool` | Search lens and filter marks | `source/nc12-b02-r3-1-game-finder.svg` | `optimized/nc12-b02-r3-1-game-finder-min.svg` |
| NC13-B02-R3.1 | `/tools/session-planner/` | `session-planner-tool` | Clock and planning line | `source/nc13-b02-r3-1-session-planner.svg` | `optimized/nc13-b02-r3-1-session-planner-min.svg` |
| NC14-B02-R3.1 | `/tools/random-activity/` | `random-activity-tool` | Crossing unweighted shuffle arrows | `source/nc14-b02-r3-1-random-activity.svg` | `optimized/nc14-b02-r3-1-random-activity-min.svg` |
| NC15-B02-R3.1 | `/tools/ambient-mixer/` | `ambient-mixer-tool` | Sound waves and control point | `source/nc15-b02-r3-1-ambient-mixer.svg` | `optimized/nc15-b02-r3-1-ambient-mixer-min.svg` |
| NC16-B02-R3.1 | `/tools/singing-bowl-engine/` | `singing-bowl-tool` | Bowl silhouette and resonance | `source/nc16-b02-r3-1-singing-bowl-engine.svg` | `optimized/nc16-b02-r3-1-singing-bowl-engine-min.svg` |
| NC17-B02-R3.1 | `/tools/reduced-motion-tester/` | `reduced-motion-tool` | Motion trace and calm marker | `source/nc17-b02-r3-1-reduced-motion-tester.svg` | `optimized/nc17-b02-r3-1-reduced-motion-tester-min.svg` |
| NC18-B02-R3.1 | `/tools/touch-target-checker/` | `touch-target-tool` | Pointer and measurement marks | `source/nc18-b02-r3-1-touch-target-checker.svg` | `optimized/nc18-b02-r3-1-touch-target-checker-min.svg` |
| NC19-B02-R3.1 | `/tools/storage-inspector/` | `storage-inspector-tool` | Local key drawers and lens | `source/nc19-b02-r3-1-storage-inspector.svg` | `optimized/nc19-b02-r3-1-storage-inspector-min.svg` |
| NC20-B02-R3.1 | `/tools/zoom-visualizer/` | `zoom-visualizer-tool` | Viewport frame and lens | `source/nc20-b02-r3-1-zoom-visualizer.svg` | `optimized/nc20-b02-r3-1-zoom-visualizer-min.svg` |

The capped batch leaves five Phase 3B tools without new artwork: Nonogram Clue Calculator, Solitaire Rules Comparator, Sudoku Pencil-Mark Helper, Keyboard Focus Order Demo, and Word Scoring Formula Explorer. The existing eight approved but unmapped game-related R3.1 assets retain their original IDs, files, mappings, and targets; none is repurposed.

## Validation and scope

`assets/manifest.csv` is the canonical file-level record. `src/assets/iconIds.ts` is the typed semantic allowlist and `src/assets/assetRegistry.ts` is the only runtime SVG mapping. `asset-registry-test.mjs` checks the manifest, approval scope, source/derivative byte counts, dimensions, SVG safety, resolver paths, exact tool assignments, and preservation of the original R3.1 target split. `playwright-asset-test.mjs` checks inline rendering, theme-aware color, decorative semantics, dimensions, contrast, and responsive overflow across Light, Dark, all 16 event palettes on mobile, plus desktop checks for both themes. The content browser suite also checks Batch 02 rendering in tool cards and detail headings.

The source and optimized files are distinct recorded assets; the derivatives are losslessly minified. The Batch 01 R3.1 artwork is unchanged by this batch. Rejected R1/R2 and pending R3 proposals remain outside the runtime resolver.
