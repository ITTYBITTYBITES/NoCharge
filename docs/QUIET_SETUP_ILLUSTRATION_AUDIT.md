# Quiet Setup illustration audit

**Audit date:** 2026-08-23. **Articles audited:** 18. **Mismatches found:** 9. **Fixed:** 9. **Needs human review:** no automated renderer limitations remain for these simple SVG-derived concepts; a post-merge human visual check is still recommended.

The audit rendered the existing 1200px derivatives and compared the visible subject, not only filenames. Correct concepts were retained. The nine repaired concepts use the existing dark slate, teal, and gold programmatic SVG style and were rasterized at 800×450, 1200×675, and 1600×900 in WebP and JPEG.

| Slug | Title | Primary topic | Current illustration | Match | Resolution |
|---|---|---|---|---|---|
| a-low-noise-desk-setup | A Low-Noise Desk Setup | desk-and-comfort | desk-noise-1200.jpg | yes | retained, verified |
| ambient-room-lighting-for-eye-comfort | Ambient Room Lighting for Eye Comfort | lighting | room-lighting-1200.jpg | no → yes | regenerated, verified |
| anti-glare-screen-film-for-gaming-light | Anti-Glare Screen Film for Gaming Light | screens-and-stands | screen-film-1200.jpg | no → yes | regenerated, verified |
| browser-zoom-versus-a-larger-display | Browser Zoom versus a Larger Display | screens-and-stands | zoom-display-1200.jpg | yes | retained, verified |
| cable-management-for-a-calm-desk | Cable Management for a Calm Desk | desk-and-comfort | cables-1200.jpg | no → yes | regenerated, verified |
| calibrating-your-monitor-for-quiet-gaming | Calibrating Your Monitor for Quiet Gaming | screens-and-stands | monitor-calibration-1200.jpg | no → yes | regenerated, verified |
| choosing-a-compact-keyboard-layout | Choosing a Compact Keyboard Layout | keyboards | keyboards-1200.jpg | yes | retained, verified |
| choosing-a-tablet-or-phone-stand | Choosing a Tablet or Phone Stand | screens-and-stands | screens-stands-1200.jpg | yes | retained, verified |
| choosing-an-offline-logic-puzzle-book | Choosing an Offline Logic Puzzle Book | offline-puzzles | puzzles-desk-1200.jpg | yes | retained, verified |
| desk-chair-posture-for-long-quiet-sessions | Desk Chair Posture for Long Quiet Sessions | desk-and-comfort | chair-posture-1200.jpg | no → yes | regenerated, verified |
| desk-lamp-warm-vs-cool-light | Desk Lamp: Warm versus Cool Light | lighting | lamp-light-1200.jpg | no → yes | regenerated, verified |
| foot-rest-and-floor-mat-comfort | Foot Rest and Floor Mat Comfort | desk-and-comfort | footrest-mat-1200.jpg | no → yes | regenerated, verified |
| large-monitor-vs-dual-monitors-for-browser-games | Large Monitor versus Dual Monitors | screens-and-stands | screens-stands-1200.jpg | yes | retained, verified |
| mouse-trackpad-trackball-or-touch | Mouse, Trackpad, Trackball, or Touch | pointing-devices | pointing-1200.jpg | yes | retained, verified |
| open-back-vs-closed-back-headphones-for-long-sessions | Open-Back versus Closed-Back Headphones | audio | headphones-1200.jpg | no → yes | regenerated, verified |
| quiet-keyboard-switches-explained | Quiet Keyboard Switches Explained | keyboards | switches-1200.jpg | yes | retained, verified |
| small-desk-speakers-for-quiet-play | Small Desk Speakers for Quiet Play | audio | speakers-1200.jpg | no → yes | regenerated, verified |
| what-quiet-setup-means | What Quiet Setup Means | desk-and-comfort | hero-1200.jpg | yes | retained, verified |

Article hero references now use the repaired concept names. `npm run validate:setup` and the production build verify that every referenced derivative exists. The route-level image-load check remains recommended in hosted Chrome after CI reports a run.
