---
title: Game Mode — the viewport state
description: What NoCharge's Game Mode does, how to enter and exit it, and how the shared game shell keeps controls reachable on small screens.
published: '2026-08-27'
updated: '2026-08-27'
topic: interface
readTime: 4
order: 7
faqs:
  - q: 'Does Game Mode work on every browser?'
    a: 'Fullscreen requires the browser''s Fullscreen API permission. NoCharge also has a fallback "Focus mode" that fills the viewport without fullscreen, so the layout still works when fullscreen is unavailable.'
  - q: 'How do I exit Game Mode?'
    a: 'Press Escape or use the toolbar''s exit control. The toolbar exit is the first control in Game Mode so a thumb or keyboard user can find it immediately.'
  - q: 'Does Game Mode change game rules or difficulty?'
    a: 'No. It only changes the container: it removes page chrome and rearranges toolbar controls so the board has more room.'
---

**Bottom line:** Game Mode is a shared viewport state that gives the board more room by hiding page chrome. The game viewport fills the screen (fullscreen when the browser allows it, otherwise a "Focus mode" fallback), the toolbar collapses into an icon bar, and Escape or the toolbar exit returns to the normal page.

## How to enter and exit

- **Enter:** the toolbar's "Focus mode" button (desktop) or the Game Mode entry in Game settings (mobile compact toolbar).
- **Exit:** Escape, or the exit control that leads the toolbar in Game Mode so it is the first thing a thumb reaches.
- **Fallback:** when the Fullscreen API is unavailable or denied, NoCharge's immersive fallback fills the viewport with the same compact chrome.

## What changes

- Page header, footer, related content, and ads are out of view.
- The toolbar becomes a single icon bar; Pause, Mute, Settings, and Exit remain in the same Document order (icon‑only visually, full accessible names).
- The status line moves below the stage instead of pushing the board down.

## What does not change

- Game rules, difficulty, modes, and saved state.
- Keyboard focus order and accessible names.
- Pause-on-hidden behavior: audio still stops and the game pauses when the page hides.

## Limits

Game Mode is a viewport improvement, not a performance boost or a networking feature. It does not change device rendering; a heavy board still depends on the device's browser and hardware. NoCharge does not claim a measurable frame-rate improvement.

## Related reading

- [Zoom Visualizer](/tools/zoom-visualizer/)
- [Accessibility](/accessibility/)
- [Game pages glossary of shell terms](/learn/glossary/#game-mode)
