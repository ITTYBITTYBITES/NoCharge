---
title: "Designing browser games for more ways to play"
kind: platform
category: accessibility
description: "How NoCharge approaches keyboard, touch, pointer, focus, motion, sound-independent feedback, pause recovery, and manual accessibility testing."
published: "2026-08-19"
updated: "2026-08-19"
author: "NoCharge"
reviewer: "NoCharge"
readTime: 6
topics: ["accessibility", "input", "game design"]
featured: true
draft: false
---

Accessibility is part of a game’s rules and controls, not a note added after the board is finished. NoCharge uses WCAG 2.2 level AA as a design and testing target. That target is not a certification, and an automated pass cannot establish complete support.

## More than one input path

Every current solo game accepts touch and pointer input and provides keyboard operation. Memory Match uses native card buttons. Word Tile Rush exposes letter tiles and submission controls. Color Flip has labeled color controls and keyboard shortcuts. Beacon Lattice uses buttons, a puzzle selector, arrow-key grid movement, number shortcuts, placement, removal, and undo. The Pass &amp; Play games follow the same pattern — five of the six are fully keyboard-operable, and Pass the Picture documents its pointer-only drawing plainly.

Using native links, buttons, and form controls where they fit gives browsers and assistive technologies established semantics. Focus remains visible, and controls need meaningful names—not only an icon or position on a canvas.

## Information beyond color and sound

Color can reinforce state, but it cannot carry the only instruction. Color Flip labels Green, Blue, Amber, and Rose and marks moving tiles with letters. Beacon Lattice prints `0 · Gap`, `1 · Exact`, and `2+ · Overlap`. Memory Match cards have accessible names, while Word Tile Rush exposes selected state and status text.

Sound is optional and shared mute persists locally. A correct move, mismatch, score, or solved state still has visual or textual feedback when audio is muted or unavailable.

## Timing, motion, and recovery

Not every game is untimed. Memory Match and Beacon Lattice have no countdown. Color Flip includes an untimed Turn-based mode alongside its moving Visual mode. Word Tile Rush remains a timed rising-grid game; its timer starts only with the first selected letter.

The platform respects reduced-motion preferences for interface transitions. The shared game shell provides pause, restart, full-screen or immersive controls, and lifecycle recovery. Timed activity pauses when the tab is hidden or the platform privacy dialog opens. Returning to the tab removes the matching automatic pause without overriding a deliberate player pause.

Those details matter because interruption is an input condition too. A game should not turn time spent in another tab into an unexpected loss.

## What automation can and cannot tell us

Chromium Playwright tests cover keyboard interactions, pause/resume, tab return, responsive viewports, and key state announcements. Axe scans detect a useful class of semantic, naming, contrast, and structural problems. Rule tests can verify behavior without a browser.

None of those tools can tell us that every announcement is useful in context, that a board is understandable with a particular screen reader, that touch targets feel workable on a physical phone, or that high-contrast rendering preserves every state. Manual tests with NVDA, VoiceOver, TalkBack, zoom, reduced motion, mobile touch, and Windows High Contrast remain required and are tracked without marking unperformed checks complete.

## Report a barrier

The [Accessibility Statement](/accessibility/) records the current target, supported patterns, limitations, and reporting details. If something prevents play or navigation, email [hello@nocharge.net](mailto:hello@nocharge.net) with the page, browser/device, input method or assistive technology, expected result, and observed barrier.

A specific report is more useful than a broad accessibility claim. It can be connected to the shared shell, a game’s actual rule path, and a reproducible test—the same places where accessible design needs to live.
