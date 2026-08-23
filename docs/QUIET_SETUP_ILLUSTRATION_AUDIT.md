# Quiet Setup illustration audit

**Audit date:** 2026-08-23 (this branch). **Method:** every published 800×450 JPEG under `public/setup-art/` was opened and visually inspected. Filenames were not treated as evidence. Article frontmatter `artwork` values were then compared to the inspected subject.

**Articles audited:** 18 (8 from PR #20 + 10 from PR #26; no later PR added more). **Mismatches found:** 4. **Fixed:** 4. **Needs human review:** the eight original charcoal-family concepts are painted, not SVG-derived; their subjects are unambiguous in the committed rasters, so they were not flagged for renderer limitations. A post-merge human visual check of the four regenerated concepts is still recommended.

The previous audit on `main` claimed nine mismatches had already been repaired. Visual inspection of those nine repaired rasters shows that four of the claimed repairs are still wrong: two pairs share an identical drawing with only the caption changed, one “desk chair” is a lounge chaise, and the large-versus-dual-monitor article still uses the tablet/phone-stand concept.

## How “matches” was decided

| Article topic | Expected visible subject |
|---|---|
| Calibrating your monitor | A monitor / screen with brightness or colour settings |
| Large monitor vs dual monitors | Monitors — one large display versus two |
| Anti-glare screen film | A screen with film applied |
| Open-back vs closed-back headphones | Headphones |
| Small desk speakers | Speakers on a desk |
| Desk chair posture | A chair / posture illustration |
| Foot rest and floor mat | A foot rest and a mat — not a crossword |
| Desk lamp warm vs cool | A desk lamp with warm / cool tones |
| Ambient room lighting | Room lighting / bias light |
| Cable management | Organized cables |

Art-direction notes from `docs/ART_ASSETS.md` (not used as a match/mismatch gate, but recorded): deep charcoal foundation; muted teal, amber, slate, coral; geometric editorial illustration; **no embedded words**. Several of the 2026-08-23 “repaired” concepts carry large white captions. Those are style defects, not topic mismatches, and are left alone unless the drawing itself is the wrong subject.

## Audit table

| Slug | Title | Primary topic | Current illustration | Match | Notes |
|---|---|---|---|---|---|
| a-low-noise-desk-setup | A low-noise desk setup without “gaming” extras | desk-and-comfort | desk-noise-1200.jpg | yes | Overhead mat, keyboard, mouse, coiled cable, sound arcs. |
| ambient-room-lighting-for-eye-comfort | Ambient room lighting for eye comfort | lighting | room-lighting-1200.jpg | no → yes | Regenerated as a monitor with a warm bias glow. Verified. |
| anti-glare-screen-film-for-gaming-light | Anti-glare screen film for gaming light | screens-and-stands | screen-film-1200.jpg | no → yes | Regenerated as a monitor with a matte film and lifted corner. Verified. |
| browser-zoom-versus-a-larger-display | Browser zoom versus a larger display | screens-and-stands | zoom-display-1200.jpg | yes | Two monitors: few large bars versus many small bars. |
| cable-management-for-a-calm-desk | Cable management for a calm desk | desk-and-comfort | cables-1200.jpg | yes | Desk slab with two routed cable curves. Crude, but the subject is cables. |
| calibrating-your-monitor-for-quiet-gaming | Calibrating your monitor for quiet gaming | screens-and-stands | monitor-calibration-1200.jpg | yes | Monitor with settings-like bars. Same drawing as `screen-film`, but this article is the one the drawing actually describes. |
| choosing-a-compact-keyboard-layout | Choosing a compact keyboard layout for browser games | keyboards | keyboards-1200.jpg | yes | Three distinct keyboards. |
| choosing-a-tablet-or-phone-stand | Choosing a tablet or phone stand for browser play | screens-and-stands | screens-stands-1200.jpg | yes | Tablet on a stand and phone on a stand. Correct for this article. |
| choosing-an-offline-logic-puzzle-book | Choosing an offline logic-puzzle book | offline-puzzles | puzzles-desk-1200.jpg | yes | Open puzzle book and pencil. |
| desk-chair-posture-for-long-quiet-sessions | Desk chair posture for long quiet sessions | desk-and-comfort | chair-posture-1200.jpg | no → yes | Regenerated as an upright seated figure at a desk chair. Verified. |
| desk-lamp-warm-vs-cool-light | Desk lamp warm versus cool light | lighting | lamp-light-1200.jpg | yes | Desk lamp with warm/cool arcs. Same drawing as `room-lighting`, but this article is the one it describes. |
| foot-rest-and-floor-mat-comfort | Foot rest and floor mat comfort | desk-and-comfort | footrest-mat-1200.jpg | yes | Raised rest on a floor mat. Not a crossword. |
| large-monitor-vs-dual-monitors-for-browser-games | Large monitor versus dual monitors for browser games | screens-and-stands | large-dual-monitors-1200.jpg | no → yes | New concept: one large display beside a dual-monitor pair. `screens-stands` stays on the tablet/phone-stand article. Verified. |
| mouse-trackpad-trackball-or-touch | Mouse, trackpad, trackball, or touch as a game input method | pointing-devices | pointing-1200.jpg | yes | Mouse, trackpad, trackball, touch surface. |
| open-back-vs-closed-back-headphones-for-long-sessions | Open-back versus closed-back headphones for long sessions | audio | headphones-1200.jpg | yes | Over-ear headphones. |
| quiet-keyboard-switches-explained | Quiet keyboard switches explained without the jargon | keyboards | switches-1200.jpg | yes | Three cutaway key switches. |
| small-desk-speakers-for-quiet-play | Small desk speakers for quiet play | audio | speakers-1200.jpg | yes | Two boxes on a desk line. |
| what-quiet-setup-means | What Quiet Setup means | desk-and-comfort | hero-1200.jpg | yes | Monitor, keyboard, mouse, puzzle cubes. |

## Totals

| Measure | Count |
|---|---|
| Articles audited | 18 |
| Matches | 14 |
| Mismatches | 4 |
| Fixed in this audit commit | 0 (audit only) |
| Could not be auto-audited / needs human review | 0 flagged as unreadable. Recommend a post-merge glance at the four regenerated concepts. |

## Fixes applied

1. `ambient-room-lighting-for-eye-comfort` — regenerated `room-lighting` as bias / room light behind a monitor.
2. `anti-glare-screen-film-for-gaming-light` — regenerated `screen-film` as a monitor with a matte film applied.
3. `desk-chair-posture-for-long-quiet-sessions` — regenerated `chair-posture` as a desk chair with upright seated posture.
4. `large-monitor-vs-dual-monitors-for-browser-games` — new concept `large-dual-monitors` (one large display beside a dual-monitor pair). The `screens-stands` files stay with the tablet/phone-stand article.

Retained as-is (topic-correct): `hero`, `keyboards`, `pointing`, `screens-stands`, `puzzles-desk`, `switches`, `zoom-display`, `desk-noise`, `cables`, `monitor-calibration`, `lamp-light`, `footrest-mat`, `headphones`, `speakers`.

Generation used programmatic SVG composition in the Quiet Setup charcoal / teal / amber / slate palette, rasterized at 800×450, 1200×675, and 1600×900 in WebP and JPEG. No AI-generated rasters. No embedded words. In-page heroes keep `alt=""` because the article title sits immediately above them. Playwright checks on each repaired route assert the hero loads (no 404) and has non-zero natural dimensions.
