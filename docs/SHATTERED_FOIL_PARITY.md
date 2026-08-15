# Shattered Foil parity inventory

**Original inspected:** `ITTYBITTYBITES/ITTYBITTYBITES-Shattered-Foil` (`main`) and `https://ittybittybites.github.io/ITTYBITTYBITES-Shattered-Foil/` on August 15, 2026.

The original is a 160 KB single-file application. It visibly offers five modes, Glass Atelier, Daily Window, Journey, audio/settings, four atmospheres, accessibility options, timeline, and win presentation. Inspection found distinct original deals for Klondike, Spider, and FreeCell, while TriPeaks/Pyramid fell through to a seven-column layout and shared Klondike move validation. The rebuild preserves the represented product but uses separate rules modules for all five modes.

| Area | Original behavior | New implementation | Tests | Status |
|---|---|---|---|---|
| Entry experience | Sponsor splash, preloader, title and product line | Native NoCharge entry/studio with original title and “Fragments of beauty, brought together.” | `shattered-parity.spec.ts` | Complete |
| Klondike | Draw 1 UI; selector advertises Draw 3; undo/hint/timeline | Deterministic Draw 1/3, legal tableau/foundation/stock, undo, score, win | `deal`, `moves`, `scoring`, browser suites | Complete |
| Spider | 104 cards, 10-column deal; shared original movement | Dedicated packed-suit sequence, stock-row, completed-run and win engine | `modes.test.ts`, parity browser test | Complete |
| FreeCell | Eight cascades/free cells; shared original movement | Dedicated capacity, cells, cascades, foundations and win engine | `modes.test.ts`, parity browser test | Complete |
| TriPeaks | Visible selector; original fallback deal | Three-peak blockers, ±1/wrap matching, stock, streak score, win/loss | `modes.test.ts`, parity browser test | Complete |
| Pyramid | Visible selector; original fallback deal | 28-card exposure graph, total-13 pairs, Kings, stock/waste, win/loss | `modes.test.ts`, parity browser test | Complete |
| Daily challenge | Seed label, play action, star seal | Stable UTC key/seed, canonical result and transactional rewards | `platform.test.ts`, parity browser test | Complete |
| Streak calendar | Static 14-day/month presentation | Current/longest streak, monthly keys, UTC month/year transitions | `platform.test.ts`, parity browser test | Complete |
| Journey | Claims five realms; three shown with static progress | Five realms, 50 seeded deals, star gates, resume markers and rewards | `platform.test.ts`, parity browser test | Complete |
| Stars | Daily/Journey stars represented | Transactional local star rewards and realm gates | `platform.test.ts` | Complete |
| Shards | Header balance | Transactional local rewards and purchases; no cash value | `platform.test.ts` | Complete |
| Themes | Atelier unlock/equip | Data-driven 24-entry functional Atelier catalog | parity browser test | Complete |
| Card backs | Six original inline SVG definitions; UI claims 24 decks | 24 inventory entries, six named originals plus recreated collection, persisted equip | parity browser test | Complete |
| Atmospheres | Dark, Sapphire, Amethyst, Obsidian | Four persisted, responsive, reduced-motion-safe atmosphere classes | settings browser test | Complete |
| Music | Ten synthesized named loops, rotate/select/skip/audition/volume | Ten newly synthesized named movements, lazy interaction start, rotate/select/skip/audition/volume/hidden pause | settings browser test | Complete |
| Foley effects | Glass tap, copper snap, foundation chime, fanfare | Newly synthesized four-effect controller, volume and test control | settings browser test | Complete |
| Haptics | Not implemented in inspected source | Safely detected optional haptic feedback and persistence | settings browser test | Complete |
| Move history | Reverse chronological descriptions, deltas, time | Durable descriptions, score deltas, elapsed time in `moveHistory` | timeline unit/browser tests | Complete |
| Timeline scrubber | Destructive undo toward chosen step | Non-mutating inspection, backward/forward/live controls, explicit restore and future truncation | `platform.test.ts`, browser test | Complete |
| Left-handed mode | Mirrors top-row ordering | Persisted mirrored layout | signature browser test | Complete |
| Four-color suits | Blue/green suit palette | Persisted labeled four-color palette | signature/axe tests | Complete |
| Privacy controls | Duplicate standalone consent | Delegates to NoCharge consent; consent never enters game DB | consent/settings tests | Complete |
| Save/resume | Resume copy without complete serialized multi-mode state | IndexedDB multi-mode sessions, per-move autosave, legacy migration, latest resume | persistence and browser tests | Complete |
| Win presentation | WINDOW ASSEMBLED score/steps/time modal | Accessible WINDOW ASSEMBLED panel with score, steps, time and next deal | engine and axe tests | Complete |

## Storage and cross-origin migration

The old GitHub Pages origin and `nocharge.net` cannot share browser storage. NoCharge uses versioned JSON export/import and starts a new local profile unless the old deployment is separately updated to export. Details are in `SHATTERED_FOIL_MIGRATION.md`. Consent remains exclusively in the existing NoCharge system.

## Visual and asset review

Original/rebuilt captures and intentional differences are in `SHATTERED_FOIL_VISUAL_PARITY.md`. Exact reuse and recreation are listed in `SHATTERED_FOIL_ASSET_PROVENANCE.md`.
